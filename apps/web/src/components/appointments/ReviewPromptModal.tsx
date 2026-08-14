import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Star, X } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { ClientAppointment } from "@/types";

interface PendingReviewsResponse {
  appointments: ClientAppointment[];
}

// Persisted per-device so "Not Now" sticks across page reloads/navigation —
// without this, the modal would re-show the same dismissed booking on every
// visit to /account, since the pending-reviews list is otherwise unfiltered.
const DISMISSED_KEY = "glamedge_dismissed_review_prompts";

function loadDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function persistDismissedIds(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage can fail (private browsing, quota) — worst case the prompt
    // just reappears next visit, which is a harmless fallback.
  }
}

export function ReviewPromptModal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => loadDismissedIds());
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data } = useQuery({
    queryKey: ["client", "pending-reviews"],
    queryFn: async () =>
      (await clientApi.get<PendingReviewsResponse>("/api/appointments/me/pending-reviews")).data,
  });

  const pending = (data?.appointments || []).find((a) => !dismissedIds.has(a.id));

  const submit = useMutation({
    mutationFn: async () =>
      clientApi.post(`/api/appointments/${pending!.id}/review`, { rating, comment: comment || undefined }),
    onSuccess: () => {
      toast("Thanks for your review!", "success");
      setRating(5);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["client", "pending-reviews"] });
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to submit review", "error"),
  });

  function dismiss() {
    if (!pending) return;
    setDismissedIds((prev) => {
      const next = new Set(prev).add(pending.id);
      persistDismissedIds(next);
      return next;
    });
  }

  if (!pending) return null;

  return (
    <DialogPrimitive.Root open onOpenChange={(next) => !next && dismiss()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-2xl bg-cream-50 p-6 shadow-lg dark:bg-plum-900">
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm text-plum-400 opacity-70 hover:opacity-100 dark:text-cream-100/60">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>

          <DialogPrimitive.Title className="font-display text-lg font-semibold text-plum-800 dark:text-cream-50">
            How was your visit to {pending.tenant.salonName}?
          </DialogPrimitive.Title>
          <p className="text-xs text-plum-400 dark:text-cream-100/50">
            {new Date(pending.bookingTime).toLocaleDateString()} •{" "}
            {pending.services.map((s) => s.service.name).join(", ")}
          </p>

          <div className="flex justify-center gap-1 py-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}>
                <Star
                  className={`h-8 w-8 transition-colors ${
                    n <= rating ? "fill-amber-400 text-amber-400" : "text-plum-100 dark:text-white/15"
                  }`}
                />
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Tell us about your experience (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="flex gap-2">
            <Button className="flex-1" disabled={submit.isPending} onClick={() => submit.mutate()}>
              Submit review
            </Button>
            <Button variant="outline" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
