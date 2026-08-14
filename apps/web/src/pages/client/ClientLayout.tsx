import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, CalendarClock, Bell, BellRing, UserCircle, LogOut, Sparkles, Search, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { clientLogout } from "@/store/clientAuthSlice";
import { ClientLoginGate } from "@/components/booking/ClientLoginGate";
import { ReviewPromptModal } from "@/components/appointments/ReviewPromptModal";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useToast } from "@/components/ui/toast";
import { playNotificationSound } from "@/lib/notificationSound";
import { AppNotification } from "@/types";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/account", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/account/history", label: "History", icon: CalendarClock },
  { to: "/account/notifications", label: "Notifications", icon: Bell },
  { to: "/account/profile", label: "Profile", icon: UserCircle },
];

const PERMISSION_BANNER_DISMISSED_KEY = "glamedge_client_notif_banner_dismissed";

export default function ClientLayout() {
  const client = useAppSelector((s) => s.clientAuth.client);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showPermissionBanner, setShowPermissionBanner] = useState(
    () =>
      typeof Notification !== "undefined" &&
      Notification.permission === "default" &&
      !localStorage.getItem(PERMISSION_BANNER_DISMISSED_KEY)
  );

  useEffect(() => {
    if (client) connectSocket({ clientId: client.id });
    return () => disconnectSocket();
  }, [client?.id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNotification = (notification: AppNotification) => {
      toast(notification.title, "success");
      playNotificationSound();
      queryClient.invalidateQueries({ queryKey: ["client", "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["client", "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["client", "pending-reviews"] });
      if (notification.appointmentId) {
        queryClient.invalidateQueries({ queryKey: ["client", "appointment", notification.appointmentId] });
        queryClient.invalidateQueries({ queryKey: ["appointment-messages", notification.appointmentId] });
      }

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const notif = new Notification(notification.title, { body: notification.message });
        notif.onclick = () => {
          window.focus();
          navigate(notification.appointmentId ? `/account/history?open=${notification.appointmentId}` : "/account/notifications");
          notif.close();
        };
      }
    };

    socket.on("notification:created", handleNotification);
    return () => {
      socket.off("notification:created", handleNotification);
    };
  }, [client?.id, queryClient, toast, navigate]);

  function enableNotifications() {
    Notification.requestPermission().then(() => setShowPermissionBanner(false));
  }

  function dismissBanner() {
    localStorage.setItem(PERMISSION_BANNER_DISMISSED_KEY, "1");
    setShowPermissionBanner(false);
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-plum-900">
      <header className="sticky top-0 z-20 bg-gradient-hero px-4 py-4 shadow-panel md:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Sparkles className="h-5 w-5 text-brand-300" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-cream-50">My Account</h1>
              {client && <p className="text-xs text-cream-100/60">{client.name} · {client.phone}</p>}
            </div>
          </div>
          {client && (
            <button
              onClick={() => {
                dispatch(clientLogout());
                navigate("/");
              }}
              className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm text-cream-100/80 hover:border-red-300 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          )}
        </div>

        {client && showPermissionBanner && (
          <div className="mx-auto mt-3 flex max-w-4xl flex-wrap items-center justify-between gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-cream-100/90">
            <span className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-brand-300" /> Enable alerts to get notified about your bookings instantly.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={enableNotifications}
                className="rounded-full bg-gradient-brand px-3 py-1 text-xs font-semibold text-white"
              >
                Enable alerts
              </button>
              <button onClick={dismissBanner} className="text-cream-100/60 hover:text-cream-50">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-4xl p-3 md:p-6">
        <ClientLoginGate>
          <div className="flex flex-col gap-4 md:flex-row">
            <nav className="glass-panel flex h-fit gap-1 overflow-x-auto p-2 md:w-52 md:flex-col md:overflow-visible">
              <Link
                to="/"
                className="flex shrink-0 items-center gap-2 rounded-lg bg-gradient-brand px-3 py-2.5 text-sm font-medium text-white shadow-glow transition-transform hover:-translate-y-0.5 md:mb-1"
              >
                <Search className="h-4 w-4" />
                Book A Service
              </Link>
              <div className="hidden shrink-0 border-t border-plum-100 dark:border-white/10 md:block" />
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }: { isActive: boolean }) =>
                    cn(
                      "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gradient-brand text-white shadow-glow"
                        : "text-plum-500 hover:bg-brand-50 dark:text-cream-100/70 dark:hover:bg-white/5"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <main className="flex-1">
              <Outlet />
            </main>
          </div>
          <ReviewPromptModal />
        </ClientLoginGate>
      </div>
    </div>
  );
}
