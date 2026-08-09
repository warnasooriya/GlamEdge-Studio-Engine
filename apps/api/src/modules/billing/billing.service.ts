import { Prisma, PaymentMode } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { generateInvoicePdf } from "@/services/pdf/invoiceGenerator";
import { generateReceiptImage } from "@/services/image/receiptGenerator";
import { storageProvider } from "@/services/storage";
import { sendWhatsAppInvoice } from "@/services/whatsapp/whatsappService";
import { createNotification } from "@/services/notifications/notificationService";

const APPOINTMENT_WITH_BILLING_RELATIONS = {
  services: { include: { service: true } },
  tenant: true,
} satisfies Prisma.AppointmentInclude;

export type AppointmentForBilling = Prisma.AppointmentGetPayload<{
  include: typeof APPOINTMENT_WITH_BILLING_RELATIONS;
}>;

export const appointmentBillingInclude = APPOINTMENT_WITH_BILLING_RELATIONS;

export interface FinalizedInvoice {
  invoiceUrl: string;
  receiptImageUrl: string;
  totalAmount: number;
  whatsappSent: boolean;
  hasPhone: boolean;
}

// Shared by every way a bill can actually get paid — the direct cash/card/etc.
// path in billing.controller.ts, and the PayPal capture handler in
// modules/payments — so a PayPal sale is finalized exactly like a walk-in one:
// same PDF/receipt, same Ledger row, same WhatsApp receipt, same notification.
export async function finalizeInvoice(
  appointment: AppointmentForBilling,
  paymentMode: PaymentMode
): Promise<FinalizedInvoice> {
  const items = appointment.services.map((s) => ({ name: s.service.name, price: Number(s.price) }));
  const totalAmount = items.reduce((sum, i) => sum + i.price, 0);

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber: appointment.id.slice(0, 8).toUpperCase(),
    salonName: appointment.tenant.salonName,
    clientName: appointment.clientName,
    clientPhone: appointment.clientPhone,
    items,
    paymentMode,
    issuedAt: new Date(),
  });

  await storageProvider.upload(`invoices/${appointment.tenantId}/${appointment.id}.pdf`, pdfBuffer, "application/pdf");

  const receiptBuffer = await generateReceiptImage({
    salonName: appointment.tenant.salonName,
    logoUrl: appointment.tenant.logoUrl ? await storageProvider.resolveUrl(appointment.tenant.logoUrl) : null,
    address: appointment.tenant.address,
    contactPhone: appointment.tenant.contactPhone,
    clientName: appointment.clientName,
    items,
    total: totalAmount,
    paymentMode,
    issuedAt: new Date(),
  });

  await storageProvider.upload(`receipts/${appointment.tenantId}/${appointment.id}.png`, receiptBuffer, "image/png");

  const [signedInvoiceUrl, signedReceiptUrl] = await Promise.all([
    storageProvider.getSignedUrl(`invoices/${appointment.tenantId}/${appointment.id}.pdf`),
    storageProvider.getSignedUrl(`receipts/${appointment.tenantId}/${appointment.id}.png`),
  ]);

  await prisma.$transaction([
    prisma.appointment.update({
      where: { id: appointment.id },
      data: { isBilled: true, status: "COMPLETED" },
    }),
    prisma.ledger.create({
      data: {
        tenantId: appointment.tenantId,
        appointmentId: appointment.id,
        type: "INCOME",
        amount: totalAmount,
        category: "service_sale",
        paymentMode,
        description: `Invoice for ${appointment.clientName}`,
      },
    }),
  ]);

  let whatsappSent = false;
  if (appointment.clientPhone) {
    try {
      await sendWhatsAppInvoice({
        clientPhone: appointment.clientPhone,
        clientName: appointment.clientName,
        salonName: appointment.tenant.salonName,
        totalAmount: totalAmount.toFixed(2),
        pdfInvoiceUrl: signedInvoiceUrl,
        receiptImageUrl: signedReceiptUrl,
      });
      whatsappSent = true;
    } catch (err) {
      // Invoice + ledger already committed; a WhatsApp delivery failure shouldn't fail billing.
      // The caller still needs to know it failed, though — never silently claim it was sent.
      console.error("WhatsApp invoice dispatch failed:", err);
    }
  }

  if (appointment.clientId) {
    try {
      await createNotification({
        clientId: appointment.clientId,
        tenantId: appointment.tenantId,
        appointmentId: appointment.id,
        type: "INVOICE_READY",
        title: "Your receipt is ready",
        message: `Your receipt from ${appointment.tenant.salonName} for LKR ${totalAmount.toFixed(2)} is ready.`,
      });
    } catch (err) {
      console.error("Notification create failed:", err);
    }
  }

  return {
    invoiceUrl: signedInvoiceUrl,
    receiptImageUrl: signedReceiptUrl,
    totalAmount,
    whatsappSent,
    hasPhone: Boolean(appointment.clientPhone),
  };
}
