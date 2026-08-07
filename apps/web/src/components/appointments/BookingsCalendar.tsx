import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DaySchedule } from "./DaySchedule";
import { useAppSelector } from "@/hooks/redux";
import { Appointment, AppointmentStatus } from "@/types";
import { cn } from "@/lib/utils";

const DOT_COLOR: Record<AppointmentStatus, string> = {
  PENDING: "bg-plum-300 dark:bg-cream-100/40",
  CONFIRMED: "bg-plum-600",
  COMPLETED: "bg-emerald-500",
  CANCELLED: "bg-plum-100 dark:bg-cream-100/15",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BookingsCalendar({
  status,
  onOpenDetails,
}: {
  status: AppointmentStatus | "ALL";
  onOpenDetails: (id: string) => void;
}) {
  const tenant = useAppSelector((s) => s.auth.tenant);
  const [mode, setMode] = useState<"month" | "day">("day");
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const rangeStart = mode === "month" ? days[0] : startOfDay(selectedDate);
  const rangeEnd = mode === "month" ? days[days.length - 1] : endOfDay(selectedDate);

  const { data } = useQuery({
    queryKey: [
      "appointments",
      "calendar",
      { from: rangeStart.toISOString(), to: rangeEnd.toISOString(), status },
    ],
    queryFn: async () =>
      (
        await api.get<{ appointments: Appointment[] }>("/api/appointments", {
          params: {
            from: rangeStart.toISOString(),
            to: rangeEnd.toISOString(),
            status: status === "ALL" ? undefined : status,
            pageSize: 200,
          },
        })
      ).data,
  });

  const appointments = data?.appointments || [];

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appt of appointments) {
      const key = format(new Date(appt.bookingTime), "yyyy-MM-dd");
      const list = map.get(key) || [];
      list.push(appt);
      map.set(key, list);
    }
    return map;
  }, [appointments]);

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedAppointments = (appointmentsByDay.get(selectedKey) || []).sort(
    (a, b) => new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime()
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-plum-800 dark:text-cream-50">
          {mode === "month" ? format(month, "MMMM yyyy") : format(selectedDate, "EEEE, MMMM d, yyyy")}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {mode === "month" ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setMonth((m) => subMonths(m, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMonth(new Date())}>
                  Today
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMonth((m) => addMonths(m, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setSelectedDate((d) => subDays(d, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedDate(new Date())}>
                  Today
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedDate((d) => addDays(d, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-1 rounded-full border border-plum-100 p-1 dark:border-white/10">
            <Button size="sm" variant={mode === "month" ? "default" : "ghost"} onClick={() => setMode("month")}>
              Month
            </Button>
            <Button size="sm" variant={mode === "day" ? "default" : "ghost"} onClick={() => setMode("day")}>
              Day
            </Button>
          </div>
        </div>
      </div>

      {mode === "month" && (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-plum-400 dark:text-cream-100/50">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayAppointments = appointmentsByDay.get(key) || [];
              const inMonth = isSameMonth(day, month);
              const selected = isSameDay(day, selectedDate);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex min-h-16 flex-col items-center gap-1 rounded-lg border p-1.5 text-sm transition-colors",
                    selected
                      ? "border-brand-400 bg-gradient-brand text-white shadow-glow"
                      : "border-transparent hover:bg-brand-50 dark:hover:bg-white/5",
                    !inMonth && !selected && "text-plum-300 dark:text-cream-100/30"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      isToday(day) && !selected && "bg-brand-100 font-semibold text-brand-600 dark:bg-brand-500/20"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="flex flex-wrap justify-center gap-0.5">
                    {dayAppointments.slice(0, 4).map((appt) => (
                      <span key={appt.id} className={cn("h-1.5 w-1.5 rounded-full", DOT_COLOR[appt.status])} />
                    ))}
                    {dayAppointments.length > 4 && (
                      <span className="text-[10px] leading-none opacity-70">+{dayAppointments.length - 4}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className={cn(mode === "month" && "border-t border-plum-100 pt-3 dark:border-white/10")}>
        {mode === "month" && (
          <p className="mb-2 text-sm font-medium text-plum-700 dark:text-cream-50">
            {format(selectedDate, "EEEE, MMMM d")}
          </p>
        )}
        <DaySchedule
          date={selectedDate}
          appointments={selectedAppointments}
          onOpenDetails={onOpenDetails}
          openTime={tenant?.openTime || undefined}
          closeTime={tenant?.closeTime || undefined}
        />
      </div>
    </div>
  );
}
