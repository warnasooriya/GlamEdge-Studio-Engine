import { Request, Response } from "express";
import { prisma } from "@/config/prisma";
import { HttpError } from "@/middlewares/errorHandler";
import { storageProvider } from "@/services/storage";
import { convertLkrToUsd } from "@/services/fx/exchangeRateService";
import { createOrder, captureOrder } from "@/services/paypal/paypalService";
import { appointmentBillingInclude, finalizeInvoice } from "@/modules/billing/billing.service";
import { emitToTenant } from "@/realtime/socket";

const PAYPAL_PAYMENT_INCLUDE = {
  tenant: true,
  appointment: { include: { services: { include: { service: true } } } },
} as const;

async function getPaypalPaymentOr404(id: string) {
  const payment = await prisma.paypalPayment.findUnique({ where: { id }, include: PAYPAL_PAYMENT_INCLUDE });
  if (!payment) throw new HttpError(404, "Payment link not found");
  return payment;
}

// Public — a customer opens this from a WhatsApp link with no account of their
// own, so the unguessable UUID in the URL is the only access token, the same
// trust model this app already uses for signed storage URLs and salon slugs.
export async function getPaypalPaymentInfo(req: Request, res: Response) {
  const payment = await getPaypalPaymentOr404(req.params.id);

  // Recomputed on every load (not cached from link-creation time) since a
  // pending link can sit for hours/days and PayPal doesn't settle in LKR.
  const amountUsd =
    payment.status === "PENDING"
      ? (await convertLkrToUsd(Number(payment.amountLkr))).amountUsd
      : payment.amountUsd
        ? Number(payment.amountUsd)
        : null;

  return res.json({
    success: true,
    payment: {
      id: payment.id,
      status: payment.status,
      amountLkr: Number(payment.amountLkr),
      amountUsd,
      salonName: payment.tenant.salonName,
      logoUrl: payment.tenant.logoUrl ? await storageProvider.resolveUrl(payment.tenant.logoUrl) : null,
      clientName: payment.appointment.clientName,
      services: payment.appointment.services.map((s) => s.service.name),
    },
  });
}

export async function createPaypalOrder(req: Request, res: Response) {
  const payment = await getPaypalPaymentOr404(req.params.id);
  if (payment.status !== "PENDING") throw new HttpError(400, "This payment link is no longer active");
  if (!payment.tenant.paypalEmail) throw new HttpError(400, "This salon hasn't set up PayPal yet");

  const { amountUsd, fxRate } = await convertLkrToUsd(Number(payment.amountLkr));

  const { orderId } = await createOrder({
    amountUsd,
    payeeEmail: payment.tenant.paypalEmail,
    customId: payment.id,
    description: `${payment.tenant.salonName} — ${payment.appointment.clientName}`,
  });

  await prisma.paypalPayment.update({
    where: { id: payment.id },
    data: { paypalOrderId: orderId, amountUsd, fxRate },
  });

  return res.json({ success: true, orderId });
}

export async function capturePaypalOrder(req: Request, res: Response) {
  const payment = await getPaypalPaymentOr404(req.params.id);

  if (payment.status === "COMPLETED") {
    return res.json({ success: true, alreadyCompleted: true });
  }
  if (payment.status !== "PENDING" || !payment.paypalOrderId) {
    throw new HttpError(400, "This payment link is not ready to be captured");
  }
  if (payment.appointment.isBilled) {
    // Shouldn't happen (the POS UI hides the normal billing controls while a
    // PayPal link is pending) but never silently double-bill if it does.
    throw new HttpError(409, "This appointment was already billed through another payment method");
  }

  const capture = await captureOrder(payment.paypalOrderId);
  if (capture.status !== "COMPLETED") {
    throw new HttpError(402, `PayPal payment was not completed (status: ${capture.status})`);
  }

  await prisma.paypalPayment.update({
    where: { id: payment.id },
    data: {
      status: "COMPLETED",
      paypalCaptureId: capture.captureId,
      payerEmail: capture.payerEmail,
      completedAt: new Date(),
    },
  });

  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: { id: payment.appointmentId },
    include: appointmentBillingInclude,
  });
  const finalized = await finalizeInvoice(appointment, "PAYPAL");

  emitToTenant(payment.tenantId, "payment:captured", { appointmentId: appointment.id });

  return res.json({ success: true, ...finalized });
}
