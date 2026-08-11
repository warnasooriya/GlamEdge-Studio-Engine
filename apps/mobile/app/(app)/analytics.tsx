import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getAnalyticsOverview } from "@/api/analytics";
import { StatTile } from "@/components/StatTile";
import { LineChart } from "@/components/charts/LineChart";
import { BarChart } from "@/components/charts/BarChart";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import { Heatmap } from "@/components/charts/Heatmap";
import { colors, fonts } from "@/lib/theme";
import { formatCurrency, STATUS_COLORS } from "@/lib/format";
import { AppointmentStatus, CategoryType } from "@/types";

const PERIODS: (7 | 30 | 90)[] = [7, 30, 90];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CATEGORY_COLORS: Record<CategoryType, string> = { LADIES: "#f0367e", GENTS: "#1e40af", KIDS: "#d97706" };

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function AnalyticsScreen() {
  const [days, setDays] = useState<7 | 30 | 90>(30);

  const { data } = useQuery({
    queryKey: ["analytics", "overview", days],
    queryFn: () => getAnalyticsOverview(days),
  });

  const cancellationRate = useMemo(() => {
    if (!data) return 0;
    const total = data.bookingsByStatus.reduce((sum, s) => sum + s.count, 0);
    const cancelled = data.bookingsByStatus.find((s) => s.status === "CANCELLED")?.count ?? 0;
    return total > 0 ? (cancelled / total) * 100 : 0;
  }, [data]);

  const bookingsByDay = useMemo(() => {
    if (!data) return [];
    const totals = new Array(7).fill(0);
    data.peakTimes.forEach((p) => (totals[p.dayOfWeek] += p.count));
    return DAY_LABELS.map((label, i) => ({ label, value: totals[i] }));
  }, [data]);

  const ratingDistribution = useMemo(() => {
    if (!data) return [];
    const byRating = new Map(data.ratingDistribution.map((r) => [r.rating, r.count]));
    return [1, 2, 3, 4, 5].map((r) => ({ label: `${r}★`, value: byRating.get(r) || 0 }));
  }, [data]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.chipRow}>
        {PERIODS.map((p) => (
          <Pressable key={p} style={[styles.chip, days === p && styles.chipActive]} onPress={() => setDays(p)}>
            <Text style={[styles.chipText, days === p && styles.chipTextActive]}>{p} days</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.statsGrid}>
        <StatTile label="Revenue" value={formatCurrency(data?.totals.revenue ?? 0)} icon="cash-outline" tone="brand" />
        <StatTile label="Bookings" value={String(data?.totals.bookings ?? 0)} icon="calendar-outline" tone="gold" />
        <StatTile label="Avg Rating" value={(data?.totals.avgRating ?? 0).toFixed(1)} icon="star-outline" tone="emerald" />
        <StatTile label="Cancellation Rate" value={`${cancellationRate.toFixed(0)}%`} icon="close-circle-outline" tone="rose" />
      </View>

      <Section title="Revenue trend">
        <LineChart
          data={(data?.revenueTrend ?? []).map((r) => ({ label: shortDate(r.date), value: r.revenue }))}
          formatValue={formatCurrency}
        />
      </Section>

      <Section title="Peak booking times">
        <Heatmap data={data?.peakTimes ?? []} />
      </Section>

      <Section title="Bookings by day of week">
        <BarChart data={bookingsByDay} />
      </Section>

      <Section title="Bookings by status">
        <BarChart
          data={(data?.bookingsByStatus ?? []).map((s) => ({
            label: s.status[0] + s.status.slice(1).toLowerCase(),
            value: s.count,
            color: STATUS_COLORS[s.status as AppointmentStatus].text,
          }))}
        />
      </Section>

      <Section title="Bookings by category">
        <BarChart
          data={(data?.bookingsByCategory ?? []).map((c) => ({
            label: c.category[0] + c.category.slice(1).toLowerCase(),
            value: c.count,
            color: CATEGORY_COLORS[c.category],
          }))}
        />
      </Section>

      <Section title="Top services by revenue">
        <HorizontalBarChart
          data={(data?.topServices ?? []).map((s) => ({ label: s.name, value: s.revenue }))}
          formatValue={formatCurrency}
        />
      </Section>

      <Section title="Rating distribution">
        <BarChart data={ratingDistribution} />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  chipRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.textMuted },
  chipTextActive: { color: "#fff" },
  statsGrid: { flexDirection: "column", gap: 10, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.text, marginBottom: 12 },
});
