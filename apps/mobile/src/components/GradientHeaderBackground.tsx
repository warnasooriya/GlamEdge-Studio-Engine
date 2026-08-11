import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradients } from "@/lib/theme";

// Passed as `headerBackground` to Stack/Tabs screenOptions — mirrors the
// `bg-gradient-hero` header treatment on the web dashboard (DashboardLayout.tsx)
// so every top-level screen in the app shares the same enterprise chrome.
export function GradientHeaderBackground() {
  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}
