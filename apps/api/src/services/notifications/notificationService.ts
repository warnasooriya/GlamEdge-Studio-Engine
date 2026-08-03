import { NotificationType } from "@prisma/client";
import { prisma } from "@/config/prisma";

interface CreateNotificationInput {
  clientId: string;
  tenantId: string;
  appointmentId?: string;
  type: NotificationType;
  title: string;
  message: string;
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({ data: input });
}
