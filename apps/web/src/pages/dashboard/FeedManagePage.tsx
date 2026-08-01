import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { useToast } from "@/components/ui/toast";
import { useAppSelector } from "@/hooks/redux";
import { CategoryType, FeedPost } from "@/types";

export default function FeedManagePage() {
  const tenant = useAppSelector((s) => s.auth.tenant);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery({
    queryKey: ["feed", "mine", tenant?.id],
    queryFn: async () =>
      (await api.get<{ posts: FeedPost[] }>("/api/feed/public", { params: { tenantId: tenant!.id, limit: 30 } })).data,
    enabled: !!tenant,
  });

  const [category, setCategory] = useState<CategoryType>("LADIES");
  const [caption, setCaption] = useState("");

  const uploadPost = useMutation({
    mutationFn: async () => {
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error("Select a photo or video first");
      const form = new FormData();
      form.append("media", file);
      form.append("category", category);
      if (caption) form.append("caption", caption);
      return api.post("/api/feed", form, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => {
      toast("Posted to showcase feed", "success");
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (err: any) => toast(err.message || err.response?.data?.error || "Upload failed", "error"),
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/feed/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload to Showcase Feed</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4"
            className="rounded-lg border border-dashed border-brand-300 bg-brand-50 px-3 py-3 text-sm text-plum-500 file:mr-3 file:rounded-full file:border-0 file:bg-gradient-brand file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white dark:border-white/15 dark:bg-white/5 dark:text-cream-100/70"
          />
          <div className="flex gap-2">
            <select
              className="h-10 rounded-lg border border-plum-100 bg-white/90 px-2.5 text-sm shadow-sm dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50"
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
            >
              <option value="LADIES">Ladies</option>
              <option value="GENTS">Gents</option>
              <option value="KIDS">Kids</option>
            </select>
            <Input placeholder="Caption (e.g. #BridalDressing)" value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>
          <Button onClick={() => uploadPost.mutate()} disabled={uploadPost.isPending} className="self-start">
            Post
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Posts</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {data?.posts.length ? (
            data.posts.map((post) => (
              <div key={post._id} className="flex flex-col gap-1.5 rounded-xl border border-plum-100 p-2 dark:border-white/10">
                {post.mediaType === "video" ? (
                  <video src={post.mediaUrl} className="aspect-square w-full rounded-lg object-cover" />
                ) : (
                  <img src={post.mediaUrl} className="aspect-square w-full rounded-lg object-cover" alt="" />
                )}
                <CategoryBadge category={post.category} />
                <p className="text-xs text-plum-400 dark:text-cream-100/50">
                  {post.likeCount} likes • {post.commentCount} comments
                </p>
                <Button size="sm" variant="ghost" onClick={() => deletePost.mutate(post._id)}>
                  Delete
                </Button>
              </div>
            ))
          ) : (
            <p className="col-span-full py-6 text-center text-sm text-plum-300 dark:text-cream-100/40">
              No posts yet — upload one above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
