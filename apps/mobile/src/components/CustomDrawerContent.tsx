import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector } from "@/hooks/redux";
import { useLogout } from "@/hooks/useLogout";
import { LogoBadge } from "./Logo";
import { colors, fonts, gradients } from "@/lib/theme";

interface MenuItem {
  route: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// The 11 curated web-nav-equivalent items — deliberately not auto-derived from
// every registered Drawer.Screen, so a route like "notifications" (only reachable
// via the bottom bar as "Alert") doesn't clutter this list.
const MENU_ITEMS: MenuItem[] = [
  { route: "index", label: "Overview", icon: "grid-outline" },
  { route: "analytics", label: "Analytics", icon: "bar-chart-outline" },
  { route: "reports", label: "Reports", icon: "document-text-outline" },
  { route: "appointments", label: "Bookings", icon: "calendar-outline" },
  { route: "customers", label: "Customers", icon: "people-outline" },
  { route: "reviews", label: "Reviews", icon: "star-outline" },
  { route: "services", label: "Services", icon: "cut-outline" },
  { route: "staff", label: "Staff", icon: "person-outline" },
  { route: "feed", label: "Showcase Feed", icon: "images-outline" },
  { route: "pos", label: "POS Billing", icon: "receipt-outline" },
  { route: "settings", label: "Profile", icon: "person-circle-outline" },
];

export function CustomDrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const tenant = useAppSelector((s) => s.auth.tenant);
  const handleLogout = useLogout();
  const activeRoute = state.routeNames[state.index];

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.hero} style={styles.header} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.brandRow}>
            <LogoBadge size={44} iconSize={22} />
            <View style={styles.brandText}>
              <Text style={styles.salonName} numberOfLines={1}>
                {tenant?.salonName || "GlamEdge"}
              </Text>
              <Text style={styles.subtitle}>GlamEdge Owner</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.menu}>
        {MENU_ITEMS.map((item) => {
          const isActive = activeRoute === item.route;
          return (
            <Pressable
              key={item.route}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => navigation.navigate(item.route)}
            >
              <Ionicons name={item.icon} size={19} color={isActive ? colors.primary : colors.textMuted} />
              <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={19} color={colors.danger} />
          <Text style={[styles.menuLabel, { color: colors.danger }]}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingBottom: 20 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 12 },
  brandText: { flex: 1, minWidth: 0 },
  salonName: { fontSize: 17, color: "#fff", fontFamily: fonts.displayBold },
  subtitle: { fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: fonts.sansSemiBold, marginTop: 1 },
  menu: { flex: 1, paddingTop: 8, paddingHorizontal: 10 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
  menuItemActive: { backgroundColor: colors.primaryLight },
  menuLabel: { fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.text },
  menuLabelActive: { color: colors.primaryDark },
  footer: { padding: 10, borderTopWidth: 1, borderTopColor: colors.border },
});
