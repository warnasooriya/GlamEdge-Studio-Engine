const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 20;
const SLOT_MINUTES = 30;

export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function generateTimeSlots(dateStr: string, now: Date = new Date()): string[] {
  if (!dateStr) return [];

  const slots: string[] = [];
  for (let m = BUSINESS_START_HOUR * 60; m < BUSINESS_END_HOUR * 60; m += SLOT_MINUTES) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }

  if (dateStr !== toLocalDateStr(now)) return slots;

  return slots.filter((slot) => new Date(`${dateStr}T${slot}:00`) > now);
}
