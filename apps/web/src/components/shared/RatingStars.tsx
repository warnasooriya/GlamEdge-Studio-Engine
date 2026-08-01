import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({ rating, size = "sm" }: { rating: number | null; size?: "sm" | "md" }) {
  const dimension = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  if (rating === null) {
    return <span className="text-xs text-plum-300 dark:text-cream-100/40">No ratings yet</span>;
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            dimension,
            n <= Math.round(rating) ? "fill-brand-500 text-brand-500" : "fill-transparent text-plum-200 dark:text-cream-100/20"
          )}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-plum-500 dark:text-cream-100/70">{rating.toFixed(1)}</span>
    </div>
  );
}
