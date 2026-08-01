import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { useToast } from "@/components/ui/toast";
import { Appointment, AppointmentStatus } from "@/types";

const STATUS_VARIANT: Record<AppointmentStatus, "outline" | "navy" | "success" | "default"> = {
  PENDING: "outline",
  CONFIRMED: "navy",
  COMPLETED: "success",
  CANCELLED: "default",
};

const NEXT_STATUS: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "COMPLETED",
};

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => (await api.get<{ appointments: Appointment[] }>("/api/appointments")).data,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["appointments"] });
    socket.on("appointment:created", invalidate);
    socket.on("appointment:updated", invalidate);
    return () => {
      socket.off("appointment:created", invalidate);
      socket.off("appointment:updated", invalidate);
    };
  }, [queryClient]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.patch(`/api/appointments/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to update", "error"),
  });

  const [filter, setFilter] = useState<AppointmentStatus | "ALL">("ALL");
  const appointments = (data?.appointments || []).filter(
    (a) => filter === "ALL" || a.status === filter
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {(["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const).map((s) => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
            {s}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Availability Grid</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
          {appointments.length ? (
            appointments.map((appt) => (
              <div key={appt.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{appt.clientName}</span>
                    <CategoryBadge category={appt.category} />
                    <Badge variant={STATUS_VARIANT[appt.status]}>{appt.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(appt.bookingTime).toLocaleString()} • {appt.staff?.name || "Unassigned"} •{" "}
                    {appt.services.map((s) => s.service.name).join(", ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  {NEXT_STATUS[appt.status] && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus.mutate({ id: appt.id, status: NEXT_STATUS[appt.status]! })}
                    >
                      Mark {NEXT_STATUS[appt.status]}
                    </Button>
                  )}
                  {appt.status !== "CANCELLED" && appt.status !== "COMPLETED" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatus.mutate({ id: appt.id, status: "CANCELLED" })}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-slate-400">No bookings for this filter.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
