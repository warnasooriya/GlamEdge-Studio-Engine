import { Response, Request } from "express";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middlewares/requireAuth";
import { ClientAuthRequest } from "@/middlewares/requireClientAuth";
import { HttpError } from "@/middlewares/errorHandler";
import { emitToTenant } from "@/realtime/socket";
import { parsePagination, paginationMeta } from "@/utils/pagination";
import { isPubliclyVisible } from "@/utils/publicTenant";
import { isWithinBusinessHours } from "@/utils/businessHours";
import { sendWhatsAppText } from "@/services/whatsapp/whatsappService";
import { createNotification } from "@/services/notifications/notificationService";
import { createOwnerNotification } from "@/services/notifications/ownerNotificationService";
import { storageProvider } from "@/services/storage";
import {
  createAppointmentSchema,
  updateStatusSchema,
  proposeRescheduleSchema,
  respondToRescheduleSchema,
  submitReviewSchema,
  createWalkInAppointmentSchema,
} from "./appointment.schema";

const APPOINTMENT_INCLUDE = {
  services: { include: { service: true } },
  staff: true,
  proposedStaff: true,
  review: true,
} as const;

export async function listAppointments(req: AuthRequest, res: Response) {
  const { from, to, status, search, isBilled, excludeCancelled } = req.query as {
    from?: string;
    to?: string;
    status?: string;
    search?: string;
    isBilled?: string;
    excludeCancelled?: string;
  };
  const { page, pageSize, skip, take } = parsePagination(req.query, 20, 100);

  const where = {
    tenantId: req.tenantId!,
    ...(status
      ? { status: status as any }
      : excludeCancelled === "true"
        ? { status: { not: "CANCELLED" as any } }
        : {}),
    ...(isBilled !== undefined ? { isBilled: isBilled === "true" } : {}),
    ...(from || to
      ? {
          bookingTime: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { clientName: { contains: search } },
            { clientPhone: { contains: search } },
          ],
        }
      : {}),
  };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: APPOINTMENT_INCLUDE,
      orderBy: { bookingTime: "asc" },
      skip,
      take,
    }),
    prisma.appointment.count({ where }),
  ]);

  return res.json({ success: true, appointments, ...paginationMeta(total, page, pageSize) });
}

export async function getAppointmentById(req: AuthRequest, res: Response) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: req.params.id, tenantId: req.tenantId! },
    include: APPOINTMENT_INCLUDE,
  });
  if (!appointment) throw new HttpError(404, "Appointment not found");
  return res.json({ success: true, appointment });
}

export async function createPublicAppointment(req: ClientAuthRequest, res: Response) {
  const { slug } = req.params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new HttpError(404, "Salon not found");
  // Covers a salon suspended or lapsed while a customer had the booking form open.
  if (!isPubliclyVisible(tenant)) {
    throw new HttpError(403, "This salon isn't accepting online bookings right now.");
  }

  const data = createAppointmentSchema.parse(req.body);
  const { clientId, phone: clientPhone } = req.clientAuth!;

  if (!isWithinBusinessHours(tenant, new Date(data.bookingTime))) {
    throw new HttpError(400, "That time is outside the salon's working hours. Please pick another slot.");
  }

  const services = await prisma.service.findMany({
    where: { id: { in: data.serviceIds }, tenantId: tenant.id, isActive: true },
  });
  if (services.length !== data.serviceIds.length) {
    throw new HttpError(400, "One or more selected services are invalid");
  }

  const appointment = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      staffId: data.staffId,
      clientId,
      clientName: data.clientName,
      clientPhone,
      category: data.category,
      bookingTime: data.bookingTime,
      notes: data.notes,
      services: {
        create: services.map((s) => ({ serviceId: s.id, price: s.price })),
      },
    },
    include: APPOINTMENT_INCLUDE,
  });

  emitToTenant(tenant.id, "appointment:created", appointment);

  const serviceNames = appointment.services.map((s) => s.service.name).join(", ");
  const requestedMessage = `Your booking for ${serviceNames} at ${tenant.salonName} on ${appointment.bookingTime.toLocaleString()} has been received and is pending confirmation. We'll notify you once it's confirmed!`;

  try {
    await sendWhatsAppText(appointment.clientPhone, `Hi ${appointment.clientName}! ${requestedMessage}`);
  } catch (err) {
    console.error("WhatsApp booking-requested dispatch failed:", err);
  }

  if (appointment.clientId) {
    try {
      await createNotification({
        clientId: appointment.clientId,
        tenantId: tenant.id,
        appointmentId: appointment.id,
        type: "BOOKING_REQUESTED",
        title: "Booking requested",
        message: requestedMessage,
      });
    } catch (err) {
      console.error("Notification create failed:", err);
    }
  }

  try {
    await createOwnerNotification({
      tenantId: tenant.id,
      appointmentId: appointment.id,
      type: "BOOKING_REQUESTED",
      title: "New booking request",
      message: `${appointment.clientName} requested ${serviceNames} on ${appointment.bookingTime.toLocaleString()}`,
    });
  } catch (err) {
    console.error("Owner notification create failed:", err);
  }

  return res.status(201).json({ success: true, appointment });
}

