import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  value: string; // "yyyy-MM-dd" or ""
  onChange: (date: string) => void;
  workingDays: number[];
}

// Custom calendar picker instead of a native <input type="date"> — native date
// inputs render wildly differently (and sometimes fail to open at all, which is
// the bug this replaces) across Chrome/Safari/Firefox/mobile browsers. This
// renders identically everywhere since it's plain React, not a browser widget,
// and reuses the same Radix Dialog already used for modals elsewhere in the app.
export function BookingDatePicker({ value, onChange, workingDays }: Props) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;
  const [month, setMonth] = useState(() => selectedDate ?? new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const todayStart = startOfDay(new Date());

  function isDisabled(day: Date): boolean {
    return isBefore(day, todayStart) || !workingDays.includes(day.getDay());
  }

  function handleSelect(day: Date) {
    if (isDisabled(day)) return;
    onChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setMonth(selectedDate ?? new Date());
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-11 w-full items-center gap-2 rounded-lg border border-plum-100 bg-white/90 px-3.5 text-left text-sm shadow-sm hover:border-brand-300 dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50",
            !value && "text-plum-300 dark:text-cream-100/40"
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-brand-500" />
          {selectedDate ? format(selectedDate, "EEE, MMM d, yyyy") : "Pick a date"}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogTitle className="mb-3 font-display text-plum-800 dark:text-cream-50">Choose a date</DialogTitle>

        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-plum-500 hover:bg-brand-50 dark:text-cream-100/70 dark:hover:bg-white/5"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-display text-sm font-semibold text-plum-800 dark:text-cream-50">
            {format(month, "MMMM yyyy")}
          </span>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-plum-500 hover:bg-brand-50 dark:text-cream-100/70 dark:hover:bg-white/5"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium text-plum-400 dark:text-cream-100/50">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const disabled = isDisabled(day);
            const selected = selectedDate && isSameDay(day, selectedDate);
            const inMonth = isSameMonth(day, month);
            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(day)}
                className={cn(
                  "flex h-9 items-center justify-center rounded-lg text-sm transition-colors",
                  selected
                    ? "bg-gradient-brand text-white shadow-glow"
                    : disabled
                      ? "cursor-not-allowed text-plum-200 dark:text-cream-100/15"
                      : "text-plum-700 hover:bg-brand-50 dark:text-cream-50 dark:hover:bg-white/5",
                  !inMonth && !selected && !disabled && "text-plum-300 dark:text-cream-100/30",
                  isToday(day) && !selected && "ring-1 ring-inset ring-brand-300"
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
