import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLedgerEntry, getReconciliation, listLedgerEntries } from "@/api/ledger";
import { StatTile } from "@/components/StatTile";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Pagination } from "@/components/Pagination";
import { BottomTabBar } from "@/components/BottomTabBar";
import { colors, fonts } from "@/lib/theme";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { LedgerType, PaymentMode } from "@/types";

const PAYMENT_MODES: PaymentMode[] = ["CASH", "CARD", "ONLINE", "LANKAQR"];

export default function OverviewScreen() {
  const queryClient = useQueryClient();
  const [entriesPage, setEntriesPage] = useState(1);

  const { data: reconciliation } = useQuery({
    queryKey: ["ledger", "reconciliation"],
    queryFn: () => getReconciliation(),
  });

  const { data: entriesData } = useQuery({
    queryKey: ["ledger", "entries", entriesPage],
    queryFn: () => listLedgerEntries(entriesPage),
  });

  const [type, setType] = useState<LedgerType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");

  const createMutation = useMutation({
    mutationFn: () => createLedgerEntry({ type, amount: Number(amount), category, paymentMode }),
    onSuccess: () => {
      setAmount("");
      setCategory("");
      setEntriesPage(1);
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
    },
  });

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.statsGrid}>
          <StatTile label="Net Profit Today" value={formatCurrency(reconciliation?.netProfit ?? 0)} icon="trending-up-outline" tone="brand" />
          <StatTile label="Income" value={formatCurrency(reconciliation?.totalIncome ?? 0)} icon="arrow-up-circle-outline" tone="emerald" />
          <StatTile label="Expenses" value={formatCurrency(reconciliation?.totalExpense ?? 0)} icon="arrow-down-circle-outline" tone="rose" />
          <StatTile label="Cash Drawer" value={formatCurrency(reconciliation?.cashDrawer ?? 0)} icon="wallet-outline" tone="gold" />
        </View>

        <Text style={styles.sectionTitle}>Add ledger entry</Text>
        <View style={styles.card}>
          <View style={styles.chipRow}>
            {(["EXPENSE", "INCOME"] as LedgerType[]).map((t) => (
              <Pressable key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
                <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
                  {t === "INCOME" ? "Income" : "Expense"}
                </Text>
              </Pressable>
            ))}
          </View>
          <Input placeholder="Amount" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <Input placeholder="Category (e.g. utility bill)" value={category} onChangeText={setCategory} />
          <View style={styles.chipRow}>
            {PAYMENT_MODES.map((mode) => (
              <Pressable
                key={mode}
                style={[styles.chip, paymentMode === mode && styles.chipActive]}
                onPress={() => setPaymentMode(mode)}
              >
                <Text style={[styles.chipText, paymentMode === mode && styles.chipTextActive]}>{mode}</Text>
              </Pressable>
            ))}
          </View>
          <Button
            title="Add entry"
            onPress={() => createMutation.mutate()}
            loading={createMutation.isPending}
            disabled={!amount || !category}
            style={styles.addBtn}
          />
        </View>

        <Text style={styles.sectionTitle}>Recent entries</Text>
        <View style={styles.card}>
          {entriesData?.entries.length ? (
            entriesData.entries.map((entry) => (
              <View key={entry.id} style={styles.entryRow}>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryCategory} numberOfLines={1}>
                    {entry.category}
                  </Text>
                  <Text style={styles.entryMeta}>
                    {entry.paymentMode} · {formatDateTime(entry.createdAt)}
                  </Text>
                </View>
                <Text style={[styles.entryAmount, { color: entry.type === "INCOME" ? colors.success : colors.danger }]}>
                  {entry.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(Number(entry.amount))}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No ledger entries yet.</Text>
          )}
          {entriesData ? (
            <Pagination page={entriesData.page} totalPages={entriesData.totalPages} onPageChange={setEntriesPage} />
          ) : null}
        </View>
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 15, fontFamily: fonts.displayBold, color: colors.text, marginBottom: 10, marginTop: 6 },
  statsGrid: { flexDirection: "column", gap: 10, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.textMuted },
  chipTextActive: { color: "#fff" },
  addBtn: { marginTop: 2 },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  entryInfo: { flex: 1, marginRight: 8 },
  entryCategory: { fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.text },
  entryMeta: { fontSize: 11, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 1 },
  entryAmount: { fontSize: 14, fontFamily: fonts.sansBold },
  emptyText: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13, textAlign: "center", paddingVertical: 12 },
});
