import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { RevenueReport } from "@/components/reports/RevenueReport";
import { CancellationReport } from "@/components/reports/CancellationReport";
import { MissedAppointmentsReport } from "@/components/reports/MissedAppointmentsReport";
import { StaffCommissionReport } from "@/components/reports/StaffCommissionReport";
import { colors, fonts } from "@/lib/theme";
import { dateRangeFromDays } from "@/lib/format";

type ReportTab = "revenue" | "cancellations" | "missed" | "staff";

const TABS: { key: ReportTab; label: string }[] = [
  { key: "revenue", label: "Revenue" },
  { key: "cancellations", label: "Cancellations" },
  { key: "missed", label: "Missed" },
  { key: "staff", label: "Staff Commission" },
];

export default function ReportsScreen() {
  const [activeTab, setActiveTab] = useState<ReportTab>("revenue");
  const [days, setDays] = useState(30);
  const range = useMemo(() => dateRangeFromDays(days), [days]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <DateRangeFilter days={days} onChange={setDays} />

      {activeTab === "revenue" ? <RevenueReport range={range} /> : null}
      {activeTab === "cancellations" ? <CancellationReport range={range} /> : null}
      {activeTab === "missed" ? <MissedAppointmentsReport range={range} /> : null}
      {activeTab === "staff" ? <StaffCommissionReport range={range} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  tabScroll: { flexGrow: 0, marginBottom: 14 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  tabActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  tabText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.textMuted },
  tabTextActive: { color: "#fff" },
});
