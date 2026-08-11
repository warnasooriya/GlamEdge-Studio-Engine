import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createWalkInAppointment, listAppointments } from "@/api/appointments";
import { listServices } from "@/api/services";
import { listStaff } from "@/api/staff";
import { cancelPaypalLink, createInvoice, listInvoices } from "@/api/billing";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { CategoryBadge } from "@/components/CategoryBadge";
import { Pagination } from "@/components/Pagination";
import { BottomTabBar } from "@/components/BottomTabBar";
import { colors, fonts } from "@/lib/theme";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { CategoryType, PaymentMode } from "@/types";

const CATEGORIES: CategoryType[] = ["LADIES", "GENTS", "KIDS"];
const PAYMENT_MODES: PaymentMode[] = ["CASH", "CARD", "ONLINE", "LANKAQR", "PAYPAL"];

export default function POSScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <WalkInSaleCard />
        <UnbilledQueueCard />
        <BillingHistoryCard />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

function WalkInSaleCard() {
  const queryClient = useQueryClient();
  const { data: services } = useQuery({ queryKey: ["services"], queryFn: listServices });
  const { data: staff } = useQuery({ queryKey: ["staff"], queryFn: listStaff });

  const [category, setCategory] = useState<CategoryType>("LADIES");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const categoryServices = (services ?? []).filter((s) => s.category === category);
  const total = (services ?? [])
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + Number(s.price), 0);

  function toggleService(id: string) {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createWalkInAppointment({
        clientName: clientName.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        category,
        staffId: staffId || undefined,
        serviceIds: selectedServiceIds,
      }),
    onSuccess: () => {
      setSelectedServiceIds([]);
      setStaffId("");
      setClientName("");
      setClientPhone("");
      queryClient.invalidateQueries({ queryKey: ["appointments", "unbilled"] });
    },
    onError: (err: any) => Alert.alert("Couldn't add walk-in", err.response?.data?.error || "Try again."),
  });

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>New walk-in sale</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((c) => (
          <Pressable key={c} onPress={() => setCategory(c)} style={category === c && styles.chipSelected}>
            <CategoryBadge category={c} />
          </Pressable>
        ))}
      </View>

      <View style={styles.serviceChipRow}>
        {categoryServices.length ? (
          categoryServices.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => toggleService(s.id)}
              style={[styles.serviceChip, selectedServiceIds.includes(s.id) && styles.serviceChipActive]}
            >
              <Text style={[styles.serviceChipText, selectedServiceIds.includes(s.id) && styles.serviceChipTextActive]}>
                {s.name} · {formatCurrency(s.price)}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.mutedText}>No services in this category yet.</Text>
        )}
      </View>

      {selectedServiceIds.length > 0 ? (
        <View style={styles.totalBanner}>
          <Text style={styles.totalBannerText}>
            {selectedServiceIds.length} service{selectedServiceIds.length > 1 ? "s" : ""} selected
          </Text>
          <Text style={styles.totalBannerAmount}>{formatCurrency(total)}</Text>
        </View>
      ) : null}

      <Input placeholder="Client name (optional)" value={clientName} onChangeText={setClientName} />
      <Input placeholder="Phone (optional — for WhatsApp receipt)" value={clientPhone} onChangeText={setClientPhone} keyboardType="phone-pad" />

      <View style={styles.staffRow}>
        <Pressable style={[styles.staffChip, !staffId && styles.staffChipActive]} onPress={() => setStaffId("")}>
          <Text style={[styles.staffChipText, !staffId && styles.staffChipTextActive]}>Unassigned</Text>
        </Pressable>
        {(staff ?? []).map((s) => (
          <Pressable
            key={s.id}
            style={[styles.staffChip, staffId === s.id && styles.staffChipActive]}
            onPress={() => setStaffId(s.id)}
          >
            <Text style={[styles.staffChipText, staffId === s.id && styles.staffChipTextActive]}>{s.name}</Text>
          </Pressable>
        ))}
      </View>

      <Button
        title="Add walk-in"
        onPress={() => createMutation.mutate()}
        loading={createMutation.isPending}
        disabled={selectedServiceIds.length === 0}
      />
    </View>
  );
}

