import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getCustomerDetail } from "@/api/customers";
import { StatusBadge } from "@/components/StatusBadge";
import { colors, fonts } from "@/lib/theme";
import { formatDate, formatDateTime } from "@/lib/format";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => getCustomerDetail(id),
  });

  if (isLoading || !data) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.name}>{data.client.name}</Text>
        <Text style={styles.meta}>{data.client.phone}</Text>
        <Text style={styles.meta}>Customer since {formatDate(data.client.createdAt)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Appointment history</Text>
      {data.appointments.map((a) => (
        <View key={a.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.value}>{formatDateTime(a.bookingTime)}</Text>
            <StatusBadge status={a.status} />
          </View>
          <Text style={styles.services}>{a.services.map((s) => s.service.name).join(", ")}</Text>
        </View>
      ))}
      {data.appointments.length === 0 ? <Text style={styles.emptyText}>No appointment history.</Text> : null}

      <Text style={styles.sectionTitle}>Reviews</Text>
      {data.reviews.map((r) => (
        <View key={r.id} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons key={i} name={i < r.rating ? "star" : "star-outline"} size={14} color={colors.amber} />
              ))}
            </View>
            <Text style={styles.meta}>{formatDate(r.createdAt)}</Text>
          </View>
          {r.comment ? <Text style={styles.value}>{r.comment}</Text> : null}
        </View>
      ))}
      {data.reviews.length === 0 ? <Text style={styles.emptyText}>No reviews yet.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  header: { marginBottom: 20 },
  name: { fontSize: 23, fontFamily: fonts.displayBold, color: colors.text },
  meta: { fontSize: 13, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.sansBold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  value: { fontSize: 14, fontFamily: fonts.sans, color: colors.text },
  services: { fontSize: 13, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 2 },
  stars: { flexDirection: "row", gap: 2 },
  emptyText: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans },
});
