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
          <input ref={fileRef} type="file" accept="image/*,video/mp4" />
          <div className="flex gap-2">
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
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
          {data?.posts.map((post) => (
            <div key={post._id} className="flex flex-col gap-1">
              {post.mediaType === "video" ? (
                <video src={post.mediaUrl} className="aspect-square w-full rounded-md object-cover" />
              ) : (
                <img src={post.mediaUrl} className="aspect-square w-full rounded-md object-cover" alt="" />
              )}
              <CategoryBadge category={post.category} />
              <p className="text-xs text-slate-500">
                {post.likeCount} likes • {post.commentCount} comments
              </p>
              <Button size="sm" variant="ghost" onClick={() => deletePost.mutate(post._id)}>
                Delete
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
