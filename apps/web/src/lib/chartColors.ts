import { AppointmentStatus, CategoryType } from "@/types";

// Validated against the dataviz color-formula checks (lightness band, chroma floor,
// CVD adjacent-pair separation, normal-vision floor, contrast vs surface).
export const CATEGORY_COLORS: Record<CategoryType, string> = {
  LADIES: "#f0367e",
  GENTS: "#2563eb",
  KIDS: "#d97706",
};

// Order matters — this sequence is the one that clears the CVD adjacent-pair gate.
export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  CONFIRMED: "#2a78d6",
  PENDING: "#eda100",
  COMPLETED: "#1baf7a",
  CANCELLED: "#e34948",
};

export const REVENUE_COLOR = "#f0367e";
export const RATING_COLOR = "#d97706";
export const BOOKINGS_COLOR = "#2563eb";

// Validated adjacent pair (aqua/red, the same order used in STATUS_COLORS).
export const INCOME_COLOR = "#1baf7a";
export const EXPENSE_COLOR = "#e34948";

export const CHART_TEXT_MUTED = "#a89aa5";
export const CHART_GRID = "#efe1ec";
