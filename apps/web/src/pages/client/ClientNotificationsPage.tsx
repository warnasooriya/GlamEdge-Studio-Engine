import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Bell, CheckCircle2, XCircle, Star, Receipt, CheckCheck } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import { cn } from "@/lib/utils";
import { AppNotification, NotificationType } from "@/types";

interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
  page: number;
  totalPages: number;
}

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  BOOKING_REQUESTED: Bell,
  BOOKING_CONFIRMED: CheckCircle2,
  BOOKING_CANCELLED: XCircle,
  REVIEW_THANKS: Star,
  INVOICE_READY: Receipt,
};

export default function ClientNotificationsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["client", "notifications", page],
    queryFn: async () =>
      (await clientApi.get<NotificationsResponse>("/api/notifications", { params: { page } })).data,
    placeholderData: keepPreviousData,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => clientApi.patch(`/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["client", "notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => clientApi.post("/api/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["client", "notifications"] }),
  });

  const notifications = data?.notifications || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Notifications</CardTitle>
          {!!data?.unreadCount && (
            <Button size="sm" variant="ghost" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
        {notifications.length ? (
          notifications.map((n) => {
            const Icon = TYPE_ICON[n.type];
            return (
              <button
                key={n.id}
                onClick={() => !n.isRead && markRead.mutate(n.id)}
                className={cn(
                  "flex items-start gap-3 py-3 text-left text-sm",
                  !n.isRead && "bg-brand-50/50 dark:bg-white/5"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    n.isRead ? "bg-plum-100 text-plum-400 dark:bg-white/10 dark:text-cream-100/50" : "bg-gradient-brand text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-plum-700 dark:text-cream-50">{n.title}</span>
                    {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                  </div>
                  <p className="text-xs text-plum-500 dark:text-cream-100/70">{n.message}</p>
                  <p className="mt-0.5 text-[11px] text-plum-300 dark:text-cream-100/40">
                    {n.tenant.salonName} • {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </button>
            );
          })
        ) : (
          <p className="py-8 text-center text-sm text-plum-300 dark:text-cream-100/40">No notifications yet.</p>
        )}
        {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}
      </CardContent>
    </Card>
  );
}
