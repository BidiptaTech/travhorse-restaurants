import { useAppSelector } from "@/store/hooks";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PRIMARY = "#6C3BF5";
const CIRCLE_SIZE = 56;
const TAB_BAR_HEIGHT = 52;

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface TabDef {
  route: string;
  icon: IoniconsName;
  activeIcon: IoniconsName;
  label: string;
}

const TABS: TabDef[] = [
  { route: "index", icon: "home-outline", activeIcon: "home", label: "Home" },
  {
    route: "ongoing",
    icon: "location-outline",
    activeIcon: "location",
    label: "Ongoing",
  },
  {
    route: "upcoming",
    icon: "briefcase-outline",
    activeIcon: "briefcase",
    label: "Upcoming",
  },
  {
    route: "accounts",
    icon: "person-outline",
    activeIcon: "person",
    label: "Accounts",
  },
];

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const totalHeight = CIRCLE_SIZE / 2 + TAB_BAR_HEIGHT + bottomPad;

  return (
    <View style={[styles.outer, { height: totalHeight }]}>
      {/* Purple bar – starts below the circle area */}
      <View
        style={[
          styles.purpleBar,
          {
            top: CIRCLE_SIZE / 2,
            paddingBottom: bottomPad,
          },
        ]}
      />
      {/* Tab row – full height so active circle can protrude */}
      <View style={[styles.tabRow, { paddingBottom: bottomPad }]}>
        {TABS.map((tab) => {
          const routeIndex = state.routes.findIndex(
            (r: any) => r.name === tab.route,
          );
          if (routeIndex < 0) return null;
          const focused = state.index === routeIndex;

          const onPress = () => {
            const ev = navigation.emit({
              type: "tabPress",
              target: state.routes[routeIndex].key,
              canPreventDefault: true,
            });
            if (!focused && !ev.defaultPrevented) {
              navigation.navigate(tab.route);
            }
          };

          if (focused) {
            return (
              <TouchableOpacity
                key={tab.route}
                onPress={onPress}
                activeOpacity={0.9}
                style={styles.tabSlot}
              >
                {/* White circle protruding above the bar */}
                <View style={styles.activeCircle}>
                  <Ionicons
                    name={tab.activeIcon}
                    size={26}
                    color={PRIMARY}
                  />
                </View>
                <Text style={styles.activeLabel} numberOfLines={1}>
                  {tab.label}
                </Text>
                <View style={styles.activeDot} />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.route}
              onPress={onPress}
              activeOpacity={0.8}
              style={[styles.tabSlot, styles.inactiveSlot]}
            >
              <Ionicons
                name={tab.icon}
                size={26}
                color="rgba(255,255,255,0.85)"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth-pages)/SignIn");
    }
  }, [isAuthenticated, router]);

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="ongoing" />
      <Tabs.Screen name="upcoming" />
      <Tabs.Screen name="accounts" />
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: "100%",
  },
  purpleBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: PRIMARY,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  tabRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  tabSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 0,
  },
  inactiveSlot: {
    justifyContent: "center",
    paddingTop: CIRCLE_SIZE / 2,
  },
  activeCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ffffff",
  },
});
