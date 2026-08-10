// A salon that hasn't configured openTime/closeTime/workingDays yet keeps the
// exact behavior the booking flow always had before this feature existed:
// 9am-8pm, every day. This is what apps/web's generateTimeSlots defaults to
// as well — keep the two in sync if either changes.
export const DEFAULT_OPEN_TIME = "09:00";
export const DEFAULT_CLOSE_TIME = "20:00";
export const DEFAULT_WORKING_DAYS = [0, 1, 2, 3, 4, 5, 6];

interface BusinessHoursTenant {
  openTime: string | null;
  closeTime: string | null;
  workingDays: unknown;
}

function parseWorkingDays(workingDays: unknown): number[] {
  if (Array.isArray(workingDays) && workingDays.every((d) => typeof d === "number")) {
    return workingDays as number[];
  }
  return DEFAULT_WORKING_DAYS;
}

function minutesSinceMidnight(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// bookingTime is stored as a UTC instant; salons on this platform operate in Sri
// Lanka (+05:30) regardless of what timezone the server process itself runs in.
// date.getDay()/getHours() reflect the server's local TZ (often UTC in
// containers), so they'd silently check business hours against the wrong clock
// unless the deploy environment happens to be set to Asia/Colombo. Shifting by
// this fixed offset and reading back with UTC getters keeps the check correct
// no matter what TZ the server runs in. Matches analytics.controller.ts's
// SL_OFFSET_MINUTES convention.
const SL_OFFSET_MINUTES = 330;

export function isWithinBusinessHours(tenant: BusinessHoursTenant, date: Date): boolean {
  const openTime = tenant.openTime || DEFAULT_OPEN_TIME;
  const closeTime = tenant.closeTime || DEFAULT_CLOSE_TIME;
  const workingDays = parseWorkingDays(tenant.workingDays);

  const sl = new Date(date.getTime() + SL_OFFSET_MINUTES * 60000);

  if (!workingDays.includes(sl.getUTCDay())) return false;

  const minutes = sl.getUTCHours() * 60 + sl.getUTCMinutes();
  return minutes >= minutesSinceMidnight(openTime) && minutes < minutesSinceMidnight(closeTime);
}
