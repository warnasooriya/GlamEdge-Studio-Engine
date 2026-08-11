import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Calendar, DateData } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { listAppointments } from "@/api/appointments";
import { AppointmentCard } from "@/components/AppointmentCard";
import { DaySchedule } from "@/components/DaySchedule";
import { BottomTabBar } from "@/components/BottomTabBar";
import { useAppSelector } from "@/hooks/redux";
import { colors, fonts } from "@/lib/theme";
import { localDayRange, localYmd, STATUS_COLORS } from "@/lib/format";
import { Appointment, AppointmentStatus } from "@/types";

type StatusFilter = AppointmentStatus | "ALL";
type ViewMode = "list" | "calendar";
const FILTERS: StatusFilter[] = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
const VIEW_MODE_KEY = "glamedge_bookings_view_mode";

function todayYmd(): string {
  return localYmd(new Date());
}

function formatSelectedDate(ymd: string): string {
  return new Date(`${ymd}T00:00:00`).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export default function AppointmentsListScreen() {
  const tenant = useAppSelector((s) => s.auth.tenant);
  const [viewMode, setViewModeState] = useState<ViewMode>("list");
  const [modeLoaded, setModeLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [listSelectedDate, setListSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => todayYmd().slice(0, 7));
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(todayYmd);

  useEffect(() => {
    AsyncStorage.getItem(VIEW_MODE_KEY).then((saved) => {
      if (saved === "list" || saved === "calendar") setViewModeState(saved);
      setModeLoaded(true);
    });
  }, []);

  function setViewMode(mode: ViewMode) {
    setViewModeState(mode);
    AsyncStorage.setItem(VIEW_MODE_KEY, mode).catch(() => {});
  }

  function handleToday() {
    const today = todayYmd();
    if (viewMode === "list") {
      setListSelectedDate(today);
    } else {
      setCalendarSelectedDate(today);
      setCalendarMonth(today.slice(0, 7));
    }
  }

  const { from: listFrom, to: listTo } = useMemo(() => {
    if (listSelectedDate) return localDayRange(listSelectedDate);
    return { from: localDayRange(todayYmd()).from, to: undefined };
  }, [listSelectedDate]);

  const {
    data: listData,
    isLoading: listLoading,
    refetch: listRefetch,
    isRefetching: listRefetching,
  } = useQuery({
    queryKey: ["appointments", "list", statusFilter, listFrom, listTo],
    queryFn: () =>
      listAppointments({
        from: listFrom,
        to: listTo,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        excludeCancelled: statusFilter === "ALL",
        pageSize: 100,
      }),
    enabled: modeLoaded && viewMode === "list",
  });

  const calendarRange = useMemo(() => {
    const [y, m] = calendarMonth.split("-").map(Number);
    const from = new Date(y, m - 1, 1, 0, 0, 0, 0).toISOString();
    const to = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
    return { from, to };
  }, [calendarMonth]);

  const {
    data: calendarData,
    refetch: calendarRefetch,
    isRefetching: calendarRefetching,
  } = useQuery({
    queryKey: ["appointments", "calendarMonth", calendarMonth, statusFilter],
    queryFn: () =>
      listAppointments({
        from: calendarRange.from,
        to: calendarRange.to,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        pageSize: 200,
      }),
    enabled: modeLoaded && viewMode === "calendar",
  });

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appt of calendarData?.appointments ?? []) {
      const key = localYmd(new Date(appt.bookingTime));
      const list = map.get(key) ?? [];
      list.push(appt);
      map.set(key, list);
    }
    return map;
  }, [calendarData]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    appointmentsByDay.forEach((appts, day) => {
      marks[day] = {
        dots: appts.slice(0, 4).map((a, i) => ({ key: `${day}-${i}`, color: STATUS_COLORS[a.status].text })),
      };
    });
    marks[calendarSelectedDate] = {
      ...(marks[calendarSelectedDate] || {}),
      selected: true,
      selectedColor: colors.primary,
    };
    return marks;
  }, [appointmentsByDay, calendarSelectedDate]);

  const selectedDayAppointments = useMemo(
    () =>
      (appointmentsByDay.get(calendarSelectedDate) ?? [])
        .slice()
        .sort((a, b) => new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime()),
    [appointmentsByDay, calendarSelectedDate]
  );

  const listAppointmentsData = listData?.appointments ?? [];

  if (!modeLoaded) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.modeToggle}>
          <Pressable
            style={[styles.modeChip, viewMode === "list" && styles.modeChipActive]}
            onPress={() => setViewMode("list")}
          >
            <Ionicons name="list-outline" size={14} color={viewMode === "list" ? "#fff" : colors.textMuted} />
            <Text style={[styles.modeChipText, viewMode === "list" && styles.modeChipTextActive]}>List</Text>
          </Pressable>
          <Pressable
            style={[styles.modeChip, viewMode === "calendar" && styles.modeChipActive]}
            onPress={() => setViewMode("calendar")}
          >
            <Ionicons name="calendar-outline" size={14} color={viewMode === "calendar" ? "#fff" : colors.textMuted} />
            <Text style={[styles.modeChipText, viewMode === "calendar" && styles.modeChipTextActive]}>Calendar</Text>
          </Pressable>
        </View>
        <Pressable style={styles.todayBtn} onPress={handleToday}>
          <Ionicons name="today-outline" size={14} color={colors.primary} />
          <Text style={styles.todayBtnText}>Today</Text>
        </Pressable>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTERS}
        keyExtractor={(f) => f}
        style={styles.filterRow}
        contentContainerStyle={styles.filterRowContent}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.filterChip, statusFilter === item && styles.filterChipActive]}
            onPress={() => setStatusFilter(item)}
          >
            <Text style={[styles.filterChipText, statusFilter === item && styles.filterChipTextActive]}>
              {item[0] + item.slice(1).toLowerCase()}
            </Text>
          </Pressable>
        )}
      />

      {viewMode === "list" ? (
        <>
          {listSelectedDate ? (
            <View style={styles.dateBanner}>
              <Text style={styles.dateBannerText}>
                {listSelectedDate === todayYmd() ? "Showing today" : `Showing ${formatSelectedDate(listSelectedDate)}`}
              </Text>
              <Pressable onPress={() => setListSelectedDate(null)}>
                <Text style={styles.clearText}>Show all upcoming</Text>
              </Pressable>
            </View>
          ) : null}
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={listAppointmentsData}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={listRefetching} onRefresh={listRefetch} />}
            renderItem={({ item }) => (
              <AppointmentCard appointment={item} onPress={() => router.push(`/appointments/${item.id}`)} />
            )}
            ListEmptyComponent={
              !listLoading ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No appointments found.</Text>
                </View>
              ) : null
            }
          />
        </>
      ) : (
        <ScrollView
          style={styles.calendarScroll}
          contentContainerStyle={styles.calendarContent}
          refreshControl={<RefreshControl refreshing={calendarRefetching} onRefresh={calendarRefetch} />}
        >
          <View style={styles.calendarCard}>
            <Calendar
              current={`${calendarMonth}-01`}
              onMonthChange={(m: DateData) => setCalendarMonth(m.dateString.slice(0, 7))}
              onDayPress={(d: DateData) => setCalendarSelectedDate(d.dateString)}
              markingType="multi-dot"
              markedDates={markedDates}
              theme={{
                todayTextColor: colors.primary,
                selectedDayBackgroundColor: colors.primary,
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                textMonthFontFamily: fonts.sansBold,
                textDayFontFamily: fonts.sans,
                textDayHeaderFontFamily: fonts.sansSemiBold,
              }}
            />
          </View>

          <View style={styles.dayScheduleHeader}>
            <Text style={styles.dayScheduleTitle}>
              {calendarSelectedDate === todayYmd() ? "Today's schedule" : formatSelectedDate(calendarSelectedDate)}
            </Text>
            <Text style={styles.dayScheduleCount}>
              {selectedDayAppointments.length} booking{selectedDayAppointments.length === 1 ? "" : "s"}
            </Text>
          </View>

          <View style={styles.dayScheduleCard}>
            <DaySchedule
              date={new Date(`${calendarSelectedDate}T00:00:00`)}
              appointments={selectedDayAppointments}
              onOpenDetails={(id) => router.push(`/appointments/${id}`)}
              openTime={tenant?.openTime || undefined}
              closeTime={tenant?.closeTime || undefined}
            />
          </View>
        </ScrollView>
      )}
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  modeChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  modeChipActive: { backgroundColor: colors.primary },
  modeChipText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.textMuted },
  modeChipTextActive: { color: "#fff" },
  todayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  todayBtnText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.primaryDark },
  filterRow: { height: 46, marginTop: 12, marginBottom: 4, flexGrow: 0, flexShrink: 0 },
  filterRowContent: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.sansBold },
  filterChipTextActive: { color: "#fff" },
  dateBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  dateBannerText: { fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.text },
  clearText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.primary },
  list: { flex: 1, marginTop: 8 },
  listContent: { padding: 16, paddingTop: 4 },
  empty: { paddingVertical: 40, alignItems: "center" },
  emptyText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.sans },
  calendarScroll: { flex: 1 },
  calendarContent: { padding: 16, paddingTop: 12 },
  calendarCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dayScheduleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 18, marginBottom: 10 },
  dayScheduleTitle: { fontSize: 15, fontFamily: fonts.displayBold, color: colors.text },
  dayScheduleCount: { fontSize: 12, fontFamily: fonts.sans, color: colors.textMuted },
  dayScheduleCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
});
