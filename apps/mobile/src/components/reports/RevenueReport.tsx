import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getRevenueReport, ReportRange } from "@/api/reports";
import { StatTile } from "@/components/StatTile";
import { LineChart } from "@/components/charts/LineChart";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import { colors, fonts } from "@/lib/theme";
import { formatCurrency } from "@/lib/format";

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function RevenueReport({ range }: { range: ReportRange }) {
  const { data } = useQuery({
    queryKey: ["reports", "revenue", range],
    queryFn: () => getRevenueReport(range),
  });

  return (
    <View>
      <View style={styles.statsGrid}>
        <StatTile label="Income" value={formatCurrency(data?.totals.income ?? 0)} icon="arrow-up-circle-outline" tone="emerald" />
        <StatTile label="Expenses" value={formatCurrency(data?.totals.expense ?? 0)} icon="arrow-down-circle-outline" tone="rose" />
        <StatTile label="Net Profit" value={formatCurrency(data?.totals.net ?? 0)} icon="trending-up-outline" tone="brand" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Income vs expense</Text>
        <LineChart
          series={[
            {
              label: "Income",
              color: colors.success,
              points: (data?.byDay ?? []).map((d) => ({ label: shortDate(d.date), value: d.income })),
            },
            {
              label: "Expense",
              color: colors.danger,
              points: (data?.byDay ?? []).map((d) => ({ label: shortDate(d.date), value: d.expense })),
            },
          ]}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Revenue by payment mode</Text>
        <HorizontalBarChart
          data={(data?.byPaymentMode ?? [])
            .slice()
            .sort((a, b) => b.amount - a.amount)
            .map((p) => ({ label: p.paymentMode, value: p.amount }))}
          formatValue={formatCurrency}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
