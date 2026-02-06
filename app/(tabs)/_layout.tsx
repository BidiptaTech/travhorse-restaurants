import { Tabs } from "expo-router";
import React from "react";

// Single-screen tabs layout with tab bar hidden.
// Keeps the route group `(tabs)` working but removes the bottom navbar.

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Scanner",
        }}
      />
    </Tabs>
  );
}

