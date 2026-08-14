import { Stack } from "expo-router";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { gradientHeaderScreenOptions } from "@/lib/navHeader";

export default function AppointmentsLayout() {
  return (
    <Stack screenOptions={gradientHeaderScreenOptions}>
      <Stack.Screen
        name="index"
        options={{ title: "Bookings", headerLeft: () => <DrawerToggleButton tintColor="#fffaf5" pressOpacity={1} /> }}
      />
      <Stack.Screen name="[id]" options={{ title: "Appointment" }} />
    </Stack>
  );
}
