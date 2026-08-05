import { Response } from "express";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { prisma } from "@/config/prisma";
import { HttpError } from "@/middlewares/errorHandler";
import { AppointmentPartyRequest } from "@/middlewares/requireAppointmentParty";
import { AppointmentMessage } from "@/models/AppointmentMessage";
import { emitToTenant } from "@/realtime/socket";
import { createNotification } from "@/services/notifications/notificationService";
import { createOwnerNotification } from "@/services/notifications/ownerNotificationService";
import { storageProvider } from "@/services/storage";
import { parsePagination, paginationMeta } from "@/utils/pagination";

const sendMessageSchema = z.object({
  text: z.string().max(1000).optional(),
});

async function loadAppointmentForParty(req: AppointmentPartyRequest) {
  const appointment = await prisma.appointment.findUnique({ where: { id: req.params.id } });
  if (!appointment) throw new HttpError(404, "Appointment not found");

  const party = req.party!;
  if (party.type === "OWNER" && appointment.tenantId !== party.tenantId) {
    throw new HttpError(403, "Not authorized for this appointment");
  }
  if (party.type === "CLIENT" && appointment.clientId !== party.clientId) {
    throw new HttpError(403, "Not authorized for this appointment");
  }
  return appointment;
}

export async function listMessages(req: AppointmentPartyRequest, res: Response) {
  const appointment = await loadAppointmentForParty(req);
  const { page, pageSize, skip, take } = parsePagination(req.query, 30, 100);

  const [messages, total] = await Promise.all([
    AppointmentMessage.find({ appointmentId: appointment.id }).sort({ createdAt: 1 }).skip(skip).limit(take),
    AppointmentMessage.countDocuments({ appointmentId: appointment.id }),
  ]);

  return res.json({ success: true, messages, ...paginationMeta(total, page, pageSize) });
}

export async function sendMessage(req: AppointmentPartyRequest, res: Response) {
  const appointment = await loadAppointmentForParty(req);
  const { text } = sendMessageSchema.parse(req.body);
  const file = req.file as Express.Multer.File | undefined;

  if (!text && !file) throw new HttpError(400, "Message text or an attachment is required");

  const party = req.party!;
  let senderType: "OWNER" | "CLIENT";
  let senderName: string;

  if (party.type === "OWNER") {
    senderType = "OWNER";
    const tenant = await prisma.tenant.findUnique({ where: { id: party.tenantId }, select: { salonName: true } });
    senderName = tenant?.salonName || "Salon";
  } else {
    senderType = "CLIENT";
    senderName = appointment.clientName;
  }

  let attachment: { url: string; filename: string; mimeType: string; size: number } | undefined;
  if (file) {
    const ext = file.mimetype.split("/")[1];
    const key = `messages/${appointment.id}/${uuid()}.${ext}`;
    const uploadedUrl = await storageProvider.upload(key, file.buffer, file.mimetype);
    attachment = {
      url: await storageProvider.resolveUrl(uploadedUrl),
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  const message = await AppointmentMessage.create({
    appointmentId: appointment.id,
    tenantId: appointment.tenantId,
    senderType,
    senderName,
    text,
    attachment,
  });

  const notificationMessage = text ? `${senderName}: ${text}` : `${senderName} sent an attachment`;

  if (party.type === "CLIENT") {
    try {
      await createOwnerNotification({
        tenantId: appointment.tenantId,
        appointmentId: appointment.id,
        type: "NEW_MESSAGE",
        title: "New message",
        message: notificationMessage,
      });
    } catch (err) {
      console.error("Owner notification create failed:", err);
    }
  } else if (appointment.clientId) {
    try {
      await createNotification({
        clientId: appointment.clientId,
        tenantId: appointment.tenantId,
        appointmentId: appointment.id,
        type: "NEW_MESSAGE",
        title: "New message",
        message: notificationMessage,
      });
    } catch (err) {
      console.error("Notification create failed:", err);
    }
  }

  emitToTenant(appointment.tenantId, "message:created", { appointmentId: appointment.id });

  return res.status(201).json({ success: true, message });
}
