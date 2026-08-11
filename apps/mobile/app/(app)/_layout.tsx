import { useEffect } from "react";
import { Drawer } from "expo-router/drawer";
import { Redirect } from "expo-router";
import { useAppSelector } from "@/hooks/redux";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { gradientHeaderScreenOptions } from "@/lib/navHeader";
import { CustomDrawerContent } from "@/components/CustomDrawerContent";
import { HeaderBrand } from "@/components/HeaderBrand";

export default function AppLayout() {
  const token = useAppSelector((s) => s.auth.token);
  const tenant = useAppSelector((s) => s.auth.tenant);

  useEffect(() => {
    if (!tenant?.id) return;
    connectSocket(tenant.id);
    return () => disconnectSocket();
  }, [tenant?.id]);

  if (!token || tenant?.status !== "APPROVED") {
    return <Redirect href="/(auth)/phone" />;
  }

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        ...gradientHeaderScreenOptions,
        drawerType: "front",
      }}
    >
      <Drawer.Screen
        name="index"
        options={{ headerTitle: () => <HeaderBrand title={tenant?.salonName || "Overview"} subtitle="GlamEdge Owner" /> }}
      />
      <Drawer.Screen name="analytics" options={{ title: "Analytics" }} />
      <Drawer.Screen name="reports" options={{ title: "Reports" }} />
      <Drawer.Screen name="appointments" options={{ title: "Bookings", headerShown: false }} />
      <Drawer.Screen name="customers" options={{ title: "Customers", headerShown: false }} />
      <Drawer.Screen name="reviews" options={{ title: "Reviews" }} />
      <Drawer.Screen name="services" options={{ title: "Services" }} />
      <Drawer.Screen name="staff" options={{ title: "Staff" }} />
      <Drawer.Screen name="feed" options={{ title: "Showcase Feed" }} />
      <Drawer.Screen name="pos" options={{ title: "POS Billing" }} />
      <Drawer.Screen name="notifications" options={{ title: "Alert" }} />
      <Drawer.Screen name="settings" options={{ title: "Profile" }} />
    </Drawer>
  );
}
