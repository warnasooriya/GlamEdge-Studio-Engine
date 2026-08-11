import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { listCustomers } from "@/api/customers";
import { BottomTabBar } from "@/components/BottomTabBar";
import { colors, fonts } from "@/lib/theme";
import { formatDate } from "@/lib/format";

export default function CustomersListScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["customers"],
    queryFn: () => listCustomers(1),
  });

  const customers = data?.clients ?? [];

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={customers}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/customers/${item.id}`)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.phone} · {item.visitCount} visit{item.visitCount === 1 ? "" : "s"} · last {formatDate(item.lastVisit)}
              </Text>
            </View>
            {item.avgRating ? (
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={13} color={colors.amber} />
                <Text style={styles.ratingText}>{item.avgRating.toFixed(1)}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No customers yet.</Text>
            </View>
          ) : null
        }
      />
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primaryDeep,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: colors.primaryDark, fontFamily: fonts.sansBold, fontSize: 16 },
  info: { flex: 1 },
  name: { fontSize: 15, fontFamily: fonts.sansBold, color: colors.text },
  meta: { fontSize: 12, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 2 },
  ratingBox: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.text },
  empty: { paddingVertical: 40, alignItems: "center" },
  emptyText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.sans },
});
