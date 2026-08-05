import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, CalendarClock, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { useToast } from "@/components/ui/toast";
import { STATUS_VARIANT, NEXT_STATUS } from "@/components/appointments/AppointmentRow";
import { BookingChatThread } from "@/components/appointments/BookingChatThread";
import { cn } from "@/lib/utils";
import { Appointment, AppointmentStatus, OwnerNotification, Staff } from "@/types";

const RESCHEDULE_HISTORY_ICON = {
  RESCHEDULE_ACCEPTED: CheckCircle2,
  RESCHEDULE_DECLINED: XCircle,
} as const;

interface Props {
  appointmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingActionModal({ appointmentId, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [proposedTime, setProposedTime] = useState("");
  const [proposedStaffId, setProposedStaffId] = useState("");

  const { data } = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: async () => (await api.get<{ appointment: Appointment & { id: string } }>(`/api/appointments/${appointmentId}`)).data,
    enabled: open,
  });

  const { data: staffData } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => (await api.get<{ staff: Staff[] }>("/api/staff")).data,
    enabled: open,
  });

  const { data: historyData } = useQuery({
    queryKey: ["owner-notifications", "appointment", appointmentId],
    queryFn: async () =>
      (
        await api.get<{ notifications: OwnerNotification[] }>("/api/owner-notifications", {
          params: { appointmentId, pageSize: 10 },
        })
      ).data,
    enabled: open,
  });

  const appointment = data?.appointment;
  const rescheduleHistory = (historyData?.notifications || []).filter(
    (n) => n.type === "RESCHEDULE_ACCEPTED" || n.type === "RESCHEDULE_DECLINED"
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
    queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId] });
  };

  const updateStatus = useMutation({
    mutationFn: async (status: AppointmentStatus) => api.patch(`/api/appointments/${appointmentId}/status`, { status }),
    onSuccess: invalidate,
    onError: (err: any) => toast(err.response?.data?.error || "Failed to update", "error"),
  });

  const proposeReschedule = useMutation({
    mutationFn: async () =>
      api.patch(`/api/appointments/${appointmentId}/reschedule`, {
        proposedBookingTime: proposedTime ? new Date(proposedTime).toISOString() : undefined,
        proposedStaffId: proposedStaffId || undefined,
      }),
    onSuccess: () => {
      toast("Reschedule proposal sent to customer", "success");
      setProposedTime("");
      setProposedStaffId("");
      invalidate();
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to propose reschedule", "error"),
  });

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-2xl bg-cream-50 p-6 shadow-lg dark:bg-plum-900">
          <DialogPrimitive.Title className="font-display text-lg font-semibold text-plum-800 dark:text-cream-50">
            Booking details
          </DialogPrimitive.Title>
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm text-plum-400 opacity-70 hover:opacity-100 dark:text-cream-100/60">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>

          {!appointment ? (
            <p className="text-sm text-plum-400 dark:text-cream-100/50">Loading...</p>
          ) : (
            <>
              <div className="flex flex-col gap-1 rounded-lg border border-plum-100 p-3 text-sm dark:border-white/10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-plum-700 dark:text-cream-50">{appointment.clientName}</span>
                  <CategoryBadge category={appointment.category} />
                  <Badge variant={STATUS_VARIANT[appointment.status]}>{appointment.status}</Badge>
                  {appointment.rescheduleStatus === "PROPOSED" && <Badge variant="outline">Reschedule pending</Badge>}
                </div>
                <p className="text-xs text-plum-400 dark:text-cream-100/50">
                  {new Date(appointment.bookingTime).toLocaleString()} • {appointment.staff?.name || "Unassigned"} •{" "}
                  {appointment.services.map((s) => s.service.name).join(", ")}
                </p>
                <p className="text-xs text-plum-400 dark:text-cream-100/50">{appointment.clientPhone}</p>
              </div>

              <div className="flex gap-2">
                {NEXT_STATUS[appointment.status] && (
                  <Button size="sm" onClick={() => updateStatus.mutate(NEXT_STATUS[appointment.status]!)} disabled={updateStatus.isPending}>
                    Mark {NEXT_STATUS[appointment.status]}
                  </Button>
                )}
                {appointment.status !== "CANCELLED" && appointment.status !== "COMPLETED" && (
                  <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate("CANCELLED")} disabled={updateStatus.isPending}>
                    Cancel
                  </Button>
                )}
              </div>

              {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && (
                <div className="flex flex-col gap-2 rounded-lg border border-plum-100 p-3 dark:border-white/10">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-plum-700 dark:text-cream-50">
                    <CalendarClock className="h-4 w-4" /> Propose a different time or staff
                  </p>
                  {appointment.rescheduleStatus === "PROPOSED" ? (
                    <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-plum-600 dark:bg-white/5 dark:text-cream-100/70">
                      <Clock3 className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Waiting for customer to respond to{" "}
                        {appointment.proposedBookingTime && new Date(appointment.proposedBookingTime).toLocaleString()}
                        {appointment.proposedStaff && ` with ${appointment.proposedStaff.name}`}. You can send a new
                        proposal once they reply.
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="datetime-local"
                          value={proposedTime}
                          onChange={(e) => setProposedTime(e.target.value)}
                          className="h-9 rounded-lg border border-plum-100 bg-white/90 px-2 text-xs dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50"
                        />
                        <select
                          value={proposedStaffId}
                          onChange={(e) => setProposedStaffId(e.target.value)}
                          className="h-9 rounded-lg border border-plum-100 bg-white/90 px-2 text-xs dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50"
                        >
                          <option value="">Keep current staff</option>
                          {staffData?.staff.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={(!proposedTime && !proposedStaffId) || proposeReschedule.isPending}
                        onClick={() => proposeReschedule.mutate()}
                        className="self-start"
                      >
                        Send proposal
                      </Button>
                    </>
                  )}

                  {rescheduleHistory.length > 0 && (
                    <div className="flex flex-col gap-1.5 border-t border-plum-100 pt-2 dark:border-white/10">
                      <p className="text-xs font-medium text-plum-500 dark:text-cream-100/60">Reschedule history</p>
                      {rescheduleHistory.map((n) => {
                        const Icon = RESCHEDULE_HISTORY_ICON[n.type as keyof typeof RESCHEDULE_HISTORY_ICON];
                        return (
                          <div key={n.id} className="flex items-start gap-2 text-xs text-plum-500 dark:text-cream-100/60">
                            <Icon
                              className={cn(
                                "mt-0.5 h-3.5 w-3.5 shrink-0",
                                n.type === "RESCHEDULE_ACCEPTED" ? "text-emerald-500" : "text-red-400"
                              )}
                            />
                            <span className="flex-1">
                              {n.message}{" "}
                              <span className="opacity-60">· {new Date(n.createdAt).toLocaleString()}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-plum-700 dark:text-cream-50">Messages</p>
                <BookingChatThread appointmentId={appointmentId} authType="owner" />
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
