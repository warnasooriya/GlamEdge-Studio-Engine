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

export function isWithinBusinessHours(tenant: BusinessHoursTenant, date: Date): boolean {
  const openTime = tenant.openTime || DEFAULT_OPEN_TIME;
  const closeTime = tenant.closeTime || DEFAULT_CLOSE_TIME;
  const workingDays = parseWorkingDays(tenant.workingDays);

  if (!workingDays.includes(date.getDay())) return false;

  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= minutesSinceMidnight(openTime) && minutes < minutesSinceMidnight(closeTime);
}
