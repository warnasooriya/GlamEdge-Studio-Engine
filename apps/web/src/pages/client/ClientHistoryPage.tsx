import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { clientApi } from "@/lib/clientApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { Pagination } from "@/components/shared/Pagination";
import { STATUS_VARIANT } from "@/components/appointments/AppointmentRow";
import { ClientAppointment } from "@/types";

interface HistoryResponse {
  appointments: ClientAppointment[];
  page: number;
  totalPages: number;
}

export default function ClientHistoryPage() {
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["client", "appointments", page],
    queryFn: async () =>
      (await clientApi.get<HistoryResponse>("/api/appointments/me", { params: { page } })).data,
    placeholderData: keepPreviousData,
  });

  const appointments = data?.appointments || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking History</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
        {appointments.length ? (
          appointments.map((appt) => (
            <div key={appt.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-brand text-white shadow-sm">
                  {appt.tenant.logoUrl ? (
                    <img src={appt.tenant.logoUrl} alt={appt.tenant.salonName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold">{appt.tenant.salonName[0]}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-plum-700 dark:text-cream-50">{appt.tenant.salonName}</span>
                    <CategoryBadge category={appt.category} />
                    <Badge variant={STATUS_VARIANT[appt.status]}>{appt.status}</Badge>
                  </div>
                  <p className="text-xs text-plum-400 dark:text-cream-100/50">
                    {new Date(appt.bookingTime).toLocaleString()} •{" "}
                    {appt.services.map((s) => s.service.name).join(", ")}
                  </p>
                </div>
              </div>
              <a
                href={`/salon/${appt.tenant.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-brand-500 hover:underline"
              >
                View salon
              </a>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-plum-300 dark:text-cream-100/40">
            No bookings yet — go make your first appointment!
          </p>
        )}
        {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}
      </CardContent>
    </Card>
  );
}
