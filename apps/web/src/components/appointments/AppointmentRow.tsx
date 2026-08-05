import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { Appointment, AppointmentStatus } from "@/types";

export const STATUS_VARIANT: Record<AppointmentStatus, "outline" | "navy" | "success" | "default"> = {
  PENDING: "outline",
  CONFIRMED: "navy",
  COMPLETED: "success",
  CANCELLED: "default",
};

export const NEXT_STATUS: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "COMPLETED",
};

export function AppointmentRow({
  appointment,
  onUpdateStatus,
  onOpenDetails,
}: {
  appointment: Appointment;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onOpenDetails?: (id: string) => void;
}) {
  const appt = appointment;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-plum-700 dark:text-cream-50">{appt.clientName}</span>
          <CategoryBadge category={appt.category} />
          <Badge variant={STATUS_VARIANT[appt.status]}>{appt.status}</Badge>
          {appt.rescheduleStatus === "PROPOSED" && <Badge variant="outline">Reschedule pending</Badge>}
        </div>
        <p className="text-xs text-plum-400 dark:text-cream-100/50">
          {new Date(appt.bookingTime).toLocaleString()} • {appt.staff?.name || "Unassigned"} •{" "}
          {appt.services.map((s) => s.service.name).join(", ")}
        </p>
      </div>
      <div className="flex gap-2">
        {onOpenDetails && (
          <Button size="sm" variant="outline" onClick={() => onOpenDetails(appt.id)}>
            Details
          </Button>
        )}
        {NEXT_STATUS[appt.status] && (
          <Button size="sm" onClick={() => onUpdateStatus(appt.id, NEXT_STATUS[appt.status]!)}>
            Mark {NEXT_STATUS[appt.status]}
          </Button>
        )}
        {appt.status !== "CANCELLED" && appt.status !== "COMPLETED" && (
          <Button size="sm" variant="destructive" onClick={() => onUpdateStatus(appt.id, "CANCELLED")}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
