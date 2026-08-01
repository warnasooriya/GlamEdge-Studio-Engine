import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { useToast } from "@/components/ui/toast";
import { useAppSelector } from "@/hooks/redux";
import { CategoryType, FeedPost } from "@/types";
import { ImageEditorModal } from "@/components/feed/ImageEditorModal";

const MAX_MEDIA = 10;

interface StagedMedia {
  id: string;
  file: File;
  previewUrl: string;
  type: "image" | "video";
  edited: boolean;
}

export default function FeedManagePage() {
  const tenant = useAppSelector((s) => s.auth.tenant);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["feed", "mine", tenant?.id],
    queryFn: async () =>
      (await api.get<{ posts: FeedPost[] }>("/api/feed/public", { params: { tenantId: tenant!.id, limit: 30 } })).data,
    enabled: !!tenant,
  });

  const [category, setCategory] = useState<CategoryType>("LADIES");
  const [caption, setCaption] = useState("");
  const [staged, setStaged] = useState<StagedMedia[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    setStaged((prev) => {
      const room = MAX_MEDIA - prev.length;
      if (room <= 0) {
        toast(`Maximum ${MAX_MEDIA} media items per post`, "error");
        return prev;
      }
      if (files.length > room) toast(`Maximum ${MAX_MEDIA} media items per post`, "error");
      const additions: StagedMedia[] = files.slice(0, room).map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        type: file.type.startsWith("video") ? "video" : "image",
        edited: false,
      }));
      return [...prev, ...additions];
    });
  }

  function removeStaged(id: string) {
    setStaged((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  function moveStaged(id: string, direction: -1 | 1) {
    setStaged((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      const swapWith = index + direction;
      if (index === -1 || swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  }

  function handleEditSave(id: string, blob: Blob) {
    setStaged((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        URL.revokeObjectURL(item.previewUrl);
        const editedFile = new File([blob], item.file.name, { type: blob.type });
        return { ...item, file: editedFile, previewUrl: URL.createObjectURL(editedFile), edited: true };
      })
    );
    setEditingId(null);
  }

  const uploadPost = useMutation({
    mutationFn: async () => {
      if (!staged.length) throw new Error("Select at least one photo or video");
      const form = new FormData();
      staged.forEach((item) => form.append("media", item.file, item.file.name));
      form.append("category", category);
      if (caption) form.append("caption", caption);
      return api.post("/api/feed", form, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => {
      toast("Posted to showcase feed", "success");
      setCaption("");
      staged.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setStaged([]);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (err: any) => toast(err.message || err.response?.data?.error || "Upload failed", "error"),
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/feed/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const editingItem = staged.find((item) => item.id === editingId);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload to Showcase Feed</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4"
            multiple
            onChange={handleSelect}
            className="rounded-lg border border-dashed border-brand-300 bg-brand-50 px-3 py-3 text-sm text-plum-500 file:mr-3 file:rounded-full file:border-0 file:bg-gradient-brand file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white dark:border-white/15 dark:bg-white/5 dark:text-cream-100/70"
          />

          {staged.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {staged.map((item, i) => (
                <div key={item.id} className="relative w-24 shrink-0 overflow-hidden rounded-lg border border-plum-100 dark:border-white/10">
                  {item.type === "video" ? (
                    <video src={item.previewUrl} className="aspect-square w-full object-cover" muted />
                  ) : (
                    <img src={item.previewUrl} className="aspect-square w-full object-cover" alt="" />
                  )}

                  <button
                    type="button"
                    onClick={() => removeStaged(item.id)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>

                  {item.type === "image" && (
                    <button
                      type="button"
                      onClick={() => setEditingId(item.id)}
                      className="absolute left-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}

                  {item.edited && (
                    <span className="absolute left-1 bottom-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      Edited
                    </span>
                  )}

                  <div className="absolute bottom-1 right-1 flex gap-0.5">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => moveStaged(item.id, -1)}
                      className="rounded-full bg-black/60 p-0.5 text-white disabled:opacity-30"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={i === staged.length - 1}
                      onClick={() => moveStaged(item.id, 1)}
                      className="rounded-full bg-black/60 p-0.5 text-white disabled:opacity-30"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

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
          <Button onClick={() => uploadPost.mutate()} disabled={uploadPost.isPending || !staged.length} className="self-start">
            Post{staged.length > 1 ? ` (${staged.length})` : ""}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Posts</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {data?.posts.length ? (
            data.posts.map((post) => {
              const first = post.media[0];
              return (
                <div key={post._id} className="flex flex-col gap-1.5 rounded-xl border border-plum-100 p-2 dark:border-white/10">
                  <div className="relative overflow-hidden rounded-lg">
                    {first.type === "video" ? (
                      <video src={first.url} className="aspect-square w-full object-cover" />
                    ) : (
                      <img src={first.url} className="aspect-square w-full object-cover" alt="" />
                    )}
                    {post.media.length > 1 && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        1/{post.media.length}
                      </span>
                    )}
                  </div>
                  <CategoryBadge category={post.category} />
                  <p className="text-xs text-plum-400 dark:text-cream-100/50">
                    {post.likeCount} likes • {post.commentCount} comments
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => deletePost.mutate(post._id)}>
                    Delete
                  </Button>
                </div>
              );
            })
          ) : (
            <p className="col-span-full py-6 text-center text-sm text-plum-300 dark:text-cream-100/40">
              No posts yet — upload one above.
            </p>
          )}
        </CardContent>
      </Card>

      {editingItem && (
        <ImageEditorModal
          imageSrc={editingItem.previewUrl}
          onSave={(blob) => handleEditSave(editingItem.id, blob)}
          onCancel={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
