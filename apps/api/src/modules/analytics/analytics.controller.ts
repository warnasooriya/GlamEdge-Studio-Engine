import { Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middlewares/requireAuth";

const ALLOWED_DAYS = [7, 30, 90] as const;

function parseDays(value: unknown): number {
  const n = parseInt(String(value ?? "30"), 10);
  return (ALLOWED_DAYS as readonly number[]).includes(n) ? n : 30;
}

interface RevenueRow {
  date: string;
  revenue: string | number;
}

interface TopServiceRow {
  name: string;
  revenue: string | number;
  count: bigint | number;
}

interface PeakTimeRow {
  dow: bigint | number;
  hour: bigint | number;
  count: bigint | number;
}

// bookingTime is stored as a UTC instant; salons on this platform operate in Sri
// Lanka (+05:30), so shift before extracting weekday/hour or the heatmap would show
// booking patterns offset by 5.5 hours from the owner's actual wall clock.
const SL_OFFSET_MINUTES = 330;

export async function getAnalyticsOverview(req: AuthRequest, res: Response) {
  const tenantId = req.tenantId!;
  const days = parseDays(req.query.days);

  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - (days - 1));
  from.setUTCHours(0, 0, 0, 0);

  const [
    revenueRows,
    bookingsByStatus,
    bookingsByCategory,
    topServiceRows,
    ratingRows,
    revenueAgg,
    ratingAgg,
    peakTimeRows,
  ] = await Promise.all([
    prisma.$queryRaw<RevenueRow[]>(Prisma.sql`
      SELECT DATE(createdAt) as date, SUM(amount) as revenue
      FROM ledgers
      WHERE tenantId = ${tenantId} AND type = 'INCOME' AND createdAt >= ${from} AND createdAt <= ${to}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `),
    prisma.appointment.groupBy({
      by: ["status"],
      where: { tenantId, bookingTime: { gte: from, lte: to } },
      _count: true,
    }),
    prisma.appointment.groupBy({
      by: ["category"],
      where: { tenantId, bookingTime: { gte: from, lte: to } },
      _count: true,
    }),
    prisma.$queryRaw<TopServiceRow[]>(Prisma.sql`
      SELECT s.name as name, SUM(aps.price) as revenue, COUNT(*) as count
      FROM appointment_services aps
      JOIN appointments a ON a.id = aps.appointmentId
      JOIN services s ON s.id = aps.serviceId
      WHERE a.tenantId = ${tenantId} AND a.bookingTime >= ${from} AND a.bookingTime <= ${to} AND a.status != 'CANCELLED'
      GROUP BY s.id, s.name
      ORDER BY revenue DESC
      LIMIT 5
    `),
    prisma.review.groupBy({
      by: ["rating"],
      where: { tenantId, createdAt: { gte: from, lte: to } },
      _count: true,
    }),
    prisma.ledger.aggregate({
      where: { tenantId, type: "INCOME", createdAt: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.review.aggregate({
      where: { tenantId, createdAt: { gte: from, lte: to } },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.$queryRaw<PeakTimeRow[]>(Prisma.sql`
      SELECT
        WEEKDAY(DATE_ADD(bookingTime, INTERVAL ${SL_OFFSET_MINUTES} MINUTE)) as dow,
        HOUR(DATE_ADD(bookingTime, INTERVAL ${SL_OFFSET_MINUTES} MINUTE)) as hour,
        COUNT(*) as count
      FROM appointments
      WHERE tenantId = ${tenantId} AND bookingTime >= ${from} AND bookingTime <= ${to} AND status != 'CANCELLED'
      GROUP BY dow, hour
    `),
  ]);

  const bookingsTotal = bookingsByStatus.reduce((sum, r) => sum + r._count, 0);

  return res.json({
    success: true,
    range: { days, from: from.toISOString(), to: to.toISOString() },
    totals: {
      revenue: Number(revenueAgg._sum.amount ?? 0),
      bookings: bookingsTotal,
      avgRating: ratingAgg._avg.rating ?? 0,
      reviewCount: ratingAgg._count,
    },
    revenueTrend: revenueRows.map((r) => ({ date: r.date, revenue: Number(r.revenue) })),
    bookingsByStatus: bookingsByStatus.map((r) => ({ status: r.status, count: r._count })),
    bookingsByCategory: bookingsByCategory.map((r) => ({ category: r.category, count: r._count })),
    topServices: topServiceRows.map((r) => ({ name: r.name, revenue: Number(r.revenue), count: Number(r.count) })),
    ratingDistribution: ratingRows.map((r) => ({ rating: r.rating, count: r._count })),
    peakTimes: peakTimeRows.map((r) => ({ dayOfWeek: Number(r.dow), hour: Number(r.hour), count: Number(r.count) })),
  });
}
