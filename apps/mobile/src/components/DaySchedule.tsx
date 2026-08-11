import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Appointment, AppointmentStatus } from "@/types";
import { colors, fonts } from "@/lib/theme";
import { CategoryBadge } from "./CategoryBadge";

const HOUR_HEIGHT = 60; // px per hour
const MIN_BLOCK_HEIGHT = 32; // keeps very short bookings tappable/readable
const DEFAULT_DURATION_MIN = 30; // fallback if a booking somehow has no services

const STATUS_BLOCK_STYLE: Record<AppointmentStatus, { border: string; bg: string }> = {
  PENDING: { border: "#c9b8c5", bg: "#f8f3f7" },
  CONFIRMED: { border: colors.primaryDark, bg: colors.primaryLight },
  COMPLETED: { border: colors.success, bg: "#ecfdf5" },
  CANCELLED: { border: colors.border, bg: "#f8f3f7" },
};

interface PositionedAppointment {
  appt: Appointment;
  top: number;
  height: number;
  column: number;
  columns: number;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function apptStartMinutes(appt: Appointment): number {
  const d = new Date(appt.bookingTime);
  return d.getHours() * 60 + d.getMinutes();
}

function apptDurationMinutes(appt: Appointment): number {
  const total = appt.services.reduce((sum, s) => sum + (s.service?.durationMin || 0), 0);
  return total > 0 ? total : DEFAULT_DURATION_MIN;
}

function formatHourLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour} ${h < 12 ? "AM" : "PM"}`;
}

function formatTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Same overlap-layout algorithm as apps/web/src/components/appointments/DaySchedule.tsx —
// clusters overlapping bookings and assigns each a column so they sit side-by-side.
function layoutAppointments(appointments: Appointment[], dayStartMin: number): PositionedAppointment[] {
  const sorted = [...appointments].sort((a, b) => apptStartMinutes(a) - apptStartMinutes(b));

  const clusters: Appointment[][] = [];
  let clusterEnd = -1;
  for (const appt of sorted) {
    const start = apptStartMinutes(appt);
    if (clusters.length === 0 || start >= clusterEnd) {
      clusters.push([appt]);
      clusterEnd = start + apptDurationMinutes(appt);
    } else {
      clusters[clusters.length - 1].push(appt);
      clusterEnd = Math.max(clusterEnd, start + apptDurationMinutes(appt));
    }
  }

  const positioned: PositionedAppointment[] = [];
  for (const cluster of clusters) {
    const columnEnds: number[] = [];
    const assigned: { appt: Appointment; column: number }[] = [];
    for (const appt of cluster) {
      const start = apptStartMinutes(appt);
      const end = start + apptDurationMinutes(appt);
      let column = columnEnds.findIndex((endMin) => endMin <= start);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(end);
      } else {
        columnEnds[column] = end;
      }
      assigned.push({ appt, column });
    }
    const columnCount = columnEnds.length;
    for (const { appt, column } of assigned) {
      const start = apptStartMinutes(appt);
      const duration = apptDurationMinutes(appt);
      positioned.push({
        appt,
        top: ((start - dayStartMin) / 60) * HOUR_HEIGHT,
        height: Math.max((duration / 60) * HOUR_HEIGHT - 2, MIN_BLOCK_HEIGHT),
        column,
        columns: columnCount,
      });
    }
  }
  return positioned;
}

interface DayScheduleProps {
  date: Date;
  appointments: Appointment[];
  onOpenDetails: (id: string) => void;
  openTime?: string;
  closeTime?: string;
}

export function DaySchedule({ date, appointments, onOpenDetails, openTime = "09:00", closeTime = "20:00" }: DayScheduleProps) {
  const dayStartMin = toMinutes(openTime);
  const dayEndMin = toMinutes(closeTime);
  const hours = useMemo(() => {
    const list: number[] = [];
    for (let m = dayStartMin; m < dayEndMin; m += 60) list.push(m);
    return list;
  }, [dayStartMin, dayEndMin]);
  const gridHeight = ((dayEndMin - dayStartMin) / 60) * HOUR_HEIGHT;

  const positioned = useMemo(() => layoutAppointments(appointments, dayStartMin), [appointments, dayStartMin]);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = now.toDateString() === date.toDateString();
  const showNowLine = isToday && nowMinutes >= dayStartMin && nowMinutes <= dayEndMin;
  const nowTop = ((nowMinutes - dayStartMin) / 60) * HOUR_HEIGHT;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.row}>
        <View style={[styles.hourColumn, { height: gridHeight }]}>
          {hours.map((m) => (
            <View key={m} style={[styles.hourLabelWrap, { height: HOUR_HEIGHT }]}>
              <Text style={styles.hourLabel}>{formatHourLabel(m)}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.grid, { height: gridHeight }]}>
          {hours.map((m, i) => (
            <View key={m} style={[styles.gridLine, { top: i * HOUR_HEIGHT }]} />
          ))}

          {showNowLine ? (
            <View style={[styles.nowLine, { top: nowTop }]}>
              <View style={styles.nowDot} />
              <View style={styles.nowBar} />
            </View>
          ) : null}

          {positioned.length === 0 ? (
            <Text style={styles.emptyText}>No bookings on this day.</Text>
          ) : null}

          {positioned.map(({ appt, top, height, column, columns }) => {
            const blockStyle = STATUS_BLOCK_STYLE[appt.status];
            return (
              <Pressable
                key={appt.id}
                onPress={() => onOpenDetails(appt.id)}
                style={[
                  styles.block,
                  {
                    top,
                    height,
                    left: `${(column / columns) * 100}%`,
                    width: `${(1 / columns) * 100}%`,
                    borderLeftColor: blockStyle.border,
                    backgroundColor: blockStyle.bg,
                  },
                ]}
              >
                <Text style={styles.blockTitle} numberOfLines={1}>
                  {formatTimeLabel(appt.bookingTime)} · {appt.clientName}
                </Text>
                {height > 40 ? (
                  <View style={styles.blockMetaRow}>
                    <CategoryBadge category={appt.category} />
                    {appt.staff?.name ? (
                      <Text style={styles.blockStaff} numberOfLines={1}>
                        {appt.staff.name}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const COLUMN_WIDTH = 280;

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  hourColumn: { width: 52 },
  hourLabelWrap: { alignItems: "flex-end", justifyContent: "flex-start", paddingRight: 8 },
  hourLabel: { fontSize: 11, fontFamily: fonts.sans, color: colors.textMuted, marginTop: -6 },
  grid: {
    width: COLUMN_WIDTH,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    position: "relative",
  },
  gridLine: { position: "absolute", left: 0, right: 0, borderTopWidth: 1, borderTopColor: colors.border },
  nowLine: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", zIndex: 20 },
  nowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: -4 },
  nowBar: { flex: 1, height: 1, backgroundColor: colors.primary },
  emptyText: {
    position: "absolute",
    top: 24,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 13,
    fontFamily: fonts.sans,
    color: colors.textMuted,
  },
  block: {
    position: "absolute",
    borderLeftWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    overflow: "hidden",
  },
  blockTitle: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.text },
  blockMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  blockStaff: { fontSize: 11, fontFamily: fonts.sans, color: colors.textMuted },
});
