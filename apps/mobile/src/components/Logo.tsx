import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

// Same glyph as apps/web/src/components/shared/GlamEdgeLogo.tsx — kept in sync
// manually so the mobile app icon/header mark matches the web dashboard exactly.
export function Logo({ size = 24, color = "#ffffff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M17,9 L10.98,10.98 L9,17 L7.02,10.98 L1,9 L7.02,7.02 L9,1 L10.98,7.02 Z" />
      <Path d="M22.5,18 L19.13,19.13 L18,22.5 L16.87,19.13 L13.5,18 L16.87,16.87 L18,13.5 L19.13,16.87 Z" />
    </Svg>
  );
}

// Frosted-glass badge wrapping the mark — mirrors DashboardLayout's header
// treatment (`h-10 w-10 rounded-xl bg-white/10`) on the web dashboard.
export function LogoBadge({ size = 40, iconSize = 20 }: { size?: number; iconSize?: number }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Logo size={iconSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
});
