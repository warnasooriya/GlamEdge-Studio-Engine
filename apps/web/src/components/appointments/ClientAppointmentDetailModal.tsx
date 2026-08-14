import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, CalendarClock, Star } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { useToast } from "@/components/ui/toast";
import { STATUS_VARIANT } from "@/components/appointments/AppointmentRow";
import { BookingChatThread } from "@/components/appointments/BookingChatThread";
import { ClientAppointment } from "@/types";

interface Props {
  appointmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientAppointmentDetailModal({ appointmentId, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data } = useQuery({
    queryKey: ["client", "appointment", appointmentId],
    queryFn: async () =>
      (await clientApi.get<{ appointment: ClientAppointment }>(`/api/appointments/me/${appointmentId}`)).data,
    enabled: open,
  });

  const appointment = data?.appointment;

  const respond = useMutation({
    mutationFn: async (accept: boolean) =>
      clientApi.post(`/api/appointments/${appointmentId}/reschedule/respond`, { accept }),
    onSuccess: (_res, accept) => {
      toast(accept ? "Reschedule accepted" : "Reschedule declined", "success");
      queryClient.invalidateQueries({ queryKey: ["client", "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["client", "appointment", appointmentId] });
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to respond", "error"),
  });

  const submitReview = useMutation({
    mutationFn: async () =>
      clientApi.post(`/api/appointments/${appointmentId}/review`, { rating, comment: comment || undefined }),
    onSuccess: () => {
      toast("Thanks for your review!", "success");
      queryClient.invalidateQueries({ queryKey: ["client", "appointment", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["client", "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["client", "pending-reviews"] });
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to submit review", "error"),
  });

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-2xl bg-cream-50 p-6 shadow-lg dark:bg-plum-900">
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm text-plum-400 opacity-70 hover:opacity-100 dark:text-cream-100/60">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>

          {!appointment ? (
            <p className="text-sm text-plum-400 dark:text-cream-100/50">Loading...</p>
          ) : (
            <>
              <div className="flex items-center justify-between pr-6">
                <DialogPrimitive.Title className="font-display text-lg font-semibold text-plum-800 dark:text-cream-50">
                  {appointment.tenant.salonName}
                </DialogPrimitive.Title>
                <a
                  href={`/salon/${appointment.tenant.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-brand-500 hover:underline"
                >
                  View salon
                </a>
              </div>

              <div className="flex flex-col gap-1 rounded-lg border border-plum-100 p-3 text-sm dark:border-white/10">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={appointment.category} />
                  <Badge variant={STATUS_VARIANT[appointment.status]}>{appointment.status}</Badge>
                </div>
                <p className="text-xs text-plum-400 dark:text-cream-100/50">
                  {new Date(appointment.bookingTime).toLocaleString()} •{" "}
                  {appointment.services.map((s) => s.service.name).join(", ")}
                </p>
              </div>

              {appointment.rescheduleStatus === "PROPOSED" && (
                <div className="flex flex-col gap-2 rounded-lg border-2 border-brand-300 bg-brand-50 p-3 dark:bg-white/5">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-plum-700 dark:text-cream-50">
                    <CalendarClock className="h-4 w-4 text-brand-500" />
                    {appointment.tenant.salonName} proposed a new time
                  </p>
                  <p className="text-xs text-plum-500 dark:text-cream-100/70">
                    {appointment.proposedBookingTime && new Date(appointment.proposedBookingTime).toLocaleString()}
                    {appointment.proposedStaff && ` with ${appointment.proposedStaff.name}`}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => respond.mutate(true)} disabled={respond.isPending}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => respond.mutate(false)} disabled={respond.isPending}>
                      Decline
                    </Button>
                  </div>
                </div>
              )}

              {appointment.status === "COMPLETED" && (
                <div className="flex flex-col gap-2 rounded-lg border border-plum-100 p-3 dark:border-white/10">
                  <p className="text-sm font-medium text-plum-700 dark:text-cream-50">Your review</p>
                  {appointment.review ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`h-4 w-4 ${
                              n <= appointment.review!.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-plum-100 dark:text-white/15"
                            }`}
                          />
                        ))}
                      </div>
                      {appointment.review.comment && (
                        <p className="text-sm text-plum-600 dark:text-cream-100/80">{appointment.review.comment}</p>
                      )}
                    </div>
                  ) : appointment.isBilled ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => setRating(n)}>
                            <Star
                              className={`h-6 w-6 transition-colors ${
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
                      <Button
                        size="sm"
                        className="self-start"
                        disabled={submitReview.isPending}
                        onClick={() => submitReview.mutate()}
                      >
                        Submit review
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-plum-400 dark:text-cream-100/50">
                      Reviews open up once this visit has been billed.
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-plum-700 dark:text-cream-50">Messages</p>
                <BookingChatThread appointmentId={appointmentId} authType="client" />
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
