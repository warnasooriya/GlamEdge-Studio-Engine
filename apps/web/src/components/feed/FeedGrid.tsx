import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PortfolioLightbox } from "@/components/shared/PortfolioLightbox";
import { PostCard } from "./PostCard";
import { CategoryType, FeedPost } from "@/types";

export function FeedGrid({ tenantId, salonName }: { tenantId: string; salonName: string }) {
  const [category, setCategory] = useState<CategoryType | "ALL">("ALL");
  const [viewerPostId, setViewerPostId] = useState<string | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["feed", tenantId, category],
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const res = await api.get<{ posts: FeedPost[]; nextCursor: string | null }>("/api/feed/public", {
        params: { tenantId, category: category === "ALL" ? undefined : category, cursor: pageParam ?? undefined },
      });
      return res.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const posts = data?.pages.flatMap((p) => p.posts) || [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {(["ALL", "LADIES", "GENTS", "KIDS"] as const).map((c) => (
          <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>
            {c}
          </Button>
        ))}
      </div>

      {posts.length ? (
        <div className="columns-2 gap-3 md:columns-3 [&>*]:mb-3">
          {posts.map((post) => (
            <div key={post._id} className="break-inside-avoid">
              <PostCard post={post} onOpenViewer={() => setViewerPostId(post._id)} />
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-400">No posts yet in this category.</p>
      )}

      {hasNextPage && (
        <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </Button>
      )}

      {viewerPostId && (
        <PortfolioLightbox
          tenantId={tenantId}
          salonName={salonName}
          open={!!viewerPostId}
          onOpenChange={(next) => !next && setViewerPostId(null)}
          initialPostId={viewerPostId}
        />
      )}
    </div>
  );
}
