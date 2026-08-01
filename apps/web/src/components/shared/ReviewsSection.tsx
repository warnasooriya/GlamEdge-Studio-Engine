import { useState } from "react";
import { useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Review } from "@/types";

interface ReviewsPage {
  reviews: Review[];
  avgRating: number;
  count: number;
  page: number;
  totalPages: number;
}

export function ReviewsSection({ slug }: { slug: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["reviews", slug],
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      (await api.get<ReviewsPage>(`/api/reviews/public/${slug}`, { params: { page: pageParam } })).data,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const reviews = data?.pages.flatMap((p) => p.reviews) || [];
  const summary = data?.pages[0];

  const [appointmentId, setAppointmentId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submitReview = useMutation({
    mutationFn: async () =>
      api.post(`/api/reviews/public/${slug}`, { appointmentId, rating, comment: comment || undefined }),
    onSuccess: () => {
      toast("Thanks for your verified review!", "success");
      setAppointmentId("");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["reviews", slug] });
    },
    onError: (err: any) => toast(err.response?.data?.error || "Could not submit review", "error"),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-panel flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold text-white shadow-sm">
          <Star className="h-5 w-5 fill-current" />
        </div>
        <p className="font-display text-lg font-semibold text-plum-800 dark:text-cream-50">
          {summary
            ? `${summary.avgRating.toFixed(1)} · ${summary.count} verified review${summary.count === 1 ? "" : "s"}`
            : "Loading..."}
        </p>
      </div>

      <div className="glass-panel flex flex-col gap-2 p-5">
        <p className="section-heading text-base">Leave a verified review</p>
        <p className="text-xs text-plum-400 dark:text-cream-100/50">
          Only clients with a completed & billed appointment can review. Use the booking reference from
          your confirmation or invoice.
        </p>
        <Input
          placeholder="Booking reference (appointment ID)"
          value={appointmentId}
          onChange={(e) => setAppointmentId(e.target.value)}
        />
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)}>
              <Star className={`h-6 w-6 transition-colors ${n <= rating ? "fill-amber-400 text-amber-400" : "text-plum-100 dark:text-white/15"}`} />
            </button>
          ))}
        </div>
        <Textarea placeholder="How was your visit?" value={comment} onChange={(e) => setComment(e.target.value)} />
        <Button
          disabled={!appointmentId || submitReview.isPending}
          onClick={() => submitReview.mutate()}
          className="self-start"
        >
          Submit Review
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {reviews.map((r) => (
          <div key={r.id} className="glass-panel p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-plum-700 dark:text-cream-50">{r.clientName}</span>
              <span className="text-amber-400">{"★".repeat(r.rating)}</span>
            </div>
            {r.comment && <p className="mt-1 text-plum-500 dark:text-cream-100/70">{r.comment}</p>}
          </div>
        ))}
      </div>

      {hasNextPage && (
        <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </Button>
      )}
    </div>
  );
}
