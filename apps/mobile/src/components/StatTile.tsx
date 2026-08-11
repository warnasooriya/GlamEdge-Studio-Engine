import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "@/lib/theme";

type Tone = "brand" | "emerald" | "rose" | "gold";

const TONE_COLORS: Record<Tone, string> = {
  brand: colors.primary,
  emerald: colors.success,
  rose: colors.danger,
  gold: colors.gold,
};

interface StatTileProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
}

export function StatTile({ label, value, icon, tone = "brand" }: StatTileProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBadge, { backgroundColor: TONE_COLORS[tone] }]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primaryDeep,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
    width: "100%",
  },
  iconBadge: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  textWrap: { flex: 1, minWidth: 0 },
  label: { fontSize: 12, fontFamily: fonts.sans, color: colors.textMuted },
  value: { fontSize: 18, fontFamily: fonts.displayBold, color: colors.text, marginTop: 2 },
});
