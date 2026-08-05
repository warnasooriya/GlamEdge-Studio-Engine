import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, Wallet, CalendarDays, Receipt } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/Pagination";
import { formatCurrency } from "@/lib/utils";
import { SubscriptionPayment } from "@/types";

interface PaymentsResponse {
  payments: SubscriptionPayment[];
  summary: {
    totalCollected: string;
    matchingCount: number;
    thisMonthCollected: string;
    thisMonthCount: number;
  };
  page: number;
  total: number;
  totalPages: number;
}

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["admin-payments", search, from, to, page],
    queryFn: async () =>
      (
        await adminApi.get<PaymentsResponse>("/api/admin/payments", {
          params: { search: search || undefined, from: from || undefined, to: to || undefined, page },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

  const payments = data?.payments || [];
  const summary = data?.summary;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryTile
          icon={Wallet}
          tone="bg-emerald-600"
          value={formatCurrency(Number(summary?.totalCollected ?? 0))}
          label={search || from || to ? "Collected (filtered)" : "Collected all-time"}
        />
        <SummaryTile
          icon={CalendarDays}
          tone="bg-brand-500"
          value={formatCurrency(Number(summary?.thisMonthCollected ?? 0))}
          label={`This month · ${summary?.thisMonthCount ?? 0} payment${summary?.thisMonthCount === 1 ? "" : "s"}`}
        />
        <SummaryTile
          icon={Receipt}
          tone="bg-plum-700"
          value={String(summary?.matchingCount ?? 0)}
          label="Payments listed"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-plum-300" />
              <Input
                placeholder="Search by salon, owner, or phone"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-plum-400 dark:text-cream-100/50">From</span>
              <Input
                type="date"
                className="h-10 w-40 text-xs"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-plum-400 dark:text-cream-100/50">To</span>
              <Input
                type="date"
                className="h-10 w-40 text-xs"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-plum-100 text-xs uppercase tracking-wide text-plum-400 dark:border-white/10 dark:text-cream-100/50">
                  <th className="py-2 pr-3 font-medium">Salon</th>
                  <th className="py-2 pr-3 font-medium">Paid on</th>
                  <th className="py-2 pr-3 font-medium">Plan</th>
                  <th className="py-2 pr-3 font-medium">Method</th>
                  <th className="py-2 pr-3 font-medium">Covers</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum-100 dark:divide-white/10">
                {payments.length ? (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-brand-50/50 dark:hover:bg-white/5">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-plum-700 dark:text-cream-50">{p.tenant?.salonName}</p>
                        <p className="text-xs text-plum-400 dark:text-cream-100/50">{p.tenant?.phone}</p>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-plum-500 dark:text-cream-100/70">
                        {new Date(p.paidAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-plum-500 dark:text-cream-100/70">
                        {p.tier} · {p.cycle.toLowerCase()}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-plum-500 dark:text-cream-100/70">
                        {p.paymentMode}
                        {p.reference && (
                          <span className="block text-plum-300 dark:text-cream-100/40">{p.reference}</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-plum-400 dark:text-cream-100/50">
                        {new Date(p.periodStart).toLocaleDateString()} –{" "}
                        {new Date(p.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(Number(p.amount))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-plum-300 dark:text-cream-100/40">
                      No payments found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: typeof Wallet;
  tone: string;
  value: string;
  label: string;
}) {
  return (
    <div className="glass-panel flex items-center gap-3 p-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-xl font-semibold tabular-nums text-plum-800 dark:text-cream-50">
          {value}
        </p>
        <p className="truncate text-xs text-plum-400 dark:text-cream-100/50">{label}</p>
      </div>
    </div>
  );
}
