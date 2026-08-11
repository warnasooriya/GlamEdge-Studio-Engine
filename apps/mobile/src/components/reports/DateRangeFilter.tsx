import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";

const PRESETS = [7, 14, 30, 90] as const;

export function DateRangeFilter({ days, onChange }: { days: number; onChange: (days: number) => void }) {
  return (
    <View style={styles.row}>
      {PRESETS.map((p) => (
        <Pressable key={p} style={[styles.chip, days === p && styles.chipActive]} onPress={() => onChange(p)}>
          <Text style={[styles.chipText, days === p && styles.chipTextActive]}>Last {p}d</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.textMuted },
  chipTextActive: { color: "#fff" },
});
