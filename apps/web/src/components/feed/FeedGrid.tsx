import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Images, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { PortfolioLightbox } from "@/components/shared/PortfolioLightbox";
import { cn } from "@/lib/utils";
import { PostCard } from "./PostCard";
import { CategoryType, FeedPost } from "@/types";

const CATEGORIES: CategoryType[] = ["LADIES", "GENTS", "KIDS"];

interface FeedResponse {
  posts: FeedPost[];
  nextCursor: string | null;
  total: number;
}

export function FeedGrid({ tenantId, salonName }: { tenantId: string; salonName: string }) {
  const [category, setCategory] = useState<CategoryType | "ALL">("ALL");
  const [viewerPostId, setViewerPostId] = useState<string | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["feed", tenantId, category],
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const res = await api.get<FeedResponse>("/api/feed/public", {
        params: { tenantId, category: category === "ALL" ? undefined : category, cursor: pageParam ?? undefined },
      });
      return res.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const posts = data?.pages.flatMap((p) => p.posts) || [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold text-plum-800 dark:text-cream-50">Our Portfolio</h2>
        <p className="text-sm text-plum-400 dark:text-cream-100/50">
          {total > 0
            ? `${total} look${total === 1 ? "" : "s"} from our stylists — browse by category or tap any photo for details.`
            : "Browse our latest styles and transformations."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={category === "ALL" ? "default" : "outline"} onClick={() => setCategory("ALL")}>
          <Sparkles className="h-3.5 w-3.5" /> All
        </Button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full transition-transform",
              category === c ? "scale-105 ring-2 ring-brand-400 ring-offset-2 ring-offset-transparent" : "opacity-60 hover:opacity-100"
            )}
          >
            <CategoryBadge category={c} />
          </button>
        ))}
      </div>

      {posts.length ? (
        <div className="grid grid-cols-2 items-start gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} onOpenViewer={() => setViewerPostId(post._id)} />
          ))}
        </div>
      ) : (
        <div className="glass-panel flex flex-col items-center gap-2 py-14 text-center">
          <Images className="h-8 w-8 text-plum-200 dark:text-cream-100/20" />
          <p className="text-sm text-plum-400 dark:text-cream-100/50">No posts yet in this category.</p>
        </div>
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
