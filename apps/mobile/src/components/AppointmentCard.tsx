import { Pressable, StyleSheet, Text, View } from "react-native";
import { Appointment } from "@/types";
import { formatDateTime } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";
import { StatusBadge } from "./StatusBadge";

export function AppointmentCard({ appointment, onPress }: { appointment: Appointment; onPress: () => void }) {
  const serviceNames = appointment.services.map((s) => s.service.name).join(", ");

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>
          {appointment.clientName}
        </Text>
        <StatusBadge status={appointment.status} />
      </View>
      <Text style={styles.time}>{formatDateTime(appointment.bookingTime)}</Text>
      {serviceNames ? (
        <Text style={styles.services} numberOfLines={1}>
          {serviceNames}
        </Text>
      ) : null}
      {appointment.rescheduleStatus === "PROPOSED" ? (
        <Text style={styles.pill}>Reschedule proposed</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primaryDeep,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  name: { fontSize: 15, fontFamily: fonts.sansBold, color: colors.text, flex: 1, marginRight: 8 },
  time: { fontSize: 13, fontFamily: fonts.sans, color: colors.textMuted, marginBottom: 2 },
  services: { fontSize: 13, fontFamily: fonts.sans, color: colors.text },
  pill: { marginTop: 6, fontSize: 11, fontFamily: fonts.sansBold, color: colors.amber },
});
