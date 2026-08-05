import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { XCircle, CalendarX, PercentCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/Pagination";
import { StatTile } from "@/components/shared/StatTile";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { formatCurrency } from "@/lib/utils";
import { Appointment } from "@/types";

interface CancellationReportResponse {
  totals: { cancelledCount: number; totalBookings: number; cancellationRate: number; lostRevenue: number };
  appointments: Appointment[];
  page: number;
  totalPages: number;
}

export function CancellationReport({ from, to }: { from: string; to: string }) {
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["reports", "cancellations", from, to, page],
    queryFn: async () =>
      (await api.get<CancellationReportResponse>("/api/reports/cancellations", { params: { from, to, page } })).data,
    placeholderData: keepPreviousData,
  });

  const appointments = data?.appointments || [];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatTile label="Cancelled Bookings" value={data ? String(data.totals.cancelledCount) : "—"} icon={XCircle} tone="rose" />
        <StatTile
          label="Cancellation Rate"
          value={data ? `${data.totals.cancellationRate.toFixed(1)}%` : "—"}
          icon={PercentCircle}
          tone="gold"
        />
        <StatTile label="Lost Revenue" value={data ? formatCurrency(data.totals.lostRevenue) : "—"} icon={CalendarX} tone="brand" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cancelled Appointments</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
          {appointments.length ? (
            appointments.map((appt) => (
              <div key={appt.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-plum-700 dark:text-cream-50">{appt.clientName}</span>
                    <CategoryBadge category={appt.category} />
                    <Badge variant="default">CANCELLED</Badge>
                  </div>
                  <p className="text-xs text-plum-400 dark:text-cream-100/50">
                    {new Date(appt.bookingTime).toLocaleString()} • {appt.staff?.name || "Unassigned"} •{" "}
                    {appt.services.map((s) => s.service.name).join(", ")}
                  </p>
                </div>
                <span className="font-semibold text-plum-600 dark:text-cream-100/80">
                  {formatCurrency(appt.services.reduce((sum, s) => sum + Number(s.price), 0))}
                </span>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-plum-300 dark:text-cream-100/40">
              No cancelled bookings in this period.
            </p>
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
