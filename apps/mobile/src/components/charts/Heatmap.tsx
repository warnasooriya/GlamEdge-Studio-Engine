import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";

export interface HeatmapPoint {
  dayOfWeek: number; // 0 = Mon .. 6 = Sun
  hour: number; // 0-23
  count: number;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatHour(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? "am" : "pm"}`;
}

function cellColor(intensity: number): string {
  if (intensity <= 0) return colors.border;
  // Single-hue ramp, brand-100 -> brand-700 — mirrors the web's BookingHeatmap.
  const stops = ["#ffe0eb", "#ff94ba", "#f0367e", "#d31e66", "#ad1454"];
  const idx = Math.min(stops.length - 1, Math.floor(intensity * stops.length));
  return stops[idx];
}

export function Heatmap({ data }: { data: HeatmapPoint[] }) {
  if (data.length === 0) {
    return <Text style={styles.emptyText}>Not enough bookings yet to find a pattern.</Text>;
  }

  const hours = data.map((d) => d.hour);
  const minHour = Math.max(0, Math.min(...hours) - 1);
  const maxHour = Math.min(23, Math.max(...hours) + 1);
  const hourRange = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  const countByCell = new Map<string, number>();
  let busiest: HeatmapPoint = data[0];
  for (const d of data) {
    countByCell.set(`${d.dayOfWeek}-${d.hour}`, d.count);
    if (d.count > busiest.count) busiest = d;
  }
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <View>
      <Text style={styles.busiest}>
        Busiest: {DAY_LABELS[busiest.dayOfWeek]} {formatHour(busiest.hour)} — {busiest.count} bookings
      </Text>
      <View style={styles.grid}>
        <View style={styles.hourCol}>
          <View style={styles.headerCell} />
          {hourRange.map((h) => (
            <Text key={h} style={styles.hourLabel}>
              {formatHour(h)}
            </Text>
          ))}
        </View>
        {DAY_LABELS.map((day, dayIndex) => (
          <View key={day} style={styles.dayCol}>
            <Text style={styles.dayLabel}>{day}</Text>
            {hourRange.map((h) => {
              const count = countByCell.get(`${dayIndex}-${h}`) || 0;
              return (
                <View
                  key={h}
                  style={[styles.cell, { backgroundColor: cellColor(count / maxCount) }]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const CELL_SIZE = 16;

const styles = StyleSheet.create({
  emptyText: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13 },
  busiest: { fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.text, marginBottom: 10 },
  grid: { flexDirection: "row" },
  hourCol: { width: 40, marginRight: 4 },
  headerCell: { height: 16, marginBottom: 3 },
  hourLabel: { height: CELL_SIZE, marginBottom: 3, fontSize: 9, fontFamily: fonts.sans, color: colors.textMuted, textAlignVertical: "center" },
  dayCol: { flex: 1, alignItems: "center" },
  dayLabel: { height: 16, marginBottom: 3, fontSize: 10, fontFamily: fonts.sansSemiBold, color: colors.textMuted },
  cell: { width: "86%", height: CELL_SIZE, marginBottom: 3, borderRadius: 3 },
});
