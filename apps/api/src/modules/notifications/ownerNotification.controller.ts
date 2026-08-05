import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middlewares/requireAuth";
import { HttpError } from "@/middlewares/errorHandler";
import { parsePagination, paginationMeta } from "@/utils/pagination";

export async function listOwnerNotifications(req: AuthRequest, res: Response) {
  const tenantId = req.tenantId!;
  const { appointmentId } = req.query as { appointmentId?: string };
  const { page, pageSize, skip, take } = parsePagination(req.query, 20, 100);
  const where = { tenantId, ...(appointmentId ? { appointmentId } : {}) };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.ownerNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.ownerNotification.count({ where }),
    prisma.ownerNotification.count({ where: { tenantId, isRead: false } }),
  ]);

  return res.json({ success: true, notifications, unreadCount, ...paginationMeta(total, page, pageSize) });
}

export async function markOwnerNotificationRead(req: AuthRequest, res: Response) {
  const tenantId = req.tenantId!;
  const existing = await prisma.ownerNotification.findFirst({ where: { id: req.params.id, tenantId } });
  if (!existing) throw new HttpError(404, "Notification not found");

  const notification = await prisma.ownerNotification.update({
    where: { id: existing.id },
    data: { isRead: true },
  });

  return res.json({ success: true, notification });
}

export async function markAllOwnerNotificationsRead(req: AuthRequest, res: Response) {
  const tenantId = req.tenantId!;
  await prisma.ownerNotification.updateMany({ where: { tenantId, isRead: false }, data: { isRead: true } });
  return res.json({ success: true });
}
