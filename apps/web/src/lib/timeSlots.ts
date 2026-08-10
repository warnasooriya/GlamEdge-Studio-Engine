// Matches apps/api/src/utils/businessHours.ts's fallback — a salon that
// hasn't configured hours yet keeps this exact behavior.
export const DEFAULT_OPEN_TIME = "09:00";
export const DEFAULT_CLOSE_TIME = "20:00";
export const DEFAULT_WORKING_DAYS = [0, 1, 2, 3, 4, 5, 6];

const SLOT_MINUTES = 30;

// Salons on this platform always operate in Sri Lanka time (+05:30), regardless
// of the booking device's own timezone — matches apps/api's SL_OFFSET_MINUTES
// convention (see businessHours.ts and analytics.controller.ts).
const SL_OFFSET_MINUTES = 330;

function toSriLankaWallClock(d: Date): Date {
  return new Date(d.getTime() + SL_OFFSET_MINUTES * 60000);
}

export function toSriLankaDateStr(d: Date): string {
  const sl = toSriLankaWallClock(d);
  return `${sl.getUTCFullYear()}-${String(sl.getUTCMonth() + 1).padStart(2, "0")}-${String(sl.getUTCDate()).padStart(2, "0")}`;
}

// Builds the UTC instant for a Sri Lanka wall-clock date + time, independent of
// the booking device's own timezone — a client or staff member on a device set
// to a different zone must not shift the actual salon-local slot they picked.
export function slDateTimeToUtcISOString(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  const utcMs = Date.UTC(y, m - 1, d, h, min) - SL_OFFSET_MINUTES * 60000;
  return new Date(utcMs).toISOString();
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

  if (dateStr !== toSriLankaDateStr(now)) return slots;

  const sl = toSriLankaWallClock(now);
  const nowSlMinutes = sl.getUTCHours() * 60 + sl.getUTCMinutes();
  return slots.filter((slot) => toMinutes(slot) > nowSlMinutes);
}