// In-salon walk-in sale: no client account required. Lands as COMPLETED + unbilled
// so it appears directly in the existing POS "unbilled" list, ready to invoice.
export async function createWalkInAppointment(req: AuthRequest, res: Response) {
  const data = createWalkInAppointmentSchema.parse(req.body);
  const tenantId = req.tenantId!;

  const services = await prisma.service.findMany({
    where: { id: { in: data.serviceIds }, tenantId, isActive: true },
  });
  if (services.length !== data.serviceIds.length) {
    throw new HttpError(400, "One or more selected services are invalid");
  }

  if (data.staffId) {
    const staff = await prisma.staff.findFirst({ where: { id: data.staffId, tenantId } });
    if (!staff) throw new HttpError(400, "Invalid staff member");
  }

  const appointment = await prisma.appointment.create({
    data: {
      tenantId,
      staffId: data.staffId,
      clientName: data.clientName?.trim() || "Walking Customer",
      clientPhone: data.clientPhone?.trim() || "",
      category: data.category,
      bookingTime: new Date(),
      status: "COMPLETED",
      notes: data.notes,
      services: {
        create: services.map((s) => ({ serviceId: s.id, price: s.price })),
      },
    },
    include: APPOINTMENT_INCLUDE,
  });

  return res.status(201).json({ success: true, appointment });
}

export async function listMyAppointments(req: ClientAuthRequest, res: Response) {
  const clientId = req.clientAuth!.clientId;
  const { page, pageSize, skip, take } = parsePagination(req.query, 10, 50);
  const where = { clientId };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        ...APPOINTMENT_INCLUDE,
        tenant: { select: { salonName: true, slug: true, logoUrl: true } },
      },
      orderBy: { bookingTime: "desc" },
      skip,
      take,
    }),
    prisma.appointment.count({ where }),
  ]);

  const resolvedAppointments = await Promise.all(
    appointments.map(async (a) => ({
      ...a,
      tenant: { ...a.tenant, logoUrl: a.tenant.logoUrl ? await storageProvider.resolveUrl(a.tenant.logoUrl) : a.tenant.logoUrl },
    }))
  );

  return res.json({ success: true, appointments: resolvedAppointments, ...paginationMeta(total, page, pageSize) });
}

export async function getMyAppointmentById(req: ClientAuthRequest, res: Response) {
  const clientId = req.clientAuth!.clientId;
  const appointment = await prisma.appointment.findFirst({
    where: { id: req.params.id, clientId },
    include: {
      ...APPOINTMENT_INCLUDE,
      tenant: { select: { salonName: true, slug: true, logoUrl: true } },
    },
  });
  if (!appointment) throw new HttpError(404, "Appointment not found");
  if (appointment.tenant.logoUrl) {
    appointment.tenant.logoUrl = await storageProvider.resolveUrl(appointment.tenant.logoUrl);
  }
  return res.json({ success: true, appointment });
}

export async function getAvailability(req: Request, res: Response) {
  const { slug } = req.params;
  const { date } = req.query as { date?: string };
  if (!date) throw new HttpError(400, "date query param (YYYY-MM-DD) is required");

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || !tenant.isActive) throw new HttpError(404, "Salon not found");

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  const [staff, appointments] = await Promise.all([
    prisma.staff.findMany({ where: { tenantId: tenant.id, isActive: true } }),
    prisma.appointment.findMany({
      where: {
        tenantId: tenant.id,
        bookingTime: { gte: dayStart, lte: dayEnd },
        status: { not: "CANCELLED" },
      },
      select: { id: true, staffId: true, bookingTime: true, status: true },
    }),
  ]);

  return res.json({ success: true, staff, bookedSlots: appointments });
}

