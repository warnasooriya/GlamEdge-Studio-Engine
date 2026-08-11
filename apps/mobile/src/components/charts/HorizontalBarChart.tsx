import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";
import { BarDatum } from "./BarChart";

interface HorizontalBarChartProps {
  data: BarDatum[];
  formatValue?: (v: number) => string;
}

export function HorizontalBarChart({ data, formatValue }: HorizontalBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View style={styles.wrap}>
      {data.map((d, i) => (
        <View key={`${d.label}-${i}`} style={styles.row}>
          <Text style={styles.label} numberOfLines={1}>
            {d.label}
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.bar,
                { width: `${Math.max(3, (d.value / max) * 100)}%`, backgroundColor: d.color || colors.primary },
              ]}
            />
          </View>
          <Text style={styles.value}>{formatValue ? formatValue(d.value) : d.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { width: 84, fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.text },
  track: { flex: 1, height: 10, borderRadius: 6, backgroundColor: colors.primaryLight, overflow: "hidden" },
  bar: { height: "100%", borderRadius: 6 },
  value: { width: 64, fontSize: 11, fontFamily: fonts.sansBold, color: colors.text, textAlign: "right" },
});
