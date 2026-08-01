import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Phone, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { RatingStars } from "@/components/shared/RatingStars";
import { Pagination } from "@/components/shared/Pagination";
import { STATUS_VARIANT } from "@/components/appointments/AppointmentRow";
import { cn } from "@/lib/utils";
import { CustomerSummary, CustomerDetail } from "@/types";

interface CustomersResponse {
  clients: CustomerSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const AVATAR_TONES = [
  "bg-gradient-to-br from-brand-400 to-brand-600",
  "bg-gradient-to-br from-amber-400 to-amber-600",
  "bg-gradient-to-br from-plum-400 to-plum-600",
  "bg-gradient-to-br from-emerald-400 to-emerald-600",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function CustomersPage() {
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["clients", page],
    queryFn: async () => (await api.get<CustomersResponse>("/api/clients", { params: { page } })).data,
    placeholderData: keepPreviousData,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: detail } = useQuery({
    queryKey: ["client", selectedId],
    queryFn: async () => (await api.get<CustomerDetail>(`/api/clients/${selectedId}`)).data,
    enabled: !!selectedId,
  });

  const customers = data?.clients || [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
          {customers.length ? (
            customers.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-left text-sm hover:bg-brand-50/50 dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm",
                      AVATAR_TONES[i % AVATAR_TONES.length]
                    )}
                  >
                    {initials(c.name)}
                  </div>
                  <div>
                    <p className="font-medium text-plum-700 dark:text-cream-50">{c.name}</p>
                    <p className="flex items-center gap-1 text-xs text-plum-400 dark:text-cream-100/50">
                      <Phone className="h-3 w-3" /> {c.phone}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <RatingStars rating={c.avgRating} />
                  <p className="text-xs text-plum-400 dark:text-cream-100/50">
                    {c.visitCount} visit{c.visitCount === 1 ? "" : "s"} • last{" "}
                    {new Date(c.lastVisit).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-plum-300 dark:text-cream-100/40">
              No customers yet — they'll show up here after their first booking.
            </p>
          )}
          {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}
        </CardContent>
      </Card>

      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          {detail ? (
            <div className="flex flex-col gap-4">
              <div>
                <DialogTitle>{detail.client.name}</DialogTitle>
                <p className="flex items-center gap-1 text-xs text-plum-400 dark:text-cream-100/50">
                  <Phone className="h-3 w-3" /> {detail.client.phone}
                  <span className="mx-1">•</span>
                  <Calendar className="h-3 w-3" /> Customer since{" "}
                  {new Date(detail.client.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-plum-700 dark:text-cream-50">
                  Appointment history
                </h4>
                <div className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
                  {detail.appointments.length ? (
                    detail.appointments.map((appt) => (
                      <div key={appt.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <CategoryBadge category={appt.category} />
                            <Badge variant={STATUS_VARIANT[appt.status]}>{appt.status}</Badge>
                          </div>
                          <p className="text-xs text-plum-400 dark:text-cream-100/50">
                            {new Date(appt.bookingTime).toLocaleString()} • {appt.staff?.name || "Unassigned"} •{" "}
                            {appt.services.map((s) => s.service.name).join(", ")}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-3 text-center text-xs text-plum-300 dark:text-cream-100/40">No visits yet.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-plum-700 dark:text-cream-50">Ratings & reviews</h4>
                <div className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
                  {detail.reviews.length ? (
                    detail.reviews.map((r) => (
                      <div key={r.id} className="py-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <RatingStars rating={r.rating} />
                          <span className="text-xs text-plum-400 dark:text-cream-100/50">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {r.comment && (
                          <p className="mt-1 text-xs text-plum-500 dark:text-cream-100/70">{r.comment}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="py-3 text-center text-xs text-plum-300 dark:text-cream-100/40">
                      No reviews yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-plum-300 dark:text-cream-100/40">Loading...</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
