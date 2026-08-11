import { StyleSheet, Text, View } from "react-native";
import { AppointmentStatus } from "@/types";
import { STATUS_COLORS } from "@/lib/format";
import { fonts } from "@/lib/theme";

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { bg, text } = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{status[0] + status.slice(1).toLowerCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  text: { fontSize: 11, fontFamily: fonts.sansBold },
});
