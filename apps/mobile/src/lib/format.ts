import { AppointmentStatus } from "@/types";

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

export function formatCurrency(amount: string | number): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return `Rs. ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const STATUS_COLORS: Record<AppointmentStatus, { bg: string; text: string }> = {
  PENDING: { bg: "#FEF3C7", text: "#92400E" },
  CONFIRMED: { bg: "#DBEAFE", text: "#1E40AF" },
  COMPLETED: { bg: "#D1FAE5", text: "#065F46" },
  CANCELLED: { bg: "#FEE2E2", text: "#991B1B" },
};

export function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function dateRangeFromDays(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: toYmd(from), to: toYmd(to) };
}

// Device-local calendar day, as opposed to toYmd()'s UTC day — needed for
// grouping/filtering bookings by the day the owner actually perceives as
// "today" (toYmd() can be off by one near midnight for UTC+ timezones like
// Sri Lanka's, e.g. between midnight and 5:30am local it's still "yesterday" in UTC).
export function localYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Local-midnight-to-local-midnight range for a given "YYYY-MM-DD" day,
// expressed as UTC ISO instants for the API's from/to query params.
export function localDayRange(ymd: string): { from: string; to: string } {
  const [y, m, d] = ymd.split("-").map(Number);
  const from = new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
  const to = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
  return { from, to };
}
