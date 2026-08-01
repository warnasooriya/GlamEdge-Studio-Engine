import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middlewares/requireAuth";
import { HttpError } from "@/middlewares/errorHandler";
import { parsePagination, paginationMeta } from "@/utils/pagination";

export async function listClients(req: AuthRequest, res: Response) {
  const tenantId = req.tenantId!;
  const { page, pageSize, skip, take } = parsePagination(req.query, 20, 100);

  const [grouped, distinctClients] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["clientId"],
      where: { tenantId, clientId: { not: null } },
      _max: { bookingTime: true },
      _count: { _all: true },
      orderBy: { _max: { bookingTime: "desc" } },
      skip,
      take,
    }),
    prisma.appointment.findMany({
      where: { tenantId, clientId: { not: null } },
      distinct: ["clientId"],
      select: { clientId: true },
    }),
  ]);

  const clientIds = grouped.map((g) => g.clientId!);
  const total = distinctClients.length;

  const [clientRows, completedCounts, reviews] = await Promise.all([
    prisma.client.findMany({ where: { id: { in: clientIds } } }),
    prisma.appointment.groupBy({
      by: ["clientId"],
      where: { tenantId, clientId: { in: clientIds }, status: "COMPLETED" },
      _count: { _all: true },
    }),
    prisma.review.findMany({
      where: { tenantId, appointment: { clientId: { in: clientIds } } },
      select: { rating: true, appointment: { select: { clientId: true } } },
    }),
  ]);

  const clientById = new Map(clientRows.map((c) => [c.id, c]));
  const completedByClient = new Map(completedCounts.map((c) => [c.clientId!, c._count._all]));

  const ratingByClient = new Map<string, { sum: number; count: number }>();
  for (const r of reviews) {
    const cid = r.appointment.clientId!;
    const entry = ratingByClient.get(cid) || { sum: 0, count: 0 };
    entry.sum += r.rating;
    entry.count += 1;
    ratingByClient.set(cid, entry);
  }

  const clients = grouped
    .map((g) => {
      const client = clientById.get(g.clientId!);
      if (!client) return null;
      const rating = ratingByClient.get(g.clientId!);
      return {
        id: client.id,
        name: client.name,
        phone: client.phone,
        createdAt: client.createdAt,
        visitCount: g._count._all,
        completedCount: completedByClient.get(g.clientId!) || 0,
        lastVisit: g._max.bookingTime,
        avgRating: rating ? rating.sum / rating.count : null,
        reviewCount: rating?.count || 0,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return res.json({ success: true, clients, ...paginationMeta(total, page, pageSize) });
}

export async function getClientDetail(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const tenantId = req.tenantId!;

  const client = await prisma.client.findFirst({
    where: { id, appointments: { some: { tenantId } } },
  });
  if (!client) throw new HttpError(404, "Customer not found");

  const HISTORY_LIMIT = 25;

  const [appointments, reviews] = await Promise.all([
    prisma.appointment.findMany({
      where: { tenantId, clientId: id },
      include: { services: { include: { service: true } }, staff: true },
      orderBy: { bookingTime: "desc" },
      take: HISTORY_LIMIT,
    }),
    prisma.review.findMany({
      where: { tenantId, appointment: { clientId: id } },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
    }),
  ]);

  return res.json({ success: true, client, appointments, reviews });
}
