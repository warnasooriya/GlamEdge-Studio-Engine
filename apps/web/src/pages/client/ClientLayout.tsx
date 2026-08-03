import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarClock, Bell, UserCircle, LogOut, Sparkles, Search } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { clientLogout } from "@/store/clientAuthSlice";
import { ClientLoginGate } from "@/components/booking/ClientLoginGate";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/account", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/account/history", label: "History", icon: CalendarClock },
  { to: "/account/notifications", label: "Notifications", icon: Bell },
  { to: "/account/profile", label: "Profile", icon: UserCircle },
];

export default function ClientLayout() {
  const client = useAppSelector((s) => s.clientAuth.client);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

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
                  className={({ isActive }) =>
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
        </ClientLoginGate>
      </div>
    </div>
  );
}
