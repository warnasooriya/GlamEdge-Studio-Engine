import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getCancellationReport, ReportRange } from "@/api/reports";
import { StatTile } from "@/components/StatTile";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Pagination } from "@/components/Pagination";
import { colors, fonts } from "@/lib/theme";
import { formatCurrency } from "@/lib/format";

export function CancellationReport({ range }: { range: ReportRange }) {
  const [page, setPage] = useState(1);
  const { data } = useQuery({
    queryKey: ["reports", "cancellations", range, page],
    queryFn: () => getCancellationReport(range, page),
  });

  return (
    <View>
      <View style={styles.statsGrid}>
        <StatTile label="Cancelled Bookings" value={String(data?.totals.cancelledCount ?? 0)} icon="close-circle-outline" tone="rose" />
        <StatTile label="Cancellation Rate" value={`${(data?.totals.cancellationRate ?? 0).toFixed(0)}%`} icon="stats-chart-outline" tone="gold" />
        <StatTile label="Lost Revenue" value={formatCurrency(data?.totals.lostRevenue ?? 0)} icon="trending-down-outline" tone="rose" />
      </View>

      {data?.appointments.length ? (
        data.appointments.map((a) => (
          <AppointmentCard key={a.id} appointment={a} onPress={() => router.push(`/appointments/${a.id}`)} />
        ))
      ) : (
        <Text style={styles.emptyText}>No cancellations in this range.</Text>
      )}
      {data ? <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: "column", gap: 10, marginBottom: 12 },
  emptyText: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13, textAlign: "center", paddingVertical: 20 },
});
