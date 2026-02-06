import React from "react";
import { Stack } from "expo-router";
import "react-native-reanimated";
import "../global.css";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useColorScheme } from "nativewind";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();

  React.useEffect(() => {
    setColorScheme("light");
    SystemUI.setBackgroundColorAsync("white");
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
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
  );
}
