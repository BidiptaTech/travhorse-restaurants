import React from "react";
import { Stack } from "expo-router";
import "react-native-reanimated";
import "../global.css";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useColorScheme } from "nativewind";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider } from "react-redux";
import { store } from "../store";
import { getStoredTheme } from "../utils/themeStorage";
import { loadAuth } from "../utils/authStorage";
import { setCredentials } from "../store/slices/authSlice";

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [authLoaded, setAuthLoaded] = React.useState(false);

  // Default: light. Restore saved theme (light or dark) when app loads.
  React.useEffect(() => {
    getStoredTheme().then((theme) => setColorScheme(theme));
  }, [setColorScheme]);

  // Restore saved login so user remains signed in until logout.
  React.useEffect(() => {
    loadAuth()
      .then((auth) => {
        if (auth?.token && auth?.user) {
          store.dispatch(setCredentials(auth));
        }
      })
      .finally(() => {
        setAuthLoaded(true);
      });
  }, []);

  React.useEffect(() => {
    if (colorScheme === "dark") {
      SystemUI.setBackgroundColorAsync("#121317");
    } else {
      SystemUI.setBackgroundColorAsync("#ffffff");
    }
  }, [colorScheme]);

  if (!authLoaded) {
    // Avoid rendering navigation until auth state is restored
    // to prevent a brief flash of the onboarding screen.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <StatusBar
            style={colorScheme === "dark" ? "light" : "dark"}
            translucent
            backgroundColor="transparent"
          />
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: "transparent" },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth-pages)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(screens)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          </Stack>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
