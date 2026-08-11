import { GradientHeaderBackground } from "@/components/GradientHeaderBackground";
import { fonts } from "@/lib/theme";

// Shared header look for every Stack/Tabs navigator in (app) — dark gradient
// chrome, cream title text in the display face, matching web's DashboardLayout.
export const gradientHeaderScreenOptions = {
  headerBackground: GradientHeaderBackground,
  headerStyle: { backgroundColor: "transparent" },
  headerTintColor: "#fffaf5",
  headerTitleStyle: { fontFamily: fonts.displayBold, fontSize: 18 },
  headerShadowVisible: false,
} as const;