export async function updateAppointmentStatus(req: AuthRequest, res: Response) {
  const { status } = updateStatusSchema.parse(req.body);

  const existing = await prisma.appointment.findFirst({
    where: { id: req.params.id, tenantId: req.tenantId! },
  });
  if (!existing) throw new HttpError(404, "Appointment not found");

  const appointment = await prisma.appointment.update({
    where: { id: existing.id },
    data: { status },
    include: APPOINTMENT_INCLUDE,
  });

  emitToTenant(req.tenantId!, "appointment:updated", appointment);

  if (status === "CONFIRMED" || status === "CANCELLED") {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId! },
      select: { salonName: true },
    });
    const serviceNames = appointment.services.map((s) => s.service.name).join(", ");

    if (status === "CONFIRMED") {
      try {
        await sendWhatsAppText(
          appointment.clientPhone,
          `Hi ${appointment.clientName}! Your appointment at ${tenant?.salonName} on ${appointment.bookingTime.toLocaleString()} for ${serviceNames} has been confirmed. See you soon!`
        );
      } catch (err) {
        console.error("WhatsApp booking-confirmed dispatch failed:", err);
      }
    }

    if (appointment.clientId && tenant) {
      try {
        await createNotification({
          clientId: appointment.clientId,
          tenantId: req.tenantId!,
          appointmentId: appointment.id,
          type: status === "CONFIRMED" ? "BOOKING_CONFIRMED" : "BOOKING_CANCELLED",
          title: status === "CONFIRMED" ? "Booking confirmed" : "Booking cancelled",
          message:
            status === "CONFIRMED"
              ? `Your appointment at ${tenant.salonName} on ${appointment.bookingTime.toLocaleString()} for ${serviceNames} has been confirmed.`
              : `Your appointment at ${tenant.salonName} on ${appointment.bookingTime.toLocaleString()} has been cancelled.`,
        });
      } catch (err) {
        console.error("Notification create failed:", err);
      }
    }
  }

  return res.json({ success: true, appointment });
}

export async function proposeReschedule(req: AuthRequest, res: Response) {
  const { proposedBookingTime, proposedStaffId } = proposeRescheduleSchema.parse(req.body);

  const existing = await prisma.appointment.findFirst({
    where: { id: req.params.id, tenantId: req.tenantId! },
  });
  if (!existing) throw new HttpError(404, "Appointment not found");
  if (existing.status !== "PENDING" && existing.status !== "CONFIRMED") {
    throw new HttpError(400, "Only pending or confirmed appointments can be rescheduled");
  }
  if (existing.rescheduleStatus === "PROPOSED") {
    throw new HttpError(400, "A reschedule proposal is already pending for this booking");
  }

  if (proposedStaffId) {
    const staff = await prisma.staff.findFirst({ where: { id: proposedStaffId, tenantId: req.tenantId! } });
    if (!staff) throw new HttpError(400, "Invalid staff member");
  }

  const appointment = await prisma.appointment.update({
    where: { id: existing.id },
    data: {
      rescheduleStatus: "PROPOSED",
      ...(proposedBookingTime ? { proposedBookingTime } : {}),
      ...(proposedStaffId ? { proposedStaffId } : {}),
    },
    include: APPOINTMENT_INCLUDE,
  });

  if (appointment.clientId) {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId! }, select: { salonName: true } });
    const newTime = proposedBookingTime ? proposedBookingTime.toLocaleString() : appointment.bookingTime.toLocaleString();
    const withStaff = appointment.proposedStaff ? ` with ${appointment.proposedStaff.name}` : "";
    try {
      await createNotification({
        clientId: appointment.clientId,
        tenantId: req.tenantId!,
        appointmentId: appointment.id,
        type: "RESCHEDULE_PROPOSED",
        title: "Salon proposed a new time",
        message: `${tenant?.salonName} proposed ${newTime}${withStaff} for your appointment. Please accept or decline.`,
      });
    } catch (err) {
      console.error("Notification create failed:", err);
    }
  }

  return res.json({ success: true, appointment });
}

