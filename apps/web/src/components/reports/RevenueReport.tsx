import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from "recharts";
import { TrendingUp, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/shared/StatTile";
import { ChartTooltip, EmptyChart, compactCurrency } from "@/components/shared/chartHelpers";
import { formatCurrency } from "@/lib/utils";
import { REVENUE_COLOR, INCOME_COLOR, EXPENSE_COLOR, CHART_GRID, CHART_TEXT_MUTED } from "@/lib/chartColors";
import { PaymentMode } from "@/types";

interface RevenueReportResponse {
  range: { from: string; to: string };
  totals: { income: number; expense: number; net: number };
  byDay: { date: string; income: number; expense: number }[];
  byPaymentMode: { paymentMode: PaymentMode; amount: number; count: number }[];
}

const PAYMENT_LABEL: Record<PaymentMode, string> = {
  CASH: "Cash",
  CARD: "Card",
  ONLINE: "Online",
  LANKAQR: "LankaQR",
  PAYPAL: "PayPal",
};

export function RevenueReport({ from, to }: { from: string; to: string }) {
  const { data } = useQuery({
    queryKey: ["reports", "revenue", from, to],
    queryFn: async () => (await api.get<RevenueReportResponse>("/api/reports/revenue", { params: { from, to } })).data,
  });

  const series = useMemo(() => {
    if (!data) return [];
    const byDate = new Map(data.byDay.map((r) => [r.date.slice(0, 10), r]));
    const out: { label: string; income: number; expense: number }[] = [];
    const cursor = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      const row = byDate.get(key);
      out.push({
        label: cursor.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
        income: row?.income ?? 0,
        expense: row?.expense ?? 0,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return out;
  }, [data, from, to]);

  const topPaymentModes = useMemo(
    () => (data?.byPaymentMode || []).slice().sort((a, b) => b.amount - a.amount),
    [data]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatTile label="Income" value={data ? formatCurrency(data.totals.income) : "—"} icon={ArrowUpCircle} tone="emerald" />
        <StatTile label="Expenses" value={data ? formatCurrency(data.totals.expense) : "—"} icon={ArrowDownCircle} tone="rose" />
        <StatTile label="Net Profit" value={data ? formatCurrency(data.totals.net) : "—"} icon={TrendingUp} tone="brand" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {!data ? (
            <EmptyChart label="Loading..." />
          ) : series.every((d) => d.income === 0 && d.expense === 0) ? (
            <EmptyChart label="No ledger activity in this period yet." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART_GRID} strokeWidth={1} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART_TEXT_MUTED }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: CHART_TEXT_MUTED }} axisLine={false} tickLine={false} tickFormatter={compactCurrency} width={40} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="income" name="Income" stroke={INCOME_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke={EXPENSE_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Payment Mode</CardTitle>
        </CardHeader>
        <CardContent>
          {!data || topPaymentModes.length === 0 ? (
            <EmptyChart label="No income recorded in this period yet." />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(120, topPaymentModes.length * 44)}>
              <BarChart
                data={topPaymentModes.map((p) => ({ ...p, label: PAYMENT_LABEL[p.paymentMode] }))}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke={CHART_GRID} strokeWidth={1} />
                <XAxis type="number" tickFormatter={compactCurrency} tick={{ fontSize: 11, fill: CHART_TEXT_MUTED }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: CHART_TEXT_MUTED }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                <Bar dataKey="amount" fill={REVENUE_COLOR} radius={[0, 4, 4, 0]} maxBarSize={20}>
                  <LabelList dataKey="amount" position="right" formatter={(v) => compactCurrency(Number(v))} style={{ fontSize: 11 }} className="fill-plum-600 dark:fill-cream-100" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
