import { NotificationType } from "@prisma/client";
import { prisma } from "@/config/prisma";

interface CreateOwnerNotificationInput {
  tenantId: string;
  appointmentId?: string;
  type: NotificationType;
  title: string;
  message: string;
}

export async function createOwnerNotification(input: CreateOwnerNotificationInput) {
  return prisma.ownerNotification.create({ data: input });
}
