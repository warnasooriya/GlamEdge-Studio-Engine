import { useMemo } from "react";
import { format, isToday } from "date-fns";
import { Appointment, AppointmentStatus } from "@/types";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { cn } from "@/lib/utils";

const HOUR_HEIGHT = 64; // px per hour
const MIN_BLOCK_HEIGHT = 30; // px — keeps very short bookings tappable/readable
const DEFAULT_DURATION_MIN = 30; // fallback if a booking somehow has no services

const STATUS_BLOCK_CLASS: Record<AppointmentStatus, string> = {
  PENDING: "border-plum-300 bg-plum-50 dark:border-cream-100/30 dark:bg-white/5",
  CONFIRMED: "border-plum-600 bg-plum-100 dark:border-plum-300 dark:bg-plum-700/40",
  COMPLETED: "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
  CANCELLED: "border-plum-100 bg-plum-50/60 opacity-60 dark:border-white/10 dark:bg-white/5",
};

interface PositionedAppointment {
  appt: Appointment;
  top: number;
  height: number;
  column: number;
  columns: number;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function apptStartMinutes(appt: Appointment): number {
  const d = new Date(appt.bookingTime);
  return d.getHours() * 60 + d.getMinutes();
}

function apptDurationMinutes(appt: Appointment): number {
  const total = appt.services.reduce((sum, s) => sum + (s.service?.durationMin || 0), 0);
  return total > 0 ? total : DEFAULT_DURATION_MIN;
}

// Standard calendar overlap layout: group bookings that overlap in time into
// clusters, then greedily assign each a column so overlapping bookings sit
// side-by-side instead of stacking unreadably on top of each other.
function layoutAppointments(appointments: Appointment[], dayStartMin: number): PositionedAppointment[] {
  const sorted = [...appointments].sort((a, b) => apptStartMinutes(a) - apptStartMinutes(b));

  const clusters: Appointment[][] = [];
  let clusterEnd = -1;
  for (const appt of sorted) {
    const start = apptStartMinutes(appt);
    if (clusters.length === 0 || start >= clusterEnd) {
      clusters.push([appt]);
      clusterEnd = start + apptDurationMinutes(appt);
    } else {
      clusters[clusters.length - 1].push(appt);
      clusterEnd = Math.max(clusterEnd, start + apptDurationMinutes(appt));
    }
  }

  const positioned: PositionedAppointment[] = [];
  for (const cluster of clusters) {
    const columnEnds: number[] = [];
    const assigned: { appt: Appointment; column: number }[] = [];
    for (const appt of cluster) {
      const start = apptStartMinutes(appt);
      const end = start + apptDurationMinutes(appt);
      let column = columnEnds.findIndex((endMin) => endMin <= start);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(end);
      } else {
        columnEnds[column] = end;
      }
      assigned.push({ appt, column });
    }
    const columns = columnEnds.length;
    for (const { appt, column } of assigned) {
      const start = apptStartMinutes(appt);
      const duration = apptDurationMinutes(appt);
      positioned.push({
        appt,
        top: ((start - dayStartMin) / 60) * HOUR_HEIGHT,
        height: Math.max((duration / 60) * HOUR_HEIGHT - 2, MIN_BLOCK_HEIGHT),
        column,
        columns,
      });
    }
  }
  return positioned;
}

export function DaySchedule({
  date,
  appointments,
  onOpenDetails,
  openTime = "09:00",
  closeTime = "20:00",
}: {
  date: Date;
  appointments: Appointment[];
  onOpenDetails: (id: string) => void;
  openTime?: string;
  closeTime?: string;
}) {
  const dayStartMin = toMinutes(openTime);
  const dayEndMin = toMinutes(closeTime);
  const hours = useMemo(() => {
    const list: number[] = [];
    for (let m = dayStartMin; m < dayEndMin; m += 60) list.push(m);
    return list;
  }, [dayStartMin, dayEndMin]);
  const gridHeight = ((dayEndMin - dayStartMin) / 60) * HOUR_HEIGHT;

  const positioned = useMemo(
    () => layoutAppointments(appointments, dayStartMin),
    [appointments, dayStartMin]
  );

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowLine = isToday(date) && nowMinutes >= dayStartMin && nowMinutes <= dayEndMin;
  const nowTop = ((nowMinutes - dayStartMin) / 60) * HOUR_HEIGHT;

  return (
    <div className="flex overflow-x-auto">
      <div className="flex shrink-0 flex-col text-right text-xs text-plum-300 dark:text-cream-100/40" style={{ width: 56 }}>
        {hours.map((m) => (
          <div key={m} style={{ height: HOUR_HEIGHT }} className="-translate-y-2 pr-2">
            {format(new Date(0, 0, 0, Math.floor(m / 60), m % 60), "h a")}
          </div>
        ))}
      </div>

      <div className="relative min-w-[280px] flex-1 border-l border-plum-100 dark:border-white/10" style={{ height: gridHeight }}>
        {hours.map((m, i) => (
          <div
            key={m}
            className="absolute inset-x-0 border-t border-plum-100 dark:border-white/10"
            style={{ top: i * HOUR_HEIGHT }}
          />
        ))}

        {showNowLine && (
          <div className="absolute inset-x-0 z-20 flex items-center gap-1" style={{ top: nowTop }}>
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            <span className="h-px flex-1 bg-brand-500" />
          </div>
        )}

        {positioned.length === 0 && (
          <p className="absolute inset-x-0 top-8 text-center text-sm text-plum-300 dark:text-cream-100/40">
            No bookings on this day.
          </p>
        )}

        {positioned.map(({ appt, top, height, column, columns }) => (
          <button
            key={appt.id}
            onClick={() => onOpenDetails(appt.id)}
            className={cn(
              "absolute z-10 flex flex-col overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left text-xs shadow-sm transition-shadow hover:shadow-md",
              STATUS_BLOCK_CLASS[appt.status]
            )}
            style={{
              top,
              height,
              left: `calc(${(column / columns) * 100}% + 2px)`,
              width: `calc(${(1 / columns) * 100}% - 4px)`,
            }}
          >
            <span className="truncate font-semibold text-plum-800 dark:text-cream-50">
              {format(new Date(appt.bookingTime), "h:mm a")} · {appt.clientName}
            </span>
            {height > 40 && (
              <span className="flex items-center gap-1 truncate text-plum-500 dark:text-cream-100/60">
                <CategoryBadge category={appt.category} />
                {appt.staff?.name && <span className="truncate">{appt.staff.name}</span>}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
