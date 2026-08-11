import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getStaffCommissionDetail, getStaffCommissionSummary, ReportRange } from "@/api/reports";
import { StatTile } from "@/components/StatTile";
import { Pagination } from "@/components/Pagination";
import { colors, fonts } from "@/lib/theme";
import { formatCurrency, formatDateTime } from "@/lib/format";

export function StaffCommissionReport({ range }: { range: ReportRange }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["reports", "staff-commission", range],
    queryFn: () => getStaffCommissionSummary(range),
  });

  return (
    <View>
      <View style={styles.statsGrid}>
        <StatTile label="Active Staff" value={String(data?.staff.length ?? 0)} icon="people-outline" tone="brand" />
        <StatTile label="Total Revenue" value={formatCurrency(data?.totals.totalRevenue ?? 0)} icon="cash-outline" tone="emerald" />
        <StatTile label="Total Commission" value={formatCurrency(data?.totals.totalCommission ?? 0)} icon="wallet-outline" tone="gold" />
      </View>

      {data?.staff.length ? (
        data.staff.map((s) => (
          <StaffRow
            key={s.staffId}
            staffId={s.staffId}
            name={s.staffName}
            role={s.role}
            appointmentsCount={s.appointmentsCount}
            revenue={s.revenue}
            commissionRate={s.commissionRate}
            commissionEarned={s.commissionEarned}
            expanded={expandedId === s.staffId}
            onToggle={() => setExpandedId(expandedId === s.staffId ? null : s.staffId)}
            range={range}
          />
        ))
      ) : (
        <Text style={styles.emptyText}>No billed appointments in this range.</Text>
      )}
    </View>
  );
}

function StaffRow({
  staffId,
  name,
  role,
  appointmentsCount,
  revenue,
  commissionRate,
  commissionEarned,
  expanded,
  onToggle,
  range,
}: {
  staffId: string;
  name: string;
  role: string;
  appointmentsCount: number;
  revenue: number;
  commissionRate: number;
  commissionEarned: number;
  expanded: boolean;
  onToggle: () => void;
  range: ReportRange;
}) {
  const [page, setPage] = useState(1);
  const { data: detail } = useQuery({
    queryKey: ["reports", "staff-commission", "detail", staffId, range, page],
    queryFn: () => getStaffCommissionDetail(staffId, range, page),
    enabled: expanded,
  });

  return (
    <View style={styles.card}>
      <Pressable style={styles.row} onPress={onToggle}>
        <View style={styles.rowInfo}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>
            {role} · {appointmentsCount} billed · {commissionRate}% commission
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.commission}>{formatCurrency(commissionEarned)}</Text>
          <Text style={styles.revenue}>{formatCurrency(revenue)} revenue</Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
      </Pressable>

      {expanded ? (
        <View style={styles.detailWrap}>
          {detail?.appointments.length ? (
            detail.appointments.map((a) => (
              <View key={a.id} style={styles.detailRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailClient}>{a.clientName}</Text>
                  <Text style={styles.meta}>
                    {formatDateTime(a.bookingTime)} · {a.services.join(", ")}
                  </Text>
                </View>
                <Text style={styles.detailAmount}>{formatCurrency(a.commissionEarned)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Loading…</Text>
          )}
          {detail ? <Pagination page={detail.page} totalPages={detail.totalPages} onPageChange={setPage} /> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: "column", gap: 10, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", padding: 14, gap: 8 },
  rowInfo: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.text },
  meta: { fontSize: 11, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 2 },
  rowRight: { alignItems: "flex-end" },
  commission: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.primary },
  revenue: { fontSize: 10, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 1 },
  detailWrap: { borderTopWidth: 1, borderTopColor: colors.border, padding: 14, paddingTop: 6 },
  detailRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailClient: { fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.text },
  detailAmount: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.text },
  emptyText: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13, textAlign: "center", paddingVertical: 20 },
});
