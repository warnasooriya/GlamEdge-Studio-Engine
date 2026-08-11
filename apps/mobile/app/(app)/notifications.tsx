import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearAllNotifications,
  deleteNotification,
  listOwnerNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/notifications";
import { BottomTabBar } from "@/components/BottomTabBar";
import { colors, fonts } from "@/lib/theme";
import { formatDateTime } from "@/lib/format";
import { OwnerNotification } from "@/types";

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["owner-notifications", "list"],
    queryFn: () => listOwnerNotifications(1),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["owner-notifications"] });

  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
  });

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: invalidate,
    onError: () => Alert.alert("Couldn't delete", "Try again."),
  });

  const clearAllMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: invalidate,
    onError: () => Alert.alert("Couldn't clear notifications", "Try again."),
  });

  function handlePress(item: OwnerNotification) {
    if (!item.isRead) readMutation.mutate(item.id);
    if (item.appointmentId) router.push(`/appointments/${item.appointmentId}`);
  }

  function confirmDelete(item: OwnerNotification) {
    Alert.alert("Delete notification?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
    ]);
  }

  function confirmClearAll() {
    Alert.alert("Clear all notifications?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear all", style: "destructive", onPress: () => clearAllMutation.mutate() },
    ]);
  }

  const notifications = data?.notifications ?? [];

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          notifications.length > 0 ? (
            <View style={styles.headerActions}>
              {data && data.unreadCount > 0 ? (
                <Pressable onPress={() => readAllMutation.mutate()}>
                  <Text style={styles.headerActionText}>Mark all as read</Text>
                </Pressable>
              ) : (
                <View />
              )}
              <Pressable onPress={confirmClearAll}>
                <Text style={[styles.headerActionText, styles.clearAllText]}>Clear all</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={[styles.card, !item.isRead && styles.cardUnread]} onPress={() => handlePress(item)}>
            <View style={styles.row}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.rowActions}>
                {!item.isRead ? <View style={styles.dot} /> : null}
                <Pressable hitSlop={10} onPress={() => confirmDelete(item)}>
                  <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>You're all caught up.</Text>
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
  headerActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  headerActionText: { color: colors.primary, fontSize: 13, fontFamily: fonts.sansBold },
  clearAllText: { color: colors.danger },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primaryDeep,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  cardUnread: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.text, flex: 1, marginRight: 8 },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  message: { fontSize: 13, fontFamily: fonts.sans, color: colors.text, marginTop: 4 },
  time: { fontSize: 11, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 6 },
  empty: { paddingVertical: 40, alignItems: "center" },
  emptyText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.sans },
});
