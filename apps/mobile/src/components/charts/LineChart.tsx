import { useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from "react-native-svg";
import { colors, fonts } from "@/lib/theme";

export interface LinePoint {
  label: string;
  value: number;
}

export interface LineSeries {
  label: string;
  color: string;
  points: LinePoint[];
}

interface LineChartProps {
  data?: LinePoint[];
  series?: LineSeries[];
  height?: number;
  formatValue?: (v: number) => string;
  color?: string;
}

// Custom SVG line/area chart — react-native-svg is already a dependency and is
// bundled in Expo Go, unlike every RN charting library (see implementation plan).
// Pass `data` for a single filled area line, or `series` for 2+ comparison lines
// (no area fill, since overlapping fills read poorly at this size).
export function LineChart({ data, series, height = 140, formatValue, color = colors.primary }: LineChartProps) {
  const [width, setWidth] = useState(0);
  const resolvedSeries: LineSeries[] = series ?? [{ label: "", color, points: data ?? [] }];
  const pointCount = resolvedSeries[0]?.points.length ?? 0;

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  if (pointCount === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>No data yet</Text>
      </View>
    );
  }

  const max = Math.max(1, ...resolvedSeries.flatMap((s) => s.points.map((p) => p.value)));
  const stepX = pointCount > 1 ? width / (pointCount - 1) : width;

  function toPoints(points: LinePoint[]) {
    return points.map((p, i) => ({
      x: pointCount > 1 ? i * stepX : width / 2,
      y: height - (p.value / max) * (height - 16) - 8,
    }));
  }

  const isSingleArea = !series;
  const firstLabel = resolvedSeries[0]?.points[0]?.label;
  const lastLabel = resolvedSeries[0]?.points[pointCount - 1]?.label;

  return (
    <View>
      <View style={{ height }} onLayout={onLayout}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={resolvedSeries[0].color} stopOpacity={0.28} />
                <Stop offset="100%" stopColor={resolvedSeries[0].color} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {resolvedSeries.map((s) => {
              const pts = toPoints(s.points);
              const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
              const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;
              return (
                <G key={s.label}>
                  {isSingleArea ? <Path d={areaPath} fill="url(#areaFill)" /> : null}
                  <Path d={linePath} stroke={s.color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                  {pts.map((p, i) => (
                    <Circle key={i} cx={p.x} cy={p.y} r={2.5} fill={s.color} />
                  ))}
                </G>
              );
            })}
          </Svg>
        ) : null}
      </View>
      <View style={styles.axisRow}>
        <Text style={styles.axisLabel}>{firstLabel}</Text>
        {pointCount > 1 ? <Text style={styles.axisLabel}>{lastLabel}</Text> : null}
      </View>
      {series ? (
        <View style={styles.legendRow}>
          {series.map((s) => (
            <View key={s.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={styles.legendLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      ) : formatValue ? (
        <Text style={styles.maxLabel}>Peak: {formatValue(max)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", justifyContent: "center" },
  emptyText: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13 },
  axisRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  axisLabel: { fontSize: 10, fontFamily: fonts.sans, color: colors.textMuted },
  maxLabel: { fontSize: 11, fontFamily: fonts.sansSemiBold, color: colors.textMuted, marginTop: 6 },
  legendRow: { flexDirection: "row", gap: 14, marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, fontFamily: fonts.sansSemiBold, color: colors.textMuted },
});
