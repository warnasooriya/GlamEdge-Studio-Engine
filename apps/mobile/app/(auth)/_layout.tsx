import { Redirect, Stack } from "expo-router";
import { useAppSelector } from "@/hooks/redux";

export default function AuthLayout() {
  const token = useAppSelector((s) => s.auth.token);
  const tenant = useAppSelector((s) => s.auth.tenant);

  if (token && tenant?.status === "APPROVED") {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="pending-approval" />
    </Stack>
  );
}
