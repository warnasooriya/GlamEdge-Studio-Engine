import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  formatValue?: (v: number) => string;
}

// Simple vertical bar chart built from plain Views — see the mobile
// implementation plan for why this isn't a charting-library component.
export function BarChart({ data, height = 140, formatValue }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View style={[styles.row, { height: height + 34 }]}>
      {data.map((d, i) => {
        const barHeight = Math.max(3, (d.value / max) * height);
        return (
          <View key={`${d.label}-${i}`} style={styles.col}>
            <Text style={styles.value} numberOfLines={1}>
              {formatValue ? formatValue(d.value) : d.value}
            </Text>
            <View style={[styles.barTrack, { height }]}>
              <View
                style={[
                  styles.bar,
                  { height: barHeight, backgroundColor: d.color || colors.primary },
                ]}
              />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  col: { flex: 1, alignItems: "center" },
  barTrack: { width: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 6, minHeight: 3 },
  value: { fontSize: 10, fontFamily: fonts.sansBold, color: colors.text, marginBottom: 4 },
  label: { fontSize: 10, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 6, textAlign: "center" },
});