function UnbilledQueueCard() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [paymentModeByAppt, setPaymentModeByAppt] = useState<Record<string, PaymentMode>>({});

  const { data } = useQuery({
    queryKey: ["appointments", "unbilled", page],
    queryFn: () => listAppointments({ page, pageSize: 10, isBilled: false, excludeCancelled: true }),
  });

  const billMutation = useMutation({
    mutationFn: (id: string) => createInvoice(id, paymentModeByAppt[id] || "CASH"),
    onSuccess: (result) => {
      if (result.payUrl) {
        Alert.alert(
          result.whatsappSent ? "Payment link sent via WhatsApp" : "Payment link created",
          `${formatCurrency(result.totalAmount)}${result.whatsappSent ? "" : " — copy the link to share manually."}`,
          [
            { text: "Copy link", onPress: () => Clipboard.setStringAsync(result.payUrl!) },
            { text: "OK" },
          ]
        );
      } else {
        Alert.alert(
          result.whatsappSent ? "Receipt sent via WhatsApp" : "Billed",
          formatCurrency(result.totalAmount),
          [
            result.receiptImageUrl
              ? { text: "View receipt", onPress: () => Linking.openURL(result.receiptImageUrl!) }
              : { text: "OK" },
            { text: "OK" },
          ]
        );
      }
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
    onError: (err: any) => Alert.alert("Billing failed", err.response?.data?.error || "Try again."),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelPaypalLink,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const billable = data?.appointments ?? [];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>One-tap billing</Text>
      {billable.length ? (
        billable.map((appt) => {
          const total = appt.services.reduce((sum, s) => sum + Number(s.price), 0);
          const pendingPaypal = appt.paypalPayment?.status === "PENDING";
          return (
            <View key={appt.id} style={styles.unbilledRow}>
              <View style={styles.unbilledInfo}>
                <View style={styles.unbilledNameRow}>
                  <Text style={styles.unbilledName}>{appt.clientName}</Text>
                  <CategoryBadge category={appt.category} />
                </View>
                <Text style={styles.unbilledMeta}>
                  {appt.services.map((s) => s.service.name).join(", ")} · {formatCurrency(total)}
                </Text>
              </View>
              {pendingPaypal ? (
                <View style={styles.paypalRow}>
                  <Text style={styles.paypalBadge}>Awaiting PayPal</Text>
                  <Pressable onPress={() => cancelMutation.mutate(appt.id)}>
                    <Text style={styles.cancelLink}>Cancel</Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  <View style={styles.modeRow}>
                    {PAYMENT_MODES.map((mode) => (
                      <Pressable
                        key={mode}
                        style={[styles.modeChip, (paymentModeByAppt[appt.id] || "CASH") === mode && styles.modeChipActive]}
                        onPress={() => setPaymentModeByAppt((prev) => ({ ...prev, [appt.id]: mode }))}
                      >
                        <Text
                          style={[
                            styles.modeChipText,
                            (paymentModeByAppt[appt.id] || "CASH") === mode && styles.modeChipTextActive,
                          ]}
                        >
                          {mode}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Button
                    title={paymentModeByAppt[appt.id] === "PAYPAL" ? "Send pay link" : "Bill & send"}
                    onPress={() => billMutation.mutate(appt.id)}
                    loading={billMutation.isPending}
                    style={styles.billBtn}
                  />
                </View>
              )}
            </View>
          );
        })
      ) : (
        <Text style={styles.mutedText}>Nothing to bill right now.</Text>
      )}
      {data ? <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} /> : null}
    </View>
  );
}

function BillingHistoryCard() {
  const [page, setPage] = useState(1);
  const { data } = useQuery({
    queryKey: ["billing", "invoices", page],
    queryFn: () => listInvoices({ page }),
  });

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Billing history</Text>
      {data?.invoices.length ? (
        data.invoices.map((inv) => (
          <View key={inv.id} style={styles.invoiceRow}>
            <View style={styles.unbilledInfo}>
              <Text style={styles.unbilledName}>{inv.clientName}</Text>
              <Text style={styles.unbilledMeta}>
                {inv.services.join(", ")} · {inv.paymentMode} · {formatDateTime(inv.createdAt)}
              </Text>
            </View>
            <View style={styles.invoiceRight}>
              <Text style={styles.invoiceAmount}>{formatCurrency(inv.amount)}</Text>
              <View style={styles.invoiceLinks}>
                <Pressable onPress={() => Linking.openURL(inv.receiptImageUrl)}>
                  <Text style={styles.invoiceLink}>Receipt</Text>
                </Pressable>
                <Pressable onPress={() => Linking.openURL(inv.invoiceUrl)}>
                  <Text style={styles.invoiceLink}>PDF</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.mutedText}>No invoices yet.</Text>
      )}
      {data ? <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardTitle: { fontSize: 15, fontFamily: fonts.displayBold, color: colors.text, marginBottom: 2 },
  chipRow: { flexDirection: "row", gap: 8 },
  chipSelected: { transform: [{ scale: 1.05 }] },
  serviceChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  serviceChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  serviceChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  serviceChipText: { fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.textMuted },
  serviceChipTextActive: { color: "#fff" },
  mutedText: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13 },
  totalBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  totalBannerText: { fontSize: 13, fontFamily: fonts.sans, color: colors.text },
  totalBannerAmount: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.primaryDark },
  staffRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  staffChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  staffChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  staffChipText: { fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.textMuted },
  staffChipTextActive: { color: "#fff" },
  unbilledRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
  unbilledInfo: { flex: 1 },
  unbilledNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  unbilledName: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.text },
  unbilledMeta: { fontSize: 12, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 2 },
  modeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  modeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  modeChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  modeChipText: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.textMuted },
  modeChipTextActive: { color: "#fff" },
  billBtn: {},
  paypalRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  paypalBadge: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.gold },
  cancelLink: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.danger },
  invoiceRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  invoiceRight: { alignItems: "flex-end" },
  invoiceAmount: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.primary },
  invoiceLinks: { flexDirection: "row", gap: 10, marginTop: 4 },
  invoiceLink: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.textMuted },
});
