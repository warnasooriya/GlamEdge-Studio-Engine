import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Building2, Wallet, LogOut, Sparkles, MessageCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { adminLogout } from "@/store/adminAuthSlice";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/tenants", label: "Salons", icon: Building2 },
  { to: "/admin/payments", label: "Payments", icon: Wallet },
  { to: "/admin/whatsapp", label: "WhatsApp", icon: MessageCircle },
];

export default function AdminLayout() {
  const admin = useAppSelector((s) => s.adminAuth.admin);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-plum-900">
      <header className="sticky top-0 z-20 bg-plum-800 px-4 py-4 shadow-panel md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Sparkles className="h-5 w-5 text-brand-300" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-cream-50">Administrator Portal</h1>
              <p className="text-xs text-cream-100/60">Signed in as {admin?.name}</p>
            </div>
          </div>
          <button
            onClick={() => {
              dispatch(adminLogout());
              navigate("/admin/login");
            }}
            className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm text-cream-100/80 hover:border-red-300 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
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
                    ? "bg-plum-700 text-white shadow-glow"
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
