import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Building2, Clock, CheckCircle2, XCircle, PauseCircle, AlertTriangle, CalendarX } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  expiringSoon: number;
  expired: number;
}

const TILES: {
  key: keyof AdminStats;
  label: string;
  icon: typeof Building2;
  tone: string;
  filter?: string;
}[] = [
  { key: "total", label: "Total salons", icon: Building2, tone: "bg-plum-700" },
  { key: "pending", label: "Pending approval", icon: Clock, tone: "bg-amber-500", filter: "PENDING" },
  { key: "approved", label: "Approved", icon: CheckCircle2, tone: "bg-emerald-600", filter: "APPROVED" },
  { key: "rejected", label: "Rejected", icon: XCircle, tone: "bg-red-500", filter: "REJECTED" },
  { key: "suspended", label: "Suspended", icon: PauseCircle, tone: "bg-plum-500", filter: "SUSPENDED" },
  { key: "expiringSoon", label: "Expiring within 7 days", icon: AlertTriangle, tone: "bg-brand-500" },
  { key: "expired", label: "Subscription expired", icon: CalendarX, tone: "bg-red-600" },
];

export default function AdminOverviewPage() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => (await adminApi.get<{ stats: AdminStats }>("/api/admin/stats")).data.stats,
    refetchInterval: 30000,
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Platform overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TILES.map((tile) => {
              const Icon = tile.icon;
              const value = data?.[tile.key];
              const content = (
                <div className="flex items-center gap-3 rounded-xl border border-plum-100 p-4 transition-shadow hover:shadow-md dark:border-white/10">
                  <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white", tile.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-semibold tabular-nums text-plum-800 dark:text-cream-50">
                      {value ?? "—"}
                    </p>
                    <p className="text-xs text-plum-400 dark:text-cream-100/50">{tile.label}</p>
                  </div>
                </div>
              );
              return tile.filter ? (
                <Link key={tile.key} to={`/admin/tenants?status=${tile.filter}`}>
                  {content}
                </Link>
              ) : (
                <div key={tile.key}>{content}</div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
