import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { NotificationType } from "@prisma/client";
import { prisma } from "@/config/prisma";

interface CreateOwnerNotificationInput {
  tenantId: string;
  appointmentId?: string;
  type: NotificationType;
  title: string;
  message: string;
}

const expo = new Expo();

export async function createOwnerNotification(input: CreateOwnerNotificationInput) {
  const notification = await prisma.ownerNotification.create({ data: input });

  // Fire-and-forget: a push delivery failure (bad token, Expo outage) must never
  // fail the request that triggered the notification (e.g. a client's booking).
  dispatchPush(input).catch((err) => console.error("[push] dispatch failed:", err));

  return notification;
}

async function dispatchPush(input: CreateOwnerNotificationInput) {
  const tokens = await prisma.ownerPushToken.findMany({
    where: { tenantId: input.tenantId },
    select: { id: true, token: true },
  });
  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = [];
  for (const { token } of tokens) {
    if (!Expo.isExpoPushToken(token)) continue;
    messages.push({
      to: token,
      sound: "default",
      title: input.title,
      body: input.message,
      data: { type: input.type, appointmentId: input.appointmentId ?? null },
    });
  }
  if (messages.length === 0) return;

  const staleTokens: string[] = [];
  for (const chunk of expo.chunkPushNotifications(messages)) {
    const tickets = await expo.sendPushNotificationsAsync(chunk);
    tickets.forEach((ticket, i) => {
      // DeviceNotRegistered means the app was uninstalled / the token is dead —
      // keep it around and we'd just keep failing to send to it forever.
      if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
        staleTokens.push(chunk[i].to as string);
      }
    });
  }
  if (staleTokens.length > 0) {
    await prisma.ownerPushToken.deleteMany({ where: { token: { in: staleTokens } } });
  }
}
