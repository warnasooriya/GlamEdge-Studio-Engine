import { useState } from "react";
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFeedPost, deleteFeedPost, listFeedPosts } from "@/api/feed";
import { useAppSelector } from "@/hooks/redux";
import { CreatePostModal } from "@/components/CreatePostModal";
import { CategoryBadge } from "@/components/CategoryBadge";
import { colors, fonts } from "@/lib/theme";
import { formatDate } from "@/lib/format";
import { FeedPost } from "@/types";

export default function FeedScreen() {
  const tenant = useAppSelector((s) => s.auth.tenant);
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["feed", tenant?.id],
    queryFn: ({ pageParam }: { pageParam?: string }) => listFeedPosts(tenant!.id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(tenant?.id),
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  const createMutation = useMutation({
    mutationFn: createFeedPost,
    onSuccess: () => {
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (err: any) => Alert.alert("Couldn't create post", err.response?.data?.error || "Try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFeedPost,
    onSuccess: () => {
      setSelectedPost(null);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  function confirmDelete(post: FeedPost) {
    Alert.alert("Delete post?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(post._id) },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.column}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <Pressable style={styles.tile} onPress={() => setSelectedPost(item)}>
            <Image source={{ uri: item.media[0]?.url }} style={styles.tileImage} />
            {item.media[0]?.type === "video" ? (
              <View style={styles.videoBadge}>
                <Ionicons name="play" size={12} color="#fff" />
              </View>
            ) : null}
            {item.media.length > 1 ? (
              <View style={styles.countBadge}>
                <Ionicons name="copy-outline" size={11} color="#fff" />
                <Text style={styles.countText}>{item.media.length}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No posts yet — tap + to showcase your work.</Text>
          </View>
        }
      />

      <Pressable style={styles.fab} onPress={() => setShowCreate(true)}>
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>

      <CreatePostModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(input) => createMutation.mutate(input)}
        loading={createMutation.isPending}
      />

      {selectedPost ? (
        <Pressable style={styles.detailBackdrop} onPress={() => setSelectedPost(null)}>
          <Pressable style={styles.detailCard} onPress={(e) => e.stopPropagation()}>
            <Image source={{ uri: selectedPost.media[0]?.url }} style={styles.detailImage} resizeMode="cover" />
            <View style={styles.detailBody}>
              <View style={styles.detailHeader}>
                <CategoryBadge category={selectedPost.category} />
                <Text style={styles.detailDate}>{formatDate(selectedPost.createdAt)}</Text>
              </View>
              {selectedPost.caption ? <Text style={styles.detailCaption}>{selectedPost.caption}</Text> : null}
              <View style={styles.detailStats}>
                <Text style={styles.detailStat}>
                  <Ionicons name="heart-outline" size={13} /> {selectedPost.likeCount}
                </Text>
                <Text style={styles.detailStat}>
                  <Ionicons name="chatbubble-outline" size={13} /> {selectedPost.commentCount}
                </Text>
              </View>
              <Pressable style={styles.deleteBtn} onPress={() => confirmDelete(selectedPost)}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={styles.deleteText}>Delete post</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      ) : null}

      {isFetchingNextPage ? <Text style={styles.loadingMore}>Loading more...</Text> : null}
    </View>
  );
}

const TILE_GAP = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  grid: { padding: TILE_GAP },
  column: { gap: TILE_GAP },
  tile: { flex: 1, aspectRatio: 1, marginBottom: TILE_GAP, borderRadius: 10, overflow: "hidden", backgroundColor: colors.surface },
  tileImage: { width: "100%", height: "100%" },
  videoBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 10,
    padding: 4,
  },
  countBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  countText: { color: "#fff", fontSize: 10, fontFamily: fonts.sansBold },
  empty: { paddingVertical: 60, alignItems: "center", paddingHorizontal: 32 },
  emptyText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.sans, textAlign: "center" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryDeep,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  loadingMore: { textAlign: "center", color: colors.textMuted, fontFamily: fonts.sans, fontSize: 12, paddingBottom: 12 },
  detailBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  detailCard: { width: "100%", backgroundColor: colors.surface, borderRadius: 20, overflow: "hidden" },
  detailImage: { width: "100%", height: 280, backgroundColor: colors.bg },
  detailBody: { padding: 16, gap: 10 },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailDate: { fontSize: 12, fontFamily: fonts.sans, color: colors.textMuted },
  detailCaption: { fontSize: 14, fontFamily: fonts.sans, color: colors.text },
  detailStats: { flexDirection: "row", gap: 16 },
  detailStat: { fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.textMuted },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  deleteText: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.danger },
});
