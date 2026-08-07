// Matches apps/api/src/utils/businessHours.ts's fallback — a salon that
// hasn't configured hours yet keeps this exact behavior.
export const DEFAULT_OPEN_TIME = "09:00";
export const DEFAULT_CLOSE_TIME = "20:00";
export const DEFAULT_WORKING_DAYS = [0, 1, 2, 3, 4, 5, 6];

const SLOT_MINUTES = 30;

export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function isWorkingDay(dateStr: string, workingDays: number[] = DEFAULT_WORKING_DAYS): boolean {
  if (!dateStr) return false;
  // new Date("yyyy-MM-dd") parses as UTC midnight, which can shift the
  // weekday by a day depending on the browser's timezone offset — parsing
  // the parts directly keeps this a plain local-calendar-day comparison.
  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return workingDays.includes(day);
}

export function generateTimeSlots(
  dateStr: string,
  now: Date = new Date(),
  openTime: string = DEFAULT_OPEN_TIME,
  closeTime: string = DEFAULT_CLOSE_TIME
): string[] {
  if (!dateStr) return [];

  const slots: string[] = [];
  for (let m = toMinutes(openTime); m < toMinutes(closeTime); m += SLOT_MINUTES) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }

  if (dateStr !== toLocalDateStr(now)) return slots;

  return slots.filter((slot) => new Date(`${dateStr}T${slot}:00`) > now);
}
