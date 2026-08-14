import { useState } from "react";
import { Clock } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Props {
  value: string; // "HH:mm" or ""
  onChange: (time: string) => void;
  slots: string[];
  disabled?: boolean;
  placeholder: string;
}

function formatSlotLabel(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
}

// Custom time-slot grid instead of a native <select> — matches BookingDatePicker's
// approach so both fields look and behave identically across every browser.
export function BookingTimePicker({ value, onChange, slots, disabled, placeholder }: Props) {
  const [open, setOpen] = useState(false);

  function handleSelect(slot: string) {
    onChange(slot);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center gap-2 rounded-lg border border-plum-100 bg-white/90 px-3.5 text-left text-sm shadow-sm hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-plum-100 dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50",
            !value && "text-plum-300 dark:text-cream-100/40"
          )}
        >
          <Clock className="h-4 w-4 shrink-0 text-brand-500" />
          {value ? formatSlotLabel(value) : placeholder}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogTitle className="mb-3 font-display text-plum-800 dark:text-cream-50">Choose a time</DialogTitle>
        {slots.length ? (
          <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => handleSelect(slot)}
                className={cn(
                  "rounded-lg border-2 px-2 py-2 text-sm font-medium transition-all",
                  value === slot
                    ? "border-transparent bg-gradient-brand text-white shadow-glow"
                    : "border-plum-100 text-plum-600 hover:border-brand-300 dark:border-white/10 dark:text-cream-100/80"
                )}
              >
                {formatSlotLabel(slot)}
              </button>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-plum-300 dark:text-cream-100/40">No time slots available.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
