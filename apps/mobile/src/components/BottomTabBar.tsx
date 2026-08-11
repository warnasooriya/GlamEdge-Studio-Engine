import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/lib/theme";

interface TabItem {
  href: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
  { href: "/", label: "Overview", icon: "grid-outline", iconActive: "grid" },
  { href: "/appointments", label: "Bookings", icon: "calendar-outline", iconActive: "calendar" },
  { href: "/pos", label: "POS Billing", icon: "receipt-outline", iconActive: "receipt" },
  { href: "/notifications", label: "Alert", icon: "notifications-outline", iconActive: "notifications" },
  { href: "/settings", label: "Profile", icon: "person-circle-outline", iconActive: "person-circle" },
];

// Custom bottom bar (not React Navigation Tabs) so it can be dropped into the 5
// primary screens without restructuring the Drawer's flat route layout — see
// the mobile implementation plan for the reasoning.
export function BottomTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((tab) => {
        const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Pressable key={tab.href} style={styles.item} onPress={() => router.navigate(tab.href as any)}>
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={22}
              color={isActive ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  item: { flex: 1, alignItems: "center", gap: 3 },
  label: { fontSize: 10, fontFamily: fonts.sansSemiBold, color: colors.textMuted },
  labelActive: { color: colors.primary },
});
