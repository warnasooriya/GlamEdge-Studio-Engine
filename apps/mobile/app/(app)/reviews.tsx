import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { listReviews } from "@/api/reviews";
import { Pagination } from "@/components/Pagination";
import { ReportModal } from "@/components/ReportModal";
import { colors, fonts } from "@/lib/theme";
import { formatDate } from "@/lib/format";

export default function ReviewsScreen() {
  const [page, setPage] = useState(1);
  // Reviews are written by clients, so they need a report route (Guideline 1.2).
  const [reporting, setReporting] = useState<{ id: string; clientName: string } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["reviews", page],
    queryFn: () => listReviews(page),
  });

  return (
    <>
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={data?.reviews ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.summary}>
          <View style={styles.summaryLeft}>
            <Text style={styles.avgRating}>{(data?.avgRating ?? 0).toFixed(1)}</Text>
            <View style={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < Math.round(data?.avgRating ?? 0) ? "star" : "star-outline"}
                  size={16}
                  color={colors.amber}
                />
              ))}
            </View>
          </View>
          <Text style={styles.summaryCount}>{data?.count ?? 0} reviews</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.clientName}>{item.clientName}</Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons key={i} name={i < item.rating ? "star" : "star-outline"} size={13} color={colors.amber} />
            ))}
          </View>
          {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
          <Pressable
            onPress={() => setReporting({ id: item.id, clientName: item.clientName })}
            hitSlop={8}
            style={styles.reportBtn}
          >
            <Ionicons name="flag-outline" size={13} color={colors.textMuted} />
            <Text style={styles.reportText}>Report</Text>
          </Pressable>
        </View>
      )}
      ListFooterComponent={
        data ? <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} /> : null
      }
      ListEmptyComponent={
        !isLoading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No reviews yet.</Text>
          </View>
        ) : null
      }
    />
    <ReportModal
      visible={!!reporting}
      onClose={() => setReporting(null)}
      targetType="REVIEW"
      targetId={reporting?.id ?? ""}
      title={reporting ? `Report review by ${reporting.clientName}` : "Report review"}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avgRating: { fontSize: 28, fontFamily: fonts.displayBold, color: colors.text },
  summaryCount: { fontSize: 13, fontFamily: fonts.sans, color: colors.textMuted },
  stars: { flexDirection: "row", gap: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  clientName: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.text },
  date: { fontSize: 11, fontFamily: fonts.sans, color: colors.textMuted },
  comment: { fontSize: 13, fontFamily: fonts.sans, color: colors.text, marginTop: 8 },
  reportBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 10 },
  reportText: { fontSize: 11, fontFamily: fonts.sansSemiBold, color: colors.textMuted },
  empty: { paddingVertical: 40, alignItems: "center" },
  emptyText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.sans },
});
