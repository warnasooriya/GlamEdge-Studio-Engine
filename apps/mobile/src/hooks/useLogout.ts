import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { unregisterPushToken } from "@/api/pushTokens";
import { useAppDispatch } from "@/hooks/redux";
import { logout } from "@/store/authSlice";
import { disconnectSocket } from "@/lib/socket";

export function useLogout() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return async function handleLogout() {
    try {
      if (Device.isDevice) {
        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
        await unregisterPushToken(expoPushToken).catch(() => {});
      }
    } catch {
      // best-effort — logging out must not be blocked by push cleanup failing
    }
    disconnectSocket();
    queryClient.clear();
    dispatch(logout());
    router.replace("/(auth)/phone");
  };
}