export async function respondToReschedule(req: ClientAuthRequest, res: Response) {
  const { accept } = respondToRescheduleSchema.parse(req.body);
  const clientId = req.clientAuth!.clientId;

  const existing = await prisma.appointment.findFirst({ where: { id: req.params.id, clientId } });
  if (!existing) throw new HttpError(404, "Appointment not found");
  if (existing.rescheduleStatus !== "PROPOSED") {
    throw new HttpError(400, "No pending reschedule proposal for this appointment");
  }

  const appointment = await prisma.appointment.update({
    where: { id: existing.id },
    data: accept
      ? {
          bookingTime: existing.proposedBookingTime ?? existing.bookingTime,
          staffId: existing.proposedStaffId ?? existing.staffId,
          proposedBookingTime: null,
          proposedStaffId: null,
          rescheduleStatus: "NONE",
        }
      : {
          proposedBookingTime: null,
          proposedStaffId: null,
          rescheduleStatus: "NONE",
        },
    include: APPOINTMENT_INCLUDE,
  });

  emitToTenant(existing.tenantId, "appointment:updated", appointment);

  try {
    await createOwnerNotification({
      tenantId: existing.tenantId,
      appointmentId: appointment.id,
      type: accept ? "RESCHEDULE_ACCEPTED" : "RESCHEDULE_DECLINED",
      title: accept ? "Reschedule accepted" : "Reschedule declined",
      message: accept
        ? `${appointment.clientName} accepted the new time: ${appointment.bookingTime.toLocaleString()}.`
        : `${appointment.clientName} declined the proposed reschedule.`,
    });
  } catch (err) {
    console.error("Owner notification create failed:", err);
  }

  return res.json({ success: true, appointment });
}

export async function listPendingReviewAppointments(req: ClientAuthRequest, res: Response) {
  const clientId = req.clientAuth!.clientId;
  const appointments = await prisma.appointment.findMany({
    where: { clientId, status: "COMPLETED", isBilled: true, review: null },
    include: {
      ...APPOINTMENT_INCLUDE,
      tenant: { select: { salonName: true, slug: true, logoUrl: true } },
    },
    orderBy: { bookingTime: "desc" },
    take: 10,
  });

  const resolvedAppointments = await Promise.all(
    appointments.map(async (a) => ({
      ...a,
      tenant: { ...a.tenant, logoUrl: a.tenant.logoUrl ? await storageProvider.resolveUrl(a.tenant.logoUrl) : a.tenant.logoUrl },
    }))
  );

  return res.json({ success: true, appointments: resolvedAppointments });
}

export async function submitAppointmentReview(req: ClientAuthRequest, res: Response) {
  const { rating, comment } = submitReviewSchema.parse(req.body);
  const clientId = req.clientAuth!.clientId;

  const appointment = await prisma.appointment.findFirst({
    where: { id: req.params.id, clientId, status: "COMPLETED", isBilled: true },
  });
  if (!appointment) {
    throw new HttpError(400, "Only clients with a completed and billed appointment can leave reviews.");
  }

  const existingReview = await prisma.review.findUnique({ where: { appointmentId: appointment.id } });
  if (existingReview) throw new HttpError(400, "Review already submitted for this visit.");

  const tenant = await prisma.tenant.findUnique({ where: { id: appointment.tenantId }, select: { salonName: true } });

  const review = await prisma.review.create({
    data: {
      tenantId: appointment.tenantId,
      appointmentId: appointment.id,
      clientName: appointment.clientName,
      rating,
      comment,
      isVerified: true,
    },
  });

  try {
    await sendWhatsAppText(
      appointment.clientPhone,
      `Thank you ${appointment.clientName} for your ${rating}-star review of ${tenant?.salonName}! We appreciate your feedback.`
    );
  } catch (err) {
    console.error("WhatsApp review-thanks dispatch failed:", err);
  }

  try {
    await createNotification({
      clientId,
      tenantId: appointment.tenantId,
      appointmentId: appointment.id,
      type: "REVIEW_THANKS",
      title: "Thanks for your review",
      message: `Thank you for your ${rating}-star review of ${tenant?.salonName}! We appreciate your feedback.`,
    });
  } catch (err) {
    console.error("Notification create failed:", err);
  }

  try {
    await createOwnerNotification({
      tenantId: appointment.tenantId,
      appointmentId: appointment.id,
      type: "REVIEW_SUBMITTED",
      title: "New review",
      message: `${appointment.clientName} left a ${rating}-star review${comment ? `: "${comment}"` : "."}`,
    });
  } catch (err) {
    console.error("Owner notification create failed:", err);
  }

  emitToTenant(appointment.tenantId, "review:created", { appointmentId: appointment.id, rating });

  return res.status(201).json({ success: true, review });
}
