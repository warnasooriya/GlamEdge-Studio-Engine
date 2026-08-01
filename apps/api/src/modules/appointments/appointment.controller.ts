import { Response, Request } from "express";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middlewares/requireAuth";
import { HttpError } from "@/middlewares/errorHandler";
import { emitToTenant } from "@/realtime/socket";
import { createAppointmentSchema, updateStatusSchema } from "./appointment.schema";

const APPOINTMENT_INCLUDE = {
  services: { include: { service: true } },
  staff: true,
} as const;

export async function listAppointments(req: AuthRequest, res: Response) {
  const { from, to, status } = req.query as { from?: string; to?: string; status?: string };

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId: req.tenantId!,
      ...(status ? { status: status as any } : {}),
      ...(from || to
        ? {
            bookingTime: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: APPOINTMENT_INCLUDE,
    orderBy: { bookingTime: "asc" },
  });

  return res.json({ success: true, appointments });
}

export async function createPublicAppointment(req: Request, res: Response) {
  const { slug } = req.params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || !tenant.isActive) throw new HttpError(404, "Salon not found");

  const data = createAppointmentSchema.parse(req.body);

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
      clientName: data.clientName,
      clientPhone: data.clientPhone,
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

  return res.status(201).json({ success: true, appointment });
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

  return res.json({ success: true, appointment });
}
