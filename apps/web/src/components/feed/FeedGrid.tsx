import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PostCard } from "./PostCard";
import { CategoryType, FeedPost } from "@/types";

export function FeedGrid({ tenantId }: { tenantId: string }) {
  const [category, setCategory] = useState<CategoryType | "ALL">("ALL");

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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
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
    </div>
  );
}
