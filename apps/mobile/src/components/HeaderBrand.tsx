import { StyleSheet, Text, View } from "react-native";
import { LogoBadge } from "./Logo";
import { fonts } from "@/lib/theme";

// Icon-badge + salon-name lockup used in the Home tab header — mirrors the
// left side of DashboardLayout's header on the web dashboard.
export function HeaderBrand({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.row}>
      <LogoBadge size={36} iconSize={18} />
      <View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 17, color: "#fffaf5", fontFamily: fonts.displayBold, maxWidth: 220 },
  subtitle: { fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: fonts.sansSemiBold },
});
