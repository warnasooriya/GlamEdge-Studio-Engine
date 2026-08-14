import { Stack } from "expo-router";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { gradientHeaderScreenOptions } from "@/lib/navHeader";

export default function CustomersLayout() {
  return (
    <Stack screenOptions={gradientHeaderScreenOptions}>
      <Stack.Screen
        name="index"
        options={{ title: "Customers", headerLeft: () => <DrawerToggleButton tintColor="#fffaf5" pressOpacity={1} /> }}
      />
      <Stack.Screen name="[id]" options={{ title: "Customer" }} />
    </Stack>
  );
}
