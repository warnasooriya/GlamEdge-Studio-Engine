import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Review } from "@/types";

export function ReviewsSection({ slug }: { slug: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["reviews", slug],
    queryFn: async () =>
      (await api.get<{ reviews: Review[]; avgRating: number; count: number }>(`/api/reviews/public/${slug}`)).data,
  });

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
      <div className="glass-panel p-4">
        <p className="text-sm font-semibold">
          {data ? `${data.avgRating.toFixed(1)} ★ (${data.count} verified reviews)` : "Loading..."}
        </p>
      </div>

      <div className="glass-panel flex flex-col gap-2 p-4">
        <p className="text-sm font-medium">Leave a verified review</p>
        <p className="text-xs text-slate-500">
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
              <Star className={`h-5 w-5 ${n <= rating ? "fill-brand-gold text-brand-gold" : "text-slate-300"}`} />
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
        {data?.reviews.map((r) => (
          <div key={r.id} className="glass-panel p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{r.clientName}</span>
              <span className="text-brand-gold">{"★".repeat(r.rating)}</span>
            </div>
            {r.comment && <p className="mt-1 text-slate-600 dark:text-slate-300">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
