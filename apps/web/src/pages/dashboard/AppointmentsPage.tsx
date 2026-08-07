import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { List, CalendarDays, X } from "lucide-react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/Pagination";
import { useToast } from "@/components/ui/toast";
import { AppointmentRow } from "@/components/appointments/AppointmentRow";
import { BookingsCalendar } from "@/components/appointments/BookingsCalendar";
import { BookingActionModal } from "@/components/appointments/BookingActionModal";
import { Appointment, AppointmentStatus } from "@/types";

interface AppointmentsResponse {
  appointments: Appointment[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [view, setView] = useState<"list" | "calendar">("calendar");
  const [filter, setFilter] = useState<AppointmentStatus | "ALL">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId) {
      setDetailsId(openId);
      const next = new URLSearchParams(searchParams);
      next.delete("open");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const from = dateFrom ? `${dateFrom}T00:00:00` : undefined;
  const to = dateTo ? `${dateTo}T23:59:59` : undefined;

  const { data } = useQuery({
    queryKey: ["appointments", "list", { page, status: filter, from, to, search }],
    queryFn: async () =>
      (
        await api.get<AppointmentsResponse>("/api/appointments", {
          params: { page, pageSize: 20, status: filter === "ALL" ? undefined : filter, from, to, search: search || undefined },
        })
      ).data,
    placeholderData: keepPreviousData,
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

  const handleUpdateStatus = (id: string, status: AppointmentStatus) => updateStatus.mutate({ id, status });

  const handleFilterChange = (s: AppointmentStatus | "ALL") => {
    setFilter(s);
    setPage(1);
  };

  const handleDateFromChange = (v: string) => {
    setDateFrom(v);
    setPage(1);
  };

  const handleDateToChange = (v: string) => {
    setDateTo(v);
    setPage(1);
  };

  const hasActiveFilters = dateFrom || dateTo || searchInput;

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const appointments = data?.appointments || [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filter === s ? "default" : "outline"}
              onClick={() => handleFilterChange(s)}
            >
              {s}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>
            <List className="h-4 w-4" /> List
          </Button>
          <Button
            size="sm"
            variant={view === "calendar" ? "default" : "outline"}
            onClick={() => setView("calendar")}
          >
            <CalendarDays className="h-4 w-4" /> Calendar
          </Button>
        </div>
      </div>

      {view === "list" && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">From</label>
            <Input
              type="date"
              className="h-9 w-40"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">To</label>
            <Input
              type="date"
              className="h-9 w-40"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">Customer</label>
            <Input
              placeholder="Name or phone"
              className="h-9 w-48"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          {hasActiveFilters && (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4" /> Clear filters
            </Button>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{view === "list" ? "Live Availability Grid" : "Bookings Calendar"}</CardTitle>
        </CardHeader>
        <CardContent>
          {view === "list" ? (
            <>
              <div className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
                {appointments.length ? (
                  appointments.map((appt) => (
                    <AppointmentRow
                      key={appt.id}
                      appointment={appt}
                      onUpdateStatus={handleUpdateStatus}
                      onOpenDetails={setDetailsId}
                    />
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-plum-300 dark:text-cream-100/40">
                    No bookings for this filter.
                  </p>
                )}
              </div>
              {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}
            </>
          ) : (
            <BookingsCalendar status={filter} onOpenDetails={setDetailsId} />
          )}
        </CardContent>
      </Card>

      {detailsId && (
        <BookingActionModal appointmentId={detailsId} open={!!detailsId} onOpenChange={(next) => !next && setDetailsId(null)} />
      )}
    </div>
  );
}
