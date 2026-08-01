import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middlewares/requireAuth";
import { HttpError } from "@/middlewares/errorHandler";
import { generateInvoicePdf } from "@/services/pdf/invoiceGenerator";
import { storageProvider } from "@/services/storage";
import { sendWhatsAppInvoice } from "@/services/whatsapp/whatsappService";
import { createInvoiceSchema } from "./billing.schema";

export async function createInvoice(req: AuthRequest, res: Response) {
  const { paymentMode } = createInvoiceSchema.parse(req.body);

  const appointment = await prisma.appointment.findFirst({
    where: { id: req.params.appointmentId, tenantId: req.tenantId! },
    include: { services: { include: { service: true } }, tenant: true },
  });
  if (!appointment) throw new HttpError(404, "Appointment not found");
  if (appointment.isBilled) throw new HttpError(400, "Appointment has already been billed");

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

  const invoiceUrl = await storageProvider.upload(
    `invoices/${appointment.tenantId}/${appointment.id}.pdf`,
    pdfBuffer,
    "application/pdf"
  );

  const [, ledgerEntry] = await prisma.$transaction([
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

  try {
    await sendWhatsAppInvoice({
      clientPhone: appointment.clientPhone,
      clientName: appointment.clientName,
      salonName: appointment.tenant.salonName,
      totalAmount: totalAmount.toFixed(2),
      pdfInvoiceUrl: invoiceUrl,
    });
  } catch (err) {
    // Invoice + ledger already committed; a WhatsApp delivery failure shouldn't fail billing.
    console.error("WhatsApp invoice dispatch failed:", err);
  }

  return res.status(201).json({ success: true, invoiceUrl, totalAmount, ledgerEntry });
}
