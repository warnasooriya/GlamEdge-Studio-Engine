import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return toDateStr(d);
}

function startOfMonth(): string {
  const d = new Date();
  return toDateStr(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
}

const PRESETS = [
  { label: "7 days", from: () => daysAgo(6) },
  { label: "30 days", from: () => daysAgo(29) },
  { label: "90 days", from: () => daysAgo(89) },
  { label: "This month", from: startOfMonth },
] as const;

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export function DateRangeFilter({ from, to, onChange }: Props) {
  const today = toDateStr(new Date());

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            size="sm"
            variant={from === p.from() && to === today ? "default" : "outline"}
            onClick={() => onChange(p.from(), today)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">From</label>
          <Input type="date" className="h-9 w-40" value={from} max={to} onChange={(e) => onChange(e.target.value, to)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">To</label>
          <Input type="date" className="h-9 w-40" value={to} min={from} max={today} onChange={(e) => onChange(from, e.target.value)} />
        </div>
      </div>
    </div>
  );
}

export function defaultRange(days = 30): { from: string; to: string } {
  return { from: daysAgo(days - 1), to: toDateStr(new Date()) };
}
