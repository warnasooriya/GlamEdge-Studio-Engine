import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Bell, ArrowRight } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { STATUS_VARIANT } from "@/components/appointments/AppointmentRow";
import { ClientAppointmentDetailModal } from "@/components/appointments/ClientAppointmentDetailModal";
import { AppNotification, ClientAppointment } from "@/types";

interface HistoryResponse {
  appointments: ClientAppointment[];
  total: number;
}

interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export default function ClientDashboardHome() {
  const [showDetail, setShowDetail] = useState(false);

  const { data: historyData } = useQuery({
    queryKey: ["client", "appointments", "overview"],
    queryFn: async () =>
      (await clientApi.get<HistoryResponse>("/api/appointments/me", { params: { page: 1, pageSize: 10 } })).data,
  });

  const { data: notificationsData } = useQuery({
    queryKey: ["client", "notifications", "overview"],
    queryFn: async () =>
      (await clientApi.get<NotificationsResponse>("/api/notifications", { params: { page: 1, pageSize: 3 } })).data,
  });

  const upcoming = (historyData?.appointments || [])
    .filter((a) => new Date(a.bookingTime) > new Date() && (a.status === "PENDING" || a.status === "CONFIRMED"))
    .sort((a, b) => new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime())[0];

  const notifications = notificationsData?.notifications || [];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <p className="text-xs text-plum-400 dark:text-cream-100/50">Total Visits</p>
            <p className="font-display text-2xl font-semibold text-plum-800 dark:text-cream-50">
              {historyData?.total ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <p className="text-xs text-plum-400 dark:text-cream-100/50">Unread Notifications</p>
            <p className="font-display text-2xl font-semibold text-plum-800 dark:text-cream-50">
              {notificationsData?.unreadCount ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-plum-700 dark:text-cream-50">{upcoming.tenant.salonName}</span>
                  <CategoryBadge category={upcoming.category} />
                  <Badge variant={STATUS_VARIANT[upcoming.status]}>{upcoming.status}</Badge>
                  {upcoming.rescheduleStatus === "PROPOSED" && (
                    <button onClick={() => setShowDetail(true)}>
                      <Badge variant="outline">Action needed</Badge>
                    </button>
                  )}
                </div>
                <p className="text-xs text-plum-400 dark:text-cream-100/50">
                  {new Date(upcoming.bookingTime).toLocaleString()} •{" "}
                  {upcoming.services.map((s) => s.service.name).join(", ")}
                </p>
              </div>
              <CalendarClock className="h-5 w-5 text-brand-500" />
            </div>
          ) : (
            <p className="py-2 text-sm text-plum-300 dark:text-cream-100/40">No upcoming appointments.</p>
          )}
          <Link
            to="/account/history"
            className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-500 hover:underline"
          >
            View full history <ArrowRight className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
          {notifications.length ? (
            notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-2 py-2 text-sm">
                <Bell className={n.isRead ? "mt-0.5 h-4 w-4 text-plum-300" : "mt-0.5 h-4 w-4 text-brand-500"} />
                <div>
                  <p className="font-medium text-plum-700 dark:text-cream-50">{n.title}</p>
                  <p className="text-xs text-plum-400 dark:text-cream-100/50">{n.message}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="py-2 text-sm text-plum-300 dark:text-cream-100/40">No notifications yet.</p>
          )}
          <Link
            to="/account/notifications"
            className="flex items-center gap-1 pt-3 text-xs font-medium text-brand-500 hover:underline"
          >
            View all notifications <ArrowRight className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>

      {upcoming && showDetail && (
        <ClientAppointmentDetailModal
          appointmentId={upcoming.id}
          open={showDetail}
          onOpenChange={setShowDetail}
        />
      )}
    </div>
  );
}
