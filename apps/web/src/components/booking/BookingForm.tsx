import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Clock, UserCircle } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { useToast } from "@/components/ui/toast";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { clientLogout } from "@/store/clientAuthSlice";
import { formatCurrency, cn } from "@/lib/utils";
import { generateTimeSlots, toLocalDateStr } from "@/lib/timeSlots";
import { CategoryType, Service, Staff } from "@/types";

interface Props {
  slug: string;
  services: Service[];
  staff: Staff[];
}

const SELECT_CLASS =
  "h-10 rounded-lg border border-plum-100 bg-white/90 px-2.5 text-sm shadow-sm dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50 disabled:opacity-50";

export function BookingForm({ slug, services, staff }: Props) {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const client = useAppSelector((s) => s.clientAuth.client)!;
  const [category, setCategory] = useState<CategoryType>("LADIES");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [clientName, setClientName] = useState(client.name);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const today = toLocalDateStr(new Date());
  const timeSlots = useMemo(() => generateTimeSlots(date), [date]);

  useEffect(() => {
    if (time && !timeSlots.includes(time)) setTime("");
  }, [timeSlots, time]);

  const categoryServices = services.filter((s) => s.category === category);
  const selectedTotal = services
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + Number(s.price), 0);

  const book = useMutation({
    mutationFn: async () =>
      clientApi.post(`/api/appointments/public/${slug}`, {
        clientName,
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
      <div className="glass-panel flex flex-col items-center gap-2 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="font-display text-xl font-semibold text-plum-800 dark:text-cream-50">Booking request sent!</p>
        <p className="text-sm text-plum-400 dark:text-cream-100/60">
          Reference: <span className="font-mono text-brand-600 dark:text-brand-300">{confirmedId}</span>
        </p>
        <p className="mt-1 max-w-xs text-xs text-plum-300 dark:text-cream-100/40">
          Keep this reference — you'll need it to leave a verified review after your visit.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-plum-400 dark:text-cream-100/50">
        <span>
          Booking as <span className="font-semibold text-plum-600 dark:text-cream-100/80">{client.phone}</span>
        </span>
        <div className="flex items-center gap-3">
          <Link to="/account" className="flex items-center gap-1 font-medium text-brand-500 hover:underline">
            <UserCircle className="h-3.5 w-3.5" /> My Account
          </Link>
          <button onClick={() => dispatch(clientLogout())} className="font-medium text-brand-500 hover:underline">
            Not you? Log out
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(["LADIES", "GENTS", "KIDS"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full transition-transform",
              category === c ? "scale-105 ring-2 ring-brand-400 ring-offset-2 ring-offset-transparent" : "opacity-60"
            )}
          >
            <CategoryBadge category={c} />
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {categoryServices.length ? (
          categoryServices.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleService(s.id)}
              className={cn(
                "rounded-full border-2 px-3.5 py-1.5 text-xs font-medium transition-all",
                selectedServiceIds.includes(s.id)
                  ? "border-transparent bg-gradient-brand text-white shadow-glow"
                  : "border-plum-100 text-plum-500 hover:border-brand-300 dark:border-white/10 dark:text-cream-100/70"
              )}
            >
              {s.name} · {formatCurrency(Number(s.price))}
            </button>
          ))
        ) : (
          <p className="text-xs text-plum-300 dark:text-cream-100/40">No services listed in this category yet.</p>
        )}
      </div>

      {selectedServiceIds.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm dark:bg-white/5">
          <span className="text-plum-500 dark:text-cream-100/70">
            {selectedServiceIds.length} service{selectedServiceIds.length > 1 ? "s" : ""} selected
          </span>
          <span className="font-semibold text-brand-600 dark:text-brand-300">{formatCurrency(selectedTotal)}</span>
        </div>
      )}

      {staff.length > 0 && (
        <select className={SELECT_CLASS} value={staffId} onChange={(e) => setStaffId(e.target.value)}>
          <option value="">Any available stylist</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.role})
            </option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
        <select
          className={SELECT_CLASS}
          value={time}
          disabled={!date}
          onChange={(e) => setTime(e.target.value)}
        >
          <option value="">{date ? "Select a time" : "Pick a date first"}</option>
          {timeSlots.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </div>

      <Input placeholder="Your name" value={clientName} onChange={(e) => setClientName(e.target.value)} />

      <Button
        size="lg"
        disabled={!clientName || !date || !time || selectedServiceIds.length === 0 || book.isPending}
        onClick={() => book.mutate()}
      >
        <Clock className="h-4 w-4" /> Book Appointment
      </Button>
    </div>
  );
}
