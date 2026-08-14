import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { registerPushToken } from "@/api/pushTokens";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Push tokens don't work in the iOS Simulator / most emulators, and remote push
// is unsupported in Expo Go since SDK 53 (dev/prod builds only) — call this after
// login, but a missing token in either case is expected, not an error for the user.
export async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) return;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
    await registerPushToken(expoPushToken, Platform.OS === "ios" ? "IOS" : "ANDROID");
  } catch (err) {
    // Swallowed for the user, but logged for dev/debugging — e.g. missing EAS
    // projectId or running in Expo Go both throw here and are otherwise silent.
    console.warn("[push] registration failed:", err);
  }
}
