import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import { TrendingUp, CalendarClock, Star, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/shared/StatTile";
import { ChartTooltip, EmptyChart, compactCurrency } from "@/components/shared/chartHelpers";
import { BookingHeatmap } from "@/components/analytics/BookingHeatmap";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_COLORS, STATUS_COLORS, REVENUE_COLOR, RATING_COLOR, BOOKINGS_COLOR, CHART_GRID, CHART_TEXT_MUTED } from "@/lib/chartColors";
import { AppointmentStatus, CategoryType } from "@/types";

interface AnalyticsOverview {
  range: { days: number; from: string; to: string };
  totals: { revenue: number; bookings: number; avgRating: number; reviewCount: number };
  revenueTrend: { date: string; revenue: number }[];
  bookingsByStatus: { status: AppointmentStatus; count: number }[];
  bookingsByCategory: { category: CategoryType; count: number }[];
  topServices: { name: string; revenue: number; count: number }[];
  ratingDistribution: { rating: number; count: number }[];
  peakTimes: { dayOfWeek: number; hour: number; count: number }[];
}

const PERIODS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const CATEGORY_LABEL: Record<CategoryType, string> = {
  LADIES: "Ladies",
  GENTS: "Gents",
  KIDS: "Kids",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AnalyticsPage() {
  const [days, setDays] = useState<7 | 30 | 90>(30);

  const { data } = useQuery({
    queryKey: ["analytics", "overview", days],
    queryFn: async () => (await api.get<AnalyticsOverview>("/api/analytics/overview", { params: { days } })).data,
  });

  const revenueSeries = useMemo(() => {
    if (!data) return [];
    const byDate = new Map(data.revenueTrend.map((r) => [r.date.slice(0, 10), r.revenue]));
    const out: { date: string; label: string; revenue: number }[] = [];
    const cursor = new Date(data.range.from);
    const to = new Date(data.range.to);
    while (cursor <= to) {
      const key = cursor.toISOString().slice(0, 10);
      out.push({
        date: key,
        label: cursor.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
        revenue: byDate.get(key) ?? 0,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return out;
  }, [data]);

  const cancelledCount = data?.bookingsByStatus.find((s) => s.status === "CANCELLED")?.count ?? 0;
  const cancellationRate = data && data.totals.bookings > 0 ? (cancelledCount / data.totals.bookings) * 100 : 0;

  const bookingsByDayOfWeek = useMemo(() => {
    if (!data) return [];
    const totals = new Array(7).fill(0);
    data.peakTimes.forEach((p) => {
      totals[p.dayOfWeek] += p.count;
    });
    return DAY_LABELS.map((label, i) => ({ label, count: totals[i] }));
  }, [data]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-semibold text-plum-800 dark:text-cream-50">Business Overview</h1>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <Button key={p.days} size="sm" variant={days === p.days ? "default" : "outline"} onClick={() => setDays(p.days)}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <StatTile label="Revenue" value={data ? formatCurrency(data.totals.revenue) : "—"} icon={TrendingUp} tone="brand" />
        <StatTile label="Bookings" value={data ? String(data.totals.bookings) : "—"} icon={CalendarClock} tone="emerald" />
        <StatTile
          label="Avg Rating"
          value={data ? (data.totals.reviewCount ? data.totals.avgRating.toFixed(1) : "—") : "—"}
          icon={Star}
          tone="gold"
        />
        <StatTile label="Cancellation Rate" value={data ? `${cancellationRate.toFixed(0)}%` : "—"} icon={XCircle} tone="rose" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {!data ? (
            <EmptyChart label="Loading..." />
          ) : revenueSeries.every((d) => d.revenue === 0) ? (
            <EmptyChart label="No revenue recorded in this period yet." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART_GRID} strokeWidth={1} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: CHART_TEXT_MUTED }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: CHART_TEXT_MUTED }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={compactCurrency}
                  width={40}
                />
                <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={REVENUE_COLOR}
                  strokeWidth={2}
                  fill={REVENUE_COLOR}
                  fillOpacity={0.1}
                  dot={false}
                  activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Peak Booking Times</CardTitle>
          </CardHeader>
          <CardContent>
            {!data ? <EmptyChart label="Loading..." /> : <BookingHeatmap data={data.peakTimes} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings by Day of Week</CardTitle>
          </CardHeader>
          <CardContent>
            {!data || bookingsByDayOfWeek.every((d) => d.count === 0) ? (
              <EmptyChart label="No bookings in this period yet." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bookingsByDayOfWeek} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={CHART_GRID} strokeWidth={1} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART_TEXT_MUTED }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: CHART_TEXT_MUTED }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill={BOOKINGS_COLOR} radius={[4, 4, 0, 0]} maxBarSize={36}>
                    <LabelList dataKey="count" position="top" style={{ fontSize: 11 }} className="fill-plum-600 dark:fill-cream-100" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bookings by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {!data || data.bookingsByStatus.length === 0 ? (
              <EmptyChart label="No bookings in this period yet." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.bookingsByStatus.map((s) => ({ ...s, label: STATUS_LABEL[s.status] }))} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={CHART_GRID} strokeWidth={1} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART_TEXT_MUTED }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: CHART_TEXT_MUTED }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {data.bookingsByStatus.map((s, i) => (
                      <Cell key={i} fill={STATUS_COLORS[s.status]} />
                    ))}
                    <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: "currentColor" }} className="fill-plum-600 dark:fill-cream-100" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {!data || data.bookingsByCategory.length === 0 ? (
              <EmptyChart label="No bookings in this period yet." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.bookingsByCategory.map((c) => ({ ...c, label: CATEGORY_LABEL[c.category] }))} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={CHART_GRID} strokeWidth={1} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART_TEXT_MUTED }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: CHART_TEXT_MUTED }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {data.bookingsByCategory.map((c, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[c.category]} />
                    ))}
                    <LabelList dataKey="count" position="top" style={{ fontSize: 11 }} className="fill-plum-600 dark:fill-cream-100" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Services by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {!data || data.topServices.length === 0 ? (
              <EmptyChart label="No billed services in this period yet." />
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, data.topServices.length * 44)}>
                <BarChart
                  data={data.topServices}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke={CHART_GRID} strokeWidth={1} />
                  <XAxis type="number" tickFormatter={compactCurrency} tick={{ fontSize: 11, fill: CHART_TEXT_MUTED }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: CHART_TEXT_MUTED }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                  <Bar dataKey="revenue" fill={REVENUE_COLOR} radius={[0, 4, 4, 0]} maxBarSize={20}>
                    <LabelList dataKey="revenue" position="right" formatter={(v) => compactCurrency(Number(v))} style={{ fontSize: 11 }} className="fill-plum-600 dark:fill-cream-100" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {!data || data.totals.reviewCount === 0 ? (
              <EmptyChart label="No reviews in this period yet." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[1, 2, 3, 4, 5].map((r) => ({
                    rating: `${r} ★`,
                    count: data.ratingDistribution.find((d) => d.rating === r)?.count ?? 0,
                  }))}
                  margin={{ top: 20, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke={CHART_GRID} strokeWidth={1} />
                  <XAxis dataKey="rating" tick={{ fontSize: 11, fill: CHART_TEXT_MUTED }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: CHART_TEXT_MUTED }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill={RATING_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList dataKey="count" position="top" style={{ fontSize: 11 }} className="fill-plum-600 dark:fill-cream-100" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
