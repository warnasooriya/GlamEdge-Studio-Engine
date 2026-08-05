import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/shared/Pagination";
import { Review } from "@/types";

interface ReviewsResponse {
  reviews: Review[];
  avgRating: number;
  count: number;
  page: number;
  totalPages: number;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-plum-100 dark:text-white/15"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["reviews", "owner", page],
    queryFn: async () => (await api.get<ReviewsResponse>("/api/reviews", { params: { page } })).data,
    placeholderData: keepPreviousData,
  });

  const reviews = data?.reviews || [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-gold text-white shadow-sm">
            <Star className="h-5 w-5 fill-current" />
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-plum-800 dark:text-cream-50">
              {data ? data.avgRating.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-plum-400 dark:text-cream-100/50">
              {data ? `${data.count} verified review${data.count === 1 ? "" : "s"}` : "Loading..."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
          {reviews.length ? (
            reviews.map((r) => (
              <div key={r.id} className="flex flex-col gap-1 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-plum-700 dark:text-cream-50">{r.clientName}</span>
                  <StarRow rating={r.rating} />
                </div>
                {r.comment && <p className="text-plum-500 dark:text-cream-100/70">{r.comment}</p>}
                <p className="text-xs text-plum-300 dark:text-cream-100/40">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-plum-300 dark:text-cream-100/40">No reviews yet.</p>
          )}
          {data && (
            <div className="pt-2">
              <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
