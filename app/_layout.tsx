import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useColorScheme } from "nativewind";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import "../global.css";
import { store } from "../store";
import { setCredentials, updateUser } from "../store/slices/authSlice";
import { getStoredProfileImage, loadAuth } from "../utils/authStorage";
import { getStoredTheme } from "../utils/themeStorage";

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
      .then(async (auth) => {
        if (auth?.token && auth?.user) {
          store.dispatch(setCredentials(auth));
          // If login didn't provide an image, use this user's stored profile image.
          if (!auth.user.image && auth.user.id) {
            const storedImage = await getStoredProfileImage(auth.user.id);
            if (storedImage) {
              store.dispatch(updateUser({ image: storedImage }));
            }
          }
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
            <Stack.Screen
              name="(auth-pages)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(screens)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          </Stack>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
