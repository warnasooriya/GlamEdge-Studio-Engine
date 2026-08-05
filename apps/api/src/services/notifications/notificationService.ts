import { NotificationType } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { emitToClient } from "@/realtime/socket";

interface CreateNotificationInput {
  clientId: string;
  tenantId: string;
  appointmentId?: string;
  type: NotificationType;
  title: string;
  message: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({ data: input });
  emitToClient(input.clientId, "notification:created", notification);
  return notification;
}
