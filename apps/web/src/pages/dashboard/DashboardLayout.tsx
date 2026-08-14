import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Scissors,
  Users,
  CalendarClock,
  Receipt,
  LogOut,
  ExternalLink,
  Image,
  Sparkles,
  UserCircle,
  Settings,
  BellRing,
  Star,
  BarChart3,
  FileText,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { logout } from "@/store/authSlice";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useToast } from "@/components/ui/toast";
import { OwnerNotificationBell } from "@/components/dashboard/OwnerNotificationBell";
import { Appointment } from "@/types";
import { cn } from "@/lib/utils";

const PERMISSION_BANNER_DISMISSED_KEY = "glamedge_notif_banner_dismissed";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/reports", label: "Reports", icon: FileText },
  { to: "/dashboard/appointments", label: "Bookings", icon: CalendarClock },
  { to: "/dashboard/customers", label: "Customers", icon: UserCircle },
  { to: "/dashboard/reviews", label: "Reviews", icon: Star },
  { to: "/dashboard/services", label: "Services", icon: Scissors },
  { to: "/dashboard/staff", label: "Staff", icon: Users },
  { to: "/dashboard/feed", label: "Showcase Feed", icon: Image },
  { to: "/pos", label: "POS Billing", icon: Receipt },
  { to: "/dashboard/settings", label: "Profile", icon: Settings },
];

export default function DashboardLayout() {
  const tenant = useAppSelector((s) => s.auth.tenant);
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
    if (tenant) connectSocket({ tenantId: tenant.id });
    return () => disconnectSocket();
  }, [tenant?.id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleCreated = (appointment: Appointment) => {
      toast(`New booking request from ${appointment.clientName}`, "success");
      queryClient.invalidateQueries({ queryKey: ["owner-notifications"] });

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const notif = new Notification("New booking request", {
          body: `${appointment.clientName} · ${appointment.category}`,
        });
        notif.onclick = () => {
          window.focus();
          navigate(`/dashboard/appointments?open=${appointment.id}`);
          notif.close();
        };
      }
    };

    const handleUpdated = (appointment: Appointment) => {
      queryClient.invalidateQueries({ queryKey: ["owner-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment", appointment.id] });
    };

    const handleMessage = ({ appointmentId }: { appointmentId: string }) => {
      toast("New message from a customer", "success");
      queryClient.invalidateQueries({ queryKey: ["owner-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-messages", appointmentId] });
    };

    const handleReview = ({ rating }: { appointmentId: string; rating: number }) => {
      toast(`New ${rating}-star review received`, "success");
      queryClient.invalidateQueries({ queryKey: ["owner-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "owner"] });
    };

    const handleOwnerNotification = (notification: { title: string; type: string }) => {
      toast(notification.title, notification.type === "SUBSCRIPTION_EXPIRED" ? "error" : "default");
      queryClient.invalidateQueries({ queryKey: ["owner-notifications"] });
    };

    socket.on("appointment:created", handleCreated);
    socket.on("appointment:updated", handleUpdated);
    socket.on("message:created", handleMessage);
    socket.on("review:created", handleReview);
    socket.on("owner-notification:created", handleOwnerNotification);
    return () => {
      socket.off("appointment:created", handleCreated);
      socket.off("appointment:updated", handleUpdated);
      socket.off("message:created", handleMessage);
      socket.off("review:created", handleReview);
      socket.off("owner-notification:created", handleOwnerNotification);
    };
  }, [tenant?.id, queryClient, toast, navigate]);

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Sparkles className="h-5 w-5 text-brand-300" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-cream-50">{tenant?.salonName}</h1>
              <a
                href={`/salon/${tenant?.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-brand-300 hover:text-brand-200 hover:underline"
              >
                View public page <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OwnerNotificationBell />
            <button
              onClick={() => {
                dispatch(logout());
                navigate("/auth");
              }}
              className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm text-cream-100/80 hover:border-red-300 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>

        {showPermissionBanner && (
          <div className="mx-auto mt-3 flex max-w-7xl flex-wrap items-center justify-between gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-cream-100/90">
            <span className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-brand-300" /> Enable booking alerts to get notified the moment a customer requests an appointment.
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

      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-3 md:flex-row md:p-6">
        <nav className="glass-panel flex h-fit gap-1 overflow-x-auto p-2 md:w-56 md:flex-col md:overflow-visible">
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
    </div>
  );
}
