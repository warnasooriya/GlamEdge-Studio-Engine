import { useEffect, useState, useCallback } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Fraunces_500Medium, Fraunces_600SemiBold, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { store } from "@/store/store";
import { hydrate } from "@/store/authSlice";
import { loadSession } from "@/lib/secureStore";
import { queryClient } from "@/lib/queryClient";
import { colors } from "@/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

function Bootstrap({ children }: { children: React.ReactNode }) {
  const [sessionReady, setSessionReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    loadSession()
      .then(({ token, tenant }) => store.dispatch(hydrate({ token, tenant })))
      // SecureStore isn't available on web (only a real target on iOS/Android) —
      // degrade to logged-out rather than leaving an unhandled rejection.
      .catch(() => store.dispatch(hydrate({ token: null, tenant: null })))
      .finally(() => setSessionReady(true));
  }, []);

  const ready = sessionReady && fontsLoaded;

  const onLayout = useCallback(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} onLayout={onLayout}>
      {children}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <Bootstrap>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
              </Stack>
            </Bootstrap>
          </SafeAreaProvider>
        </QueryClientProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
