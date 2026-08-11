import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAppointment, proposeReschedule, updateAppointmentStatus } from "@/api/appointments";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { RescheduleModal } from "@/components/RescheduleModal";
import { ChatThread } from "@/components/ChatThread";
import { colors, fonts } from "@/lib/theme";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [showReschedule, setShowReschedule] = useState(false);

  const { data: appointment, isLoading } = useQuery({
    queryKey: ["appointment", id],
    queryFn: () => getAppointment(id),
  });

  useEffect(() => {
    if (appointment) navigation.setOptions({ title: appointment.clientName });
  }, [appointment?.clientName]);

  const statusMutation = useMutation({
    mutationFn: (status: "CONFIRMED" | "COMPLETED" | "CANCELLED") => updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err: any) => Alert.alert("Couldn't update", err.response?.data?.error || "Try again."),
  });

  const rescheduleMutation = useMutation({
    mutationFn: (proposedBookingTime: string) => proposeReschedule(id, { proposedBookingTime }),
    onSuccess: () => {
      setShowReschedule(false);
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err: any) => Alert.alert("Couldn't propose", err.response?.data?.error || "Try again."),
  });

  function confirmCancel() {
    Alert.alert("Cancel appointment?", "This can't be undone.", [
      { text: "Keep it", style: "cancel" },
      { text: "Cancel appointment", style: "destructive", onPress: () => statusMutation.mutate("CANCELLED") },
    ]);
  }

  if (isLoading || !appointment) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Loading...</Text>
      </View>
    );
  }

  const total = appointment.services.reduce((sum, s) => sum + parseFloat(s.price), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.time}>{formatDateTime(appointment.bookingTime)}</Text>
        <StatusBadge status={appointment.status} />
      </View>

      {appointment.rescheduleStatus === "PROPOSED" ? (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Reschedule proposed
            {appointment.proposedBookingTime ? ` for ${formatDateTime(appointment.proposedBookingTime)}` : ""} — waiting
            on the client to respond.
          </Text>
        </View>
      ) : null}

      <Section title="Client">
        <Text style={styles.value}>{appointment.clientName}</Text>
        <Text style={styles.valueMuted}>{appointment.clientPhone}</Text>
      </Section>

      <Section title="Services">
        {appointment.services.map((s) => (
          <View key={s.serviceId} style={styles.serviceRow}>
            <Text style={styles.value}>{s.service.name}</Text>
            <Text style={styles.valueMuted}>{formatCurrency(s.price)}</Text>
          </View>
        ))}
        <View style={[styles.serviceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalLabel}>{formatCurrency(total)}</Text>
        </View>
      </Section>

      {appointment.staff ? (
        <Section title="Staff">
          <Text style={styles.value}>{appointment.staff.name}</Text>
        </Section>
      ) : null}

      {appointment.notes ? (
        <Section title="Notes">
          <Text style={styles.value}>{appointment.notes}</Text>
        </Section>
      ) : null}

      <Section title="Message client">
        <ChatThread appointmentId={id} />
      </Section>

      {appointment.status === "PENDING" || appointment.status === "CONFIRMED" ? (
        <View style={styles.actions}>
          {appointment.status === "PENDING" ? (
            <Button
              title="Confirm"
              onPress={() => statusMutation.mutate("CONFIRMED")}
              loading={statusMutation.isPending}
            />
          ) : null}
          {appointment.status === "CONFIRMED" ? (
            <Button
              title="Mark completed"
              onPress={() => statusMutation.mutate("COMPLETED")}
              loading={statusMutation.isPending}
            />
          ) : null}
          <Button
            title="Propose reschedule"
            variant="secondary"
            onPress={() => setShowReschedule(true)}
            disabled={appointment.rescheduleStatus === "PROPOSED"}
          />
          <Button title="Cancel appointment" variant="danger" onPress={confirmCancel} loading={statusMutation.isPending} />
        </View>
      ) : null}

      <RescheduleModal
        visible={showReschedule}
        onClose={() => setShowReschedule(false)}
        onSubmit={(t) => rescheduleMutation.mutate(t)}
        loading={rescheduleMutation.isPending}
      />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  time: { fontSize: 16, fontFamily: fonts.sansBold, color: colors.text },
  noticeBox: { backgroundColor: "#FEF3C7", borderRadius: 10, padding: 12, marginBottom: 16 },
  noticeText: { color: "#92400E", fontSize: 13, fontFamily: fonts.sans },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primaryDeep,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: fonts.sansBold,
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: { fontSize: 15, fontFamily: fonts.sans, color: colors.text },
  valueMuted: { fontSize: 13, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 2 },
  serviceRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 6, paddingTop: 8 },
  totalLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.text },
  actions: { gap: 10, marginTop: 4 },
});
