import { api } from "./client";
import { CategoryType, FeedPost } from "@/types";

export async function listFeedPosts(tenantId: string, cursor?: string) {
  const { data } = await api.get<{ success: boolean; posts: FeedPost[]; nextCursor: string | null }>(
    "/api/feed/public",
    { params: { tenantId, cursor, limit: 24 } }
  );
  return data;
}

export interface FeedMediaFile {
  uri: string;
  name: string;
  type: string;
}

export async function createFeedPost(input: {
  category: CategoryType;
  caption?: string;
  tags?: string;
  media: FeedMediaFile[];
}) {
  const form = new FormData();
  form.append("category", input.category);
  if (input.caption) form.append("caption", input.caption);
  if (input.tags) form.append("tags", input.tags);
  input.media.forEach((file) => {
    form.append("media", file as unknown as Blob);
  });
  const { data } = await api.post<{ success: boolean; post: FeedPost }>("/api/feed", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.post;
}

export async function deleteFeedPost(postId: string) {
  await api.delete(`/api/feed/${postId}`);
}
