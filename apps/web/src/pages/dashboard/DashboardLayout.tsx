import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { LayoutDashboard, Scissors, Users, CalendarClock, Receipt, LogOut, ExternalLink, Image } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { logout } from "@/store/authSlice";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/appointments", label: "Bookings", icon: CalendarClock },
  { to: "/dashboard/services", label: "Services", icon: Scissors },
  { to: "/dashboard/staff", label: "Staff", icon: Users },
  { to: "/dashboard/feed", label: "Showcase Feed", icon: Image },
  { to: "/pos", label: "POS Billing", icon: Receipt },
];

export default function DashboardLayout() {
  const tenant = useAppSelector((s) => s.auth.tenant);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (tenant) connectSocket(tenant.id);
    return () => disconnectSocket();
  }, [tenant?.id]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="glass-panel sticky top-0 z-20 m-2 flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">{tenant?.salonName}</h1>
          <a
            href={`/salon/${tenant?.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-brand-pink hover:underline"
          >
            View public page <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <button
          onClick={() => {
            dispatch(logout());
            navigate("/auth");
          }}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </header>

      <div className="mx-2 flex gap-2">
        <nav className="glass-panel flex h-fit w-48 flex-col gap-1 p-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                  isActive ? "bg-brand-navy text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 p-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
