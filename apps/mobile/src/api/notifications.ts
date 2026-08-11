import { api } from "./client";
import { OwnerNotification, PaginatedResponse } from "@/types";

export async function listOwnerNotifications(page = 1) {
  const { data } = await api.get<
    { success: boolean; notifications: OwnerNotification[]; unreadCount: number } & PaginatedResponse<OwnerNotification>
  >("/api/owner-notifications", { params: { page } });
  return data;
}

export async function markNotificationRead(id: string) {
  const { data } = await api.patch<{ success: boolean; notification: OwnerNotification }>(
    `/api/owner-notifications/${id}/read`
  );
  return data.notification;
}

export async function markAllNotificationsRead() {
  await api.post("/api/owner-notifications/read-all");
}

export async function deleteNotification(id: string) {
  await api.delete(`/api/owner-notifications/${id}`);
}

export async function clearAllNotifications() {
  await api.delete("/api/owner-notifications");
}
