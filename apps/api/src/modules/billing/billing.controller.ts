import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middlewares/requireAuth";
import { HttpError } from "@/middlewares/errorHandler";
import { storageProvider } from "@/services/storage";
import { sendWhatsAppText } from "@/services/whatsapp/whatsappService";
import { parsePagination, paginationMeta } from "@/utils/pagination";
import { env } from "@/config/env";
import { createInvoiceSchema } from "./billing.schema";
import { appointmentBillingInclude, finalizeInvoice } from "./billing.service";

export async function createInvoice(req: AuthRequest, res: Response) {
  const { paymentMode } = createInvoiceSchema.parse(req.body);

  const appointment = await prisma.appointment.findFirst({
    where: { id: req.params.appointmentId, tenantId: req.tenantId! },
    include: appointmentBillingInclude,
  });
  if (!appointment) throw new HttpError(404, "Appointment not found");
  if (appointment.isBilled) throw new HttpError(400, "Appointment has already been billed");

  if (paymentMode === "PAYPAL") {
    const existingLink = await prisma.paypalPayment.findUnique({ where: { appointmentId: appointment.id } });
    if (existingLink && existingLink.status !== "CANCELLED") {
      throw new HttpError(400, "A PayPal payment link already exists for this appointment");
    }

    const totalAmount = appointment.services.reduce((sum, s) => sum + Number(s.price), 0);

    const paypalPayment = existingLink
      ? await prisma.paypalPayment.update({
          where: { id: existingLink.id },
          data: { status: "PENDING", amountLkr: totalAmount, paypalOrderId: null, paypalCaptureId: null },
        })
      : await prisma.paypalPayment.create({
          data: { tenantId: appointment.tenantId, appointmentId: appointment.id, amountLkr: totalAmount },
        });

    const payUrl = `${env.frontendUrl}/pay/${paypalPayment.id}`;

    let whatsappSent = false;
    if (appointment.clientPhone) {
      try {
        await sendWhatsAppText(
          appointment.clientPhone,
          `${appointment.tenant.salonName}: your bill of LKR ${totalAmount.toFixed(2)} is ready. Pay securely via PayPal here: ${payUrl}`
        );
        whatsappSent = true;
      } catch (err) {
        console.error("WhatsApp pay-link dispatch failed:", err);
      }
    }

    return res.status(201).json({
      success: true,
      paypalPaymentId: paypalPayment.id,
      payUrl,
      totalAmount,
      whatsappSent,
      hasPhone: Boolean(appointment.clientPhone),
    });
  }

  const result = await finalizeInvoice(appointment, paymentMode);
  return res.status(201).json({ success: true, ...result });
}

export async function cancelPaypalLink(req: AuthRequest, res: Response) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: req.params.appointmentId, tenantId: req.tenantId! },
    include: { paypalPayment: true },
  });
  if (!appointment) throw new HttpError(404, "Appointment not found");
  if (!appointment.paypalPayment) throw new HttpError(404, "No PayPal payment link exists for this appointment");
  if (appointment.paypalPayment.status === "COMPLETED") {
    throw new HttpError(400, "This payment has already been completed and can't be cancelled");
  }

  await prisma.paypalPayment.update({
    where: { id: appointment.paypalPayment.id },
    data: { status: "CANCELLED" },
  });

  return res.json({ success: true });
}

export async function listInvoices(req: AuthRequest, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  const { page, pageSize, skip, take } = parsePagination(req.query, 15, 100);
  const tenantId = req.tenantId!;

  const where = {
    tenantId,
    category: "service_sale",
    appointmentId: { not: null },
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.ledger.findMany({
      where,
      include: { appointment: { include: { services: { include: { service: true } } } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.ledger.count({ where }),
  ]);

  const invoices = await Promise.all(
    entries
      .filter((e) => e.appointment)
      .map(async (e) => ({
        id: e.id,
        appointmentId: e.appointmentId!,
        clientName: e.appointment!.clientName,
        clientPhone: e.appointment!.clientPhone,
        services: e.appointment!.services.map((s) => s.service.name),
        amount: e.amount,
        paymentMode: e.paymentMode,
        createdAt: e.createdAt,
        invoiceUrl: await storageProvider.getSignedUrl(`invoices/${tenantId}/${e.appointmentId}.pdf`),
        receiptImageUrl: await storageProvider.getSignedUrl(`receipts/${tenantId}/${e.appointmentId}.png`),
      }))
  );

  return res.json({ success: true, invoices, ...paginationMeta(total, page, pageSize) });
}
