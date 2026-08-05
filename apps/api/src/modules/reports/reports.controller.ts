import { Response } from "express";
import { Prisma, AppointmentStatus } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middlewares/requireAuth";
import { HttpError } from "@/middlewares/errorHandler";
import { parsePagination, paginationMeta } from "@/utils/pagination";

// Date-only query params (from/to) are treated as UTC calendar-day boundaries —
// matches how MySQL DATE(createdAt) truncates the UTC-stored DateTime columns
// (see the same convention in analytics.controller.ts).
function parseRange(query: Record<string, unknown>): { from: Date; to: Date } {
  const to = query.to ? new Date(`${query.to}T23:59:59.999Z`) : new Date();
  const from = query.from
    ? new Date(`${query.from}T00:00:00.000Z`)
    : new Date(to.getTime() - 29 * 86400000);
  return { from, to };
}

const APPOINTMENT_LIST_INCLUDE = {
  services: { include: { service: true } },
  staff: true,
} as const;

export async function getRevenueReport(req: AuthRequest, res: Response) {
  const tenantId = req.tenantId!;
  const { from, to } = parseRange(req.query);

  const [byDayRows, byPaymentMode, byType] = await Promise.all([
    prisma.$queryRaw<{ date: string; income: string; expense: string }[]>(Prisma.sql`
      SELECT DATE(createdAt) as date,
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
      FROM ledgers
      WHERE tenantId = ${tenantId} AND createdAt >= ${from} AND createdAt <= ${to}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `),
    prisma.ledger.groupBy({
      by: ["paymentMode"],
      where: { tenantId, type: "INCOME", createdAt: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.ledger.groupBy({
      by: ["type"],
      where: { tenantId, createdAt: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
  ]);

  const income = Number(byType.find((t) => t.type === "INCOME")?._sum.amount ?? 0);
  const expense = Number(byType.find((t) => t.type === "EXPENSE")?._sum.amount ?? 0);

  return res.json({
    success: true,
    range: { from: from.toISOString(), to: to.toISOString() },
    totals: { income, expense, net: income - expense },
    byDay: byDayRows.map((r) => ({ date: r.date, income: Number(r.income), expense: Number(r.expense) })),
    byPaymentMode: byPaymentMode.map((r) => ({
      paymentMode: r.paymentMode,
      amount: Number(r._sum.amount ?? 0),
      count: r._count,
    })),
  });
}

export async function getCancellationReport(req: AuthRequest, res: Response) {
  const tenantId = req.tenantId!;
  const { from, to } = parseRange(req.query);
  const { page, pageSize, skip, take } = parsePagination(req.query, 20, 100);

  const where = { tenantId, status: "CANCELLED" as const, bookingTime: { gte: from, lte: to } };

  const [appointments, cancelledCount, totalBookings, lostRevenueAgg] = await Promise.all([
    prisma.appointment.findMany({ where, include: APPOINTMENT_LIST_INCLUDE, orderBy: { bookingTime: "desc" }, skip, take }),
    prisma.appointment.count({ where }),
    prisma.appointment.count({ where: { tenantId, bookingTime: { gte: from, lte: to } } }),
    prisma.$queryRaw<{ lost: string }[]>(Prisma.sql`
      SELECT COALESCE(SUM(aps.price), 0) as lost
      FROM appointment_services aps
      JOIN appointments a ON a.id = aps.appointmentId
      WHERE a.tenantId = ${tenantId} AND a.status = 'CANCELLED' AND a.bookingTime >= ${from} AND a.bookingTime <= ${to}
    `),
  ]);

  return res.json({
    success: true,
    range: { from: from.toISOString(), to: to.toISOString() },
    totals: {
      cancelledCount,
      totalBookings,
      cancellationRate: totalBookings ? (cancelledCount / totalBookings) * 100 : 0,
      lostRevenue: Number(lostRevenueAgg[0]?.lost ?? 0),
    },
    appointments,
    ...paginationMeta(cancelledCount, page, pageSize),
  });
}

export async function getMissedAppointmentsReport(req: AuthRequest, res: Response) {
  const tenantId = req.tenantId!;
  const { from, to } = parseRange(req.query);
  const { page, pageSize, skip, take } = parsePagination(req.query, 20, 100);

  const now = new Date();
  const effectiveTo = to < now ? to : now;

  const where = {
    tenantId,
    status: { in: ["PENDING", "CONFIRMED"] as AppointmentStatus[] },
    bookingTime: { gte: from, lte: effectiveTo },
  };

  const [appointments, missedCount] = await Promise.all([
    prisma.appointment.findMany({ where, include: APPOINTMENT_LIST_INCLUDE, orderBy: { bookingTime: "desc" }, skip, take }),
    prisma.appointment.count({ where }),
  ]);

  return res.json({
    success: true,
    range: { from: from.toISOString(), to: to.toISOString() },
    totals: { missedCount },
    appointments,
    ...paginationMeta(missedCount, page, pageSize),
  });
}

export async function getStaffCommissionSummary(req: AuthRequest, res: Response) {
  const tenantId = req.tenantId!;
  const { from, to } = parseRange(req.query);

  const [staff, rows] = await Promise.all([
    prisma.staff.findMany({ where: { tenantId, isActive: true } }),
    prisma.$queryRaw<{ staffId: string; revenue: string; count: bigint }[]>(Prisma.sql`
      SELECT a.staffId as staffId, COALESCE(SUM(aps.price), 0) as revenue, COUNT(DISTINCT a.id) as count
      FROM appointments a
      JOIN appointment_services aps ON aps.appointmentId = a.id
      WHERE a.tenantId = ${tenantId} AND a.status = 'COMPLETED' AND a.isBilled = 1
        AND a.bookingTime >= ${from} AND a.bookingTime <= ${to} AND a.staffId IS NOT NULL
      GROUP BY a.staffId
    `),
  ]);

  const byStaffId = new Map(rows.map((r) => [r.staffId, r]));
  const summary = staff
    .map((s) => {
      const r = byStaffId.get(s.id);
      const revenue = r ? Number(r.revenue) : 0;
      const appointmentsCount = r ? Number(r.count) : 0;
      const commissionRate = Number(s.commission);
      return {
        staffId: s.id,
        staffName: s.name,
        role: s.role,
        appointmentsCount,
        revenue,
        commissionRate,
        commissionEarned: (revenue * commissionRate) / 100,
      };
    })
    .sort((a, b) => b.commissionEarned - a.commissionEarned);

  return res.json({
    success: true,
    range: { from: from.toISOString(), to: to.toISOString() },
    staff: summary,
    totals: {
      totalRevenue: summary.reduce((sum, s) => sum + s.revenue, 0),
      totalCommission: summary.reduce((sum, s) => sum + s.commissionEarned, 0),
    },
  });
}

export async function getStaffCommissionDetail(req: AuthRequest, res: Response) {
  const tenantId = req.tenantId!;
  const staffId = req.params.staffId;
  const { from, to } = parseRange(req.query);
  const { page, pageSize, skip, take } = parsePagination(req.query, 20, 100);

  const staffMember = await prisma.staff.findFirst({ where: { id: staffId, tenantId } });
  if (!staffMember) throw new HttpError(404, "Staff member not found");

  const where = {
    tenantId,
    staffId,
    status: "COMPLETED" as const,
    isBilled: true,
    bookingTime: { gte: from, lte: to },
  };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: { services: { include: { service: true } } },
      orderBy: { bookingTime: "desc" },
      skip,
      take,
    }),
    prisma.appointment.count({ where }),
  ]);

  const commissionRate = Number(staffMember.commission);
  const detail = appointments.map((a) => {
    const revenue = a.services.reduce((sum, s) => sum + Number(s.price), 0);
    return {
      id: a.id,
      bookingTime: a.bookingTime,
      clientName: a.clientName,
      services: a.services.map((s) => s.service.name),
      revenue,
      commissionEarned: (revenue * commissionRate) / 100,
    };
  });

  return res.json({
    success: true,
    range: { from: from.toISOString(), to: to.toISOString() },
    staff: { id: staffMember.id, name: staffMember.name, commissionRate },
    appointments: detail,
    ...paginationMeta(total, page, pageSize),
  });
}
