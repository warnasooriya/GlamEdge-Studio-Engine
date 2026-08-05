import { prisma } from "@/config/prisma";
import { createOwnerNotification } from "@/services/notifications/ownerNotificationService";
import { sendWhatsAppText } from "@/services/whatsapp/whatsappService";
import { emitToTenant } from "@/realtime/socket";

const REMINDER_WINDOW_DAYS = 7;

// Runs on an interval (see index.ts). Picks up any APPROVED tenant whose subscription
// expires within the reminder window — or has already lapsed since the last run —
// and hasn't been notified yet for the current subscriptionExpiresAt value.
// expiryNotifiedAt is the dedupe key: it's cleared whenever an admin renews/extends
// a subscription, so exactly one reminder goes out per expiry cycle.
export async function checkExpiringSubscriptions(): Promise<number> {
  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + REMINDER_WINDOW_DAYS);

  const tenants = await prisma.tenant.findMany({
    where: {
      status: "APPROVED",
      subscriptionExpiresAt: { not: null, lte: windowEnd },
      expiryNotifiedAt: null,
    },
  });

  for (const tenant of tenants) {
    const expiresAt = tenant.subscriptionExpiresAt!;
    const isExpired = expiresAt < now;
    const dateStr = expiresAt.toLocaleDateString("en-LK", { day: "numeric", month: "long", year: "numeric" });
    const cycle = tenant.subscriptionCycle.toLowerCase();

    const type = isExpired ? ("SUBSCRIPTION_EXPIRED" as const) : ("SUBSCRIPTION_EXPIRING" as const);
    const title = isExpired ? "Subscription expired" : "Subscription expiring soon";
    const message = isExpired
      ? `Your ${cycle} subscription expired on ${dateStr}. Renew to keep your salon page and bookings active.`
      : `Your ${cycle} subscription expires on ${dateStr}. Renew soon to avoid any interruption.`;

    try {
      const notification = await createOwnerNotification({ tenantId: tenant.id, type, title, message });
      emitToTenant(tenant.id, "owner-notification:created", notification);
    } catch (err) {
      console.error("Failed to create subscription expiry notification:", err);
    }

    try {
      await sendWhatsAppText(tenant.phone, `${title} — ${message}`);
    } catch (err) {
      console.error("WhatsApp subscription expiry notice failed:", err);
    }

    await prisma.tenant.update({ where: { id: tenant.id }, data: { expiryNotifiedAt: now } });
  }

  return tenants.length;
}
