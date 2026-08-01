import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, cn } from "@/lib/utils";
import { CategoryType, Service, Staff } from "@/types";

interface Props {
  slug: string;
  services: Service[];
  staff: Staff[];
}

export function BookingForm({ slug, services, staff }: Props) {
  const { toast } = useToast();
  const [category, setCategory] = useState<CategoryType>("LADIES");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const categoryServices = services.filter((s) => s.category === category);

  const book = useMutation({
    mutationFn: async () =>
      api.post(`/api/appointments/public/${slug}`, {
        clientName,
        clientPhone,
        category,
        staffId: staffId || undefined,
        bookingTime: new Date(`${date}T${time}`).toISOString(),
        serviceIds: selectedServiceIds,
      }),
    onSuccess: (res) => {
      toast("Booking request sent!", "success");
      setConfirmedId(res.data.appointment.id);
    },
    onError: (err: any) => toast(err.response?.data?.error || "Booking failed", "error"),
  });

  function toggleService(id: string) {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  if (confirmedId) {
    return (
      <div className="glass-panel p-6 text-center">
        <p className="text-lg font-semibold">Booking request sent!</p>
        <p className="mt-1 text-sm text-slate-500">
          Reference: <span className="font-mono">{confirmedId}</span>
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Keep this reference — you'll need it to leave a verified review after your visit.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel flex flex-col gap-3 p-4">
      <div className="flex gap-2">
        {(["LADIES", "GENTS", "KIDS"] as const).map((c) => (
          <button key={c} onClick={() => setCategory(c)}>
            <CategoryBadge category={c} />
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {categoryServices.map((s) => (
          <button
            key={s.id}
            onClick={() => toggleService(s.id)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs",
              selectedServiceIds.includes(s.id)
                ? "border-brand-pink bg-brand-pink/10 text-brand-pink"
                : "border-slate-300 dark:border-slate-700"
            )}
          >
            {s.name} · {formatCurrency(Number(s.price))}
          </button>
        ))}
      </div>

      {staff.length > 0 && (
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
        >
          <option value="">Any available stylist</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.role})
            </option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>

      <Input placeholder="Your name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
      <Input placeholder="Your phone (07XXXXXXXX)" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />

      <Button
        disabled={
          !clientName || !clientPhone || !date || !time || selectedServiceIds.length === 0 || book.isPending
        }
        onClick={() => book.mutate()}
      >
        Book Appointment
      </Button>
    </div>
  );
}
