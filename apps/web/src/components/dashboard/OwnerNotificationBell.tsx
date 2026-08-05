import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle2, XCircle, CalendarClock, MessageCircle, CheckCheck, Star, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { playNotificationSound } from "@/lib/notificationSound";
import { NotificationType, OwnerNotification } from "@/types";

interface OwnerNotificationsResponse {
  notifications: OwnerNotification[];
  unreadCount: number;
}

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  BOOKING_REQUESTED: Bell,
  BOOKING_CONFIRMED: CheckCircle2,
  BOOKING_CANCELLED: XCircle,
  REVIEW_THANKS: CheckCircle2,
  INVOICE_READY: CheckCircle2,
  RESCHEDULE_PROPOSED: CalendarClock,
  RESCHEDULE_ACCEPTED: CheckCircle2,
  RESCHEDULE_DECLINED: XCircle,
  NEW_MESSAGE: MessageCircle,
  REVIEW_SUBMITTED: Star,
  SUBSCRIPTION_EXPIRING: AlertTriangle,
  SUBSCRIPTION_EXPIRED: AlertTriangle,
};

export function OwnerNotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["owner-notifications"],
    queryFn: async () =>
      (await api.get<OwnerNotificationsResponse>("/api/owner-notifications", { params: { pageSize: 8 } })).data,
    refetchInterval: 15000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => api.post("/api/owner-notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-notifications"] }),
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => api.patch(`/api/owner-notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-notifications"] }),
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const prevUnreadRef = useRef<number | null>(null);
  useEffect(() => {
    if (data === undefined) return;
    if (prevUnreadRef.current !== null && unreadCount > prevUnreadRef.current) {
      playNotificationSound();
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, data]);

  function handleClick(n: OwnerNotification) {
    if (!n.isRead) markRead.mutate(n.id);
    setOpen(false);
    if (n.appointmentId) navigate(`/dashboard/appointments?open=${n.appointmentId}`);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-cream-100/80 hover:border-brand-300 hover:text-cream-50"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} aria-label="Close" />
          <div className="glass-panel absolute right-0 top-11 z-40 flex max-h-96 w-80 flex-col overflow-hidden rounded-xl">
            <div className="flex items-center justify-between border-b border-plum-100 px-3 py-2 dark:border-white/10">
              <span className="text-sm font-semibold text-plum-800 dark:text-cream-50">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="flex flex-col divide-y divide-plum-100 overflow-y-auto dark:divide-white/10">
              {notifications.length ? (
                notifications.map((n) => {
                  const Icon = TYPE_ICON[n.type];
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={cn(
                        "flex items-start gap-2.5 px-3 py-2.5 text-left text-sm",
                        !n.isRead && "bg-brand-50/50 dark:bg-white/5"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                          n.isRead
                            ? "bg-plum-100 text-plum-400 dark:bg-white/10 dark:text-cream-100/50"
                            : "bg-gradient-brand text-white"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate font-medium text-plum-700 dark:text-cream-50">{n.title}</p>
                        <p className="truncate text-xs text-plum-400 dark:text-cream-100/50">{n.message}</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="py-8 text-center text-xs text-plum-300 dark:text-cream-100/40">No notifications yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
