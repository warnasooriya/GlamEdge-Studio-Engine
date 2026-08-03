import { Response } from "express";
import { prisma } from "@/config/prisma";
import { ClientAuthRequest } from "@/middlewares/requireClientAuth";
import { HttpError } from "@/middlewares/errorHandler";
import { parsePagination, paginationMeta } from "@/utils/pagination";
import { storageProvider } from "@/services/storage";

export async function listNotifications(req: ClientAuthRequest, res: Response) {
  const clientId = req.clientAuth!.clientId;
  const { page, pageSize, skip, take } = parsePagination(req.query, 20, 100);
  const where = { clientId };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: { tenant: { select: { salonName: true, slug: true, logoUrl: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { clientId, isRead: false } }),
  ]);

  const resolvedNotifications = await Promise.all(
    notifications.map(async (n) => ({
      ...n,
      tenant: { ...n.tenant, logoUrl: n.tenant.logoUrl ? await storageProvider.resolveUrl(n.tenant.logoUrl) : n.tenant.logoUrl },
    }))
  );

  return res.json({ success: true, notifications: resolvedNotifications, unreadCount, ...paginationMeta(total, page, pageSize) });
}

export async function markNotificationRead(req: ClientAuthRequest, res: Response) {
  const clientId = req.clientAuth!.clientId;
  const existing = await prisma.notification.findFirst({ where: { id: req.params.id, clientId } });
  if (!existing) throw new HttpError(404, "Notification not found");

  const notification = await prisma.notification.update({
    where: { id: existing.id },
    data: { isRead: true },
  });

  return res.json({ success: true, notification });
}

export async function markAllNotificationsRead(req: ClientAuthRequest, res: Response) {
  const clientId = req.clientAuth!.clientId;
  await prisma.notification.updateMany({ where: { clientId, isRead: false }, data: { isRead: true } });
  return res.json({ success: true });
}
