import { Fragment, useMemo, useState } from "react";

interface PeakTime {
  dayOfWeek: number;
  hour: number;
  count: number;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatHour(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${period}`;
}

// Single-hue sequential ramp (brand pink, light→dark) — magnitude only, no identity to separate.
function heatColor(count: number, max: number): string {
  if (count === 0 || max === 0) return "";
  const t = Math.min(1, count / max);
  const from = [255, 224, 235]; // brand-100
  const to = [173, 20, 84]; // brand-700
  const rgb = from.map((c, i) => Math.round(c + (to[i] - c) * t));
  return `rgb(${rgb.join(",")})`;
}

export function BookingHeatmap({ data }: { data: PeakTime[] }) {
  const [hovered, setHovered] = useState<PeakTime | null>(null);

  const { grid, hours, max, busiest } = useMemo(() => {
    const byKey = new Map(data.map((d) => [`${d.dayOfWeek}-${d.hour}`, d.count]));
    const max = data.reduce((m, d) => Math.max(m, d.count), 0);
    const busiest = data.reduce<PeakTime | null>((best, d) => (!best || d.count > best.count ? d : best), null);

    const hoursWithData = data.filter((d) => d.count > 0).map((d) => d.hour);
    const minHour = hoursWithData.length ? Math.max(0, Math.min(...hoursWithData) - 1) : 8;
    const maxHour = hoursWithData.length ? Math.min(23, Math.max(...hoursWithData) + 1) : 20;
    const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

    const grid = hours.map((hour) => DAY_LABELS.map((_, dow) => byKey.get(`${dow}-${hour}`) ?? 0));

    return { grid, hours, max, busiest };
  }, [data]);

  if (max === 0) {
    return <p className="flex h-40 items-center justify-center text-sm text-plum-300 dark:text-cream-100/40">No bookings in this period yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-plum-400 dark:text-cream-100/50">
        {hovered ? (
          <>
            <span className="font-medium text-plum-600 dark:text-cream-100/80">
              {DAY_LABELS[hovered.dayOfWeek]} {formatHour(hovered.hour)}
            </span>{" "}
            — {hovered.count} booking{hovered.count === 1 ? "" : "s"}
          </>
        ) : busiest ? (
          <>
            Busiest:{" "}
            <span className="font-medium text-plum-600 dark:text-cream-100/80">
              {DAY_LABELS[busiest.dayOfWeek]} {formatHour(busiest.hour)}
            </span>{" "}
            — {busiest.count} booking{busiest.count === 1 ? "" : "s"}
          </>
        ) : null}
      </p>

      <div className="overflow-x-auto">
        <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `44px repeat(${DAY_LABELS.length}, 32px)` }}>
          <div />
          {DAY_LABELS.map((d) => (
            <div key={d} className="pb-1 text-center text-[10px] font-medium text-plum-400 dark:text-cream-100/50">
              {d}
            </div>
          ))}

          {hours.map((hour, rowIdx) => (
            <Fragment key={hour}>
              <div className="flex items-center justify-end pr-1.5 text-[10px] text-plum-400 dark:text-cream-100/50">
                {formatHour(hour)}
              </div>
              {grid[rowIdx].map((count, dow) => (
                <div
                  key={`${hour}-${dow}`}
                  onMouseEnter={() => setHovered({ dayOfWeek: dow, hour, count })}
                  onMouseLeave={() => setHovered(null)}
                  className="h-6 w-8 rounded-sm bg-plum-50 dark:bg-white/5"
                  style={{ backgroundColor: heatColor(count, max) || undefined }}
                />
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-plum-300 dark:text-cream-100/40">
        <span>Fewer</span>
        <div className="h-2.5 w-24 rounded-full" style={{ background: "linear-gradient(to right, rgb(255,224,235), rgb(173,20,84))" }} />
        <span>More</span>
      </div>
    </div>
  );
}
