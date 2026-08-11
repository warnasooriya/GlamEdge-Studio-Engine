// Ported 1:1 from apps/web/tailwind.config.js "brand" / "plum" / "cream" ramps and
// gradient definitions, so the owner app reads as the same product as the web
// dashboard rather than a generic RN starter look.

export const brand = {
  50: "#fff1f5",
  100: "#ffe0eb",
  200: "#ffc2d9",
  300: "#ff94ba",
  400: "#fb6f9c",
  500: "#f0367e", // primary
  600: "#d31e66",
  700: "#ad1454",
  800: "#831049",
  900: "#4a0a2b",
};

export const plum = {
  50: "#f8f3f7",
  100: "#efe1ec",
  400: "#7c4a72",
  500: "#5b2f52",
  600: "#43223d",
  700: "#2f1729",
  800: "#1f0f1b",
  900: "#150a12",
};

export const cream = {
  50: "#fffaf5",
  100: "#fdf2e9",
  200: "#f9e4d2",
};

export const colors = {
  primary: brand[500],
  primaryDark: brand[600],
  primaryDeep: brand[700],
  primaryLight: brand[100],
  amber: "#F59E0B",
  gold: "#D97706",

  bg: cream[50],
  surface: "#ffffff",
  border: "#f1e5e5",
  text: plum[800],
  textMuted: "#6b6470",
  textOnDark: cream[50],
  textOnDarkMuted: "rgba(253,242,233,0.7)",

  danger: "#dc2626",
  success: "#16a34a",

  glassBorder: "rgba(255,255,255,0.15)",
  glassSurfaceDark: "rgba(255,255,255,0.08)",
};

// expo-linear-gradient `colors` arrays, matching the web's backgroundImage gradients.
export const gradients = {
  // .bg-gradient-brand — 135deg, used for primary buttons / active nav pills.
  brand: [brand[500], brand[600], brand[700]] as const,
  // .bg-gradient-hero — used for the dark app-chrome header, matches DashboardLayout.
  hero: [brand[800], plum[600], plum[900]] as const,
  gold: ["#fbbf24", "#d97706"] as const,
};

export const fonts = {
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  sans: "PlusJakartaSans_400Regular",
  sansMedium: "PlusJakartaSans_500Medium",
  sansSemiBold: "PlusJakartaSans_600SemiBold",
  sansBold: "PlusJakartaSans_700Bold",
};
