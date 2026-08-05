import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Wallet, Users, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/shared/Pagination";
import { StatTile } from "@/components/shared/StatTile";
import { formatCurrency } from "@/lib/utils";

interface StaffSummaryRow {
  staffId: string;
  staffName: string;
  role: string;
  appointmentsCount: number;
  revenue: number;
  commissionRate: number;
  commissionEarned: number;
}

interface StaffCommissionSummaryResponse {
  staff: StaffSummaryRow[];
  totals: { totalRevenue: number; totalCommission: number };
}

interface StaffDetailRow {
  id: string;
  bookingTime: string;
  clientName: string;
  services: string[];
  revenue: number;
  commissionEarned: number;
}

interface StaffCommissionDetailResponse {
  staff: { id: string; name: string; commissionRate: number };
  appointments: StaffDetailRow[];
  page: number;
  totalPages: number;
}

function StaffDetail({ staffId, from, to }: { staffId: string; from: string; to: string }) {
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["reports", "staff-commission-detail", staffId, from, to, page],
    queryFn: async () =>
      (
        await api.get<StaffCommissionDetailResponse>(`/api/reports/staff-commission/${staffId}`, {
          params: { from, to, page },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

  const rows = data?.appointments || [];

  return (
    <div className="flex flex-col gap-2 bg-brand-50/50 px-4 py-3 dark:bg-white/5">
      {rows.length ? (
        <div className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
              <div>
                <p className="font-medium text-plum-700 dark:text-cream-50">{r.clientName}</p>
                <p className="text-plum-400 dark:text-cream-100/50">
                  {new Date(r.bookingTime).toLocaleString()} • {r.services.join(", ")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-plum-600 dark:text-cream-100/80">{formatCurrency(r.revenue)}</p>
                <p className="text-brand-500">+{formatCurrency(r.commissionEarned)} commission</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-3 text-center text-xs text-plum-300 dark:text-cream-100/40">
          No billed appointments for this staff member in this period.
        </p>
      )}
      {data && (
        <div className="pt-1">
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

export function StaffCommissionReport({ from, to }: { from: string; to: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["reports", "staff-commission", from, to],
    queryFn: async () =>
      (await api.get<StaffCommissionSummaryResponse>("/api/reports/staff-commission", { params: { from, to } })).data,
  });

  const staff = data?.staff || [];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatTile label="Active Staff" value={data ? String(staff.length) : "—"} icon={Users} tone="brand" />
        <StatTile label="Total Revenue" value={data ? formatCurrency(data.totals.totalRevenue) : "—"} icon={TrendingUp} tone="emerald" />
        <StatTile label="Total Commission" value={data ? formatCurrency(data.totals.totalCommission) : "—"} icon={Wallet} tone="gold" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff-wise Commission</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
          {staff.length ? (
            staff.map((s) => {
              const isExpanded = expandedId === s.staffId;
              return (
                <div key={s.staffId}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.staffId)}
                    className="flex w-full flex-wrap items-center justify-between gap-2 py-3 text-left text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-plum-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-plum-400" />
                      )}
                      <div>
                        <p className="font-medium text-plum-700 dark:text-cream-50">{s.staffName}</p>
                        <p className="text-xs text-plum-400 dark:text-cream-100/50">
                          {s.role} • {s.appointmentsCount} billed appointment{s.appointmentsCount === 1 ? "" : "s"} •{" "}
                          {s.commissionRate}% commission
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-plum-700 dark:text-cream-50">{formatCurrency(s.commissionEarned)}</p>
                      <p className="text-xs text-plum-400 dark:text-cream-100/50">of {formatCurrency(s.revenue)} revenue</p>
                    </div>
                  </button>
                  {isExpanded && <StaffDetail staffId={s.staffId} from={from} to={to} />}
                </div>
              );
            })
          ) : (
            <p className="py-8 text-center text-sm text-plum-300 dark:text-cream-100/40">No active staff members.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
