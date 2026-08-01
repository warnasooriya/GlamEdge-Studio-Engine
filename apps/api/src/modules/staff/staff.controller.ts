import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middlewares/requireAuth";
import { HttpError } from "@/middlewares/errorHandler";
import { createStaffSchema, updateStaffSchema } from "./staff.schema";

export async function listStaff(req: AuthRequest, res: Response) {
  const staff = await prisma.staff.findMany({
    where: { tenantId: req.tenantId! },
    orderBy: { createdAt: "asc" },
  });
  return res.json({ success: true, staff });
}

export async function createStaff(req: AuthRequest, res: Response) {
  const data = createStaffSchema.parse(req.body);
  const staff = await prisma.staff.create({ data: { ...data, tenantId: req.tenantId! } });
  return res.status(201).json({ success: true, staff });
}

export async function updateStaff(req: AuthRequest, res: Response) {
  const data = updateStaffSchema.parse(req.body);
  const existing = await prisma.staff.findFirst({
    where: { id: req.params.id, tenantId: req.tenantId! },
  });
  if (!existing) throw new HttpError(404, "Staff member not found");

  const staff = await prisma.staff.update({ where: { id: existing.id }, data });
  return res.json({ success: true, staff });
}

export async function deleteStaff(req: AuthRequest, res: Response) {
  const existing = await prisma.staff.findFirst({
    where: { id: req.params.id, tenantId: req.tenantId! },
  });
  if (!existing) throw new HttpError(404, "Staff member not found");

  await prisma.staff.update({ where: { id: existing.id }, data: { isActive: false } });
  return res.json({ success: true });
}

// Commission earned per staff member across completed & billed appointments.
export async function staffCommissionSummary(req: AuthRequest, res: Response) {
  const staffId = req.params.id;
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId: req.tenantId! },
  });
  if (!staff) throw new HttpError(404, "Staff member not found");

  const appointments = await prisma.appointment.findMany({
    where: { tenantId: req.tenantId!, staffId, status: "COMPLETED", isBilled: true },
    include: { services: true },
  });

  const totalRevenue = appointments.reduce(
    (sum, appt) => sum + appt.services.reduce((s, svc) => s + Number(svc.price), 0),
    0
  );
  const commissionEarned = totalRevenue * (Number(staff.commission) / 100);

  return res.json({
    success: true,
    staffId,
    appointmentsCount: appointments.length,
    totalRevenue,
    commissionRate: Number(staff.commission),
    commissionEarned,
  });
}
