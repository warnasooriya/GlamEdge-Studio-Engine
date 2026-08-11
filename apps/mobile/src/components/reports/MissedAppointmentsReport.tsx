import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getMissedAppointmentsReport, ReportRange } from "@/api/reports";
import { StatTile } from "@/components/StatTile";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Pagination } from "@/components/Pagination";
import { colors, fonts } from "@/lib/theme";

export function MissedAppointmentsReport({ range }: { range: ReportRange }) {
  const [page, setPage] = useState(1);
  const { data } = useQuery({
    queryKey: ["reports", "missed", range, page],
    queryFn: () => getMissedAppointmentsReport(range, page),
  });

  return (
    <View>
      <View style={styles.statsGrid}>
        <StatTile label="Missed Bookings" value={String(data?.totals.missedCount ?? 0)} icon="alert-circle-outline" tone="rose" />
      </View>
      <Text style={styles.subtitle}>
        Bookings that stayed Pending or Confirmed past their scheduled time — likely no-shows or forgotten follow-ups.
      </Text>

      {data?.appointments.length ? (
        data.appointments.map((a) => (
          <AppointmentCard key={a.id} appointment={a} onPress={() => router.push(`/appointments/${a.id}`)} />
        ))
      ) : (
        <Text style={styles.emptyText}>No missed appointments in this range.</Text>
      )}
      {data ? <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: "column", gap: 10, marginBottom: 8 },
  subtitle: { fontSize: 12, fontFamily: fonts.sans, color: colors.textMuted, marginBottom: 12, lineHeight: 18 },
  emptyText: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13, textAlign: "center", paddingVertical: 20 },
});
