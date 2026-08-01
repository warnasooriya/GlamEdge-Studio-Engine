import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middlewares/requireAuth";
import { HttpError } from "@/middlewares/errorHandler";
import { generateInvoicePdf } from "@/services/pdf/invoiceGenerator";
import { generateReceiptImage } from "@/services/image/receiptGenerator";
import { storageProvider } from "@/services/storage";
import { sendWhatsAppInvoice } from "@/services/whatsapp/whatsappService";
import { parsePagination, paginationMeta } from "@/utils/pagination";
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

  const receiptBuffer = await generateReceiptImage({
    salonName: appointment.tenant.salonName,
    logoUrl: appointment.tenant.logoUrl,
    address: appointment.tenant.address,
    contactPhone: appointment.tenant.contactPhone,
    clientName: appointment.clientName,
    items,
    total: totalAmount,
    paymentMode,
    issuedAt: new Date(),
  });

  const receiptImageUrl = await storageProvider.upload(
    `receipts/${appointment.tenantId}/${appointment.id}.png`,
    receiptBuffer,
    "image/png"
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
      receiptImageUrl,
    });
  } catch (err) {
    // Invoice + ledger already committed; a WhatsApp delivery failure shouldn't fail billing.
    console.error("WhatsApp invoice dispatch failed:", err);
  }

  return res.status(201).json({ success: true, invoiceUrl, receiptImageUrl, totalAmount, ledgerEntry });
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

  const invoices = entries
    .filter((e) => e.appointment)
    .map((e) => ({
      id: e.id,
      appointmentId: e.appointmentId!,
      clientName: e.appointment!.clientName,
      clientPhone: e.appointment!.clientPhone,
      services: e.appointment!.services.map((s) => s.service.name),
      amount: e.amount,
      paymentMode: e.paymentMode,
      createdAt: e.createdAt,
      invoiceUrl: storageProvider.getUrl(`invoices/${tenantId}/${e.appointmentId}.pdf`),
      receiptImageUrl: storageProvider.getUrl(`receipts/${tenantId}/${e.appointmentId}.png`),
    }));

  return res.json({ success: true, invoices, ...paginationMeta(total, page, pageSize) });
}
