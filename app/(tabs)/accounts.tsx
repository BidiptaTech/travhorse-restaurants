import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { AUTH_LOGOUT_ENDPOINT, signOut } from "../../store/slices/authSlice";
import { clearAuth, loadAuth } from "../../utils/authStorage";
import { setStoredTheme } from "../../utils/themeStorage";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface MenuItem {
  id: string;
  icon: IoniconsName;
  label: string;
  color?: string;
  section: "general" | "preferences" | "account";
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "history",
    icon: "time-outline",
    label: "Scan History",
    section: "general",
  },
  {
    id: "share",
    icon: "share-social-outline",
    label: "Share App",
    section: "general",
  },
  {
    id: "appearance",
    icon: "contrast-outline",
    label: "Appearance",
    section: "preferences",
  },
  {
    id: "delete-account",
    icon: "trash-outline",
    label: "Delete Account",
    color: "#ef4444",
    section: "account",
  },
  {
    id: "sign-out",
    icon: "log-out-outline",
    label: "Sign Out",
    color: "#ef4444",
    section: "account",
  },
];

const SECTIONS: { key: MenuItem["section"]; label: string }[] = [
  { key: "general", label: "General" },
  { key: "preferences", label: "Preferences" },
  { key: "account", label: "Account" },
];

export default function AccountsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [dmcModalVisible, setDmcModalVisible] = useState(false);

  const bg = isDark ? "#000000" : "#ffffff";
  const headerBg = isDark ? "#18191C" : "#f8fafc";
  const cardBg = isDark ? "#15161B" : "#f1f5f9";
  const textPrimary = isDark ? "#ffffff" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const modalBg = isDark ? "#18191C" : "#ffffff";
  const modalBorder = isDark ? "#2A2B30" : "#e2e7eb";
  const rowBg = isDark ? "#1D1F24" : "#f8fafc";
  const primary = "#613BFF";
  const divider = isDark ? "#2A2B30" : "#e5e7eb";

  const setTheme = useCallback(
    (theme: "light" | "dark") => {
      setColorScheme(theme);
      setStoredTheme(theme);
      setThemeModalVisible(false);
    },
    [setColorScheme],
  );

  const onConfirmSignOut = useCallback(async () => {
    setSignOutVisible(false);
    const auth = await loadAuth();
    const token = auth?.token ?? null;
    if (token) {
      try {
        await fetch(AUTH_LOGOUT_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Still sign out locally
      }
    }
    dispatch(signOut());
    clearAuth().catch(() => {});
    router.replace("/(auth-pages)/SignIn");
  }, [dispatch]);

  const onMenuItem = useCallback((id: string) => {
    switch (id) {
      case "history":
        router.push("/(tabs)/history" as any);
        break;
      case "share":
        Share.share({
          message:
            "Check out this restaurant ticket checker app I'm using to scan and validate tickets.",
        }).catch(() => {});
        break;
      case "appearance":
        setThemeModalVisible(true);
        break;
      case "delete-account":
        setDeleteAccountVisible(true);
        break;
      case "sign-out":
        setSignOutVisible(true);
        break;
    }
  }, []);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: bg }}>
      {/* Header */}
      <View
        className="px-4 py-3 flex-row items-center"
        style={{ backgroundColor: headerBg }}
      >
        <Text className="text-lg font-semibold" style={{ color: textPrimary }}>
          Accounts
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <TouchableOpacity
          onPress={() => setDmcModalVisible(true)}
          activeOpacity={0.7}
          className="mx-4 mt-4 flex-row items-center p-4"
          style={{
            backgroundColor: cardBg,
            borderRadius: 16,
          }}
        >
          <View
            className="w-14 h-14 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: isDark ? "#2A2B30" : "#e5e7eb" }}
          >
            <Ionicons
              name="person"
              size={28}
              color={isDark ? "#ffffff" : "#6b7280"}
            />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-bold"
              style={{ color: textPrimary }}
              numberOfLines={1}
            >
              {user?.name || "Restaurant"}
            </Text>
            <Text
              className="text-sm mt-0.5"
              style={{ color: textSecondary }}
              numberOfLines={1}
            >
              {user?.email || "—"}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text
                className="text-xs"
                style={{ color: primary }}
              >
                View DMC accounts
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={textSecondary} />
        </TouchableOpacity>

        {/* Menu sections */}
        {SECTIONS.map((section) => {
          const items = MENU_ITEMS.filter((m) => m.section === section.key);
          if (items.length === 0) return null;
          return (
            <View key={section.key} className="mt-6 mx-4">
              <Text
                className="text-xs font-semibold uppercase tracking-wide mb-2 px-1"
                style={{ color: textSecondary }}
              >
                {section.label}
              </Text>
              <View
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                {items.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => onMenuItem(item.id)}
                    activeOpacity={0.7}
                    className="flex-row items-center px-4"
                    style={{
                      minHeight: 52,
                      borderBottomWidth: idx < items.length - 1 ? 1 : 0,
                      borderBottomColor: divider,
                    }}
                  >
                    <View
                      className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                      style={{
                        backgroundColor: item.color
                          ? `${item.color}18`
                          : isDark
                            ? "#2A2B30"
                            : "#e5e7eb",
                      }}
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={item.color || (isDark ? "#ffffff" : "#374151")}
                      />
                    </View>
                    <Text
                      className="flex-1 text-sm font-medium"
                      style={{ color: item.color || textPrimary }}
                    >
                      {item.label}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={item.color || textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* DMC Accounts modal */}
      <Modal
        visible={dmcModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDmcModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDmcModalVisible(false)}
          />
          <View
            style={[
              styles.modalCard,
              { backgroundColor: modalBg, borderColor: modalBorder },
            ]}
          >
            <View
              className="px-4 pt-5 pb-3 flex-row items-center justify-between"
              style={{
                borderBottomWidth: 1,
                borderBottomColor: divider,
              }}
            >
              <Text
                className="text-lg font-bold"
                style={{ color: textPrimary }}
              >
                DMC Accounts
              </Text>
              <TouchableOpacity
                onPress={() => setDmcModalVisible(false)}
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: isDark ? "#2A2B30" : "#e5e7eb" }}
              >
                <Ionicons name="close" size={20} color={textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ maxHeight: 360 }}
              contentContainerStyle={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {user?.dmcUsers?.length ? (
                user.dmcUsers.map((dmcUser, index) => (
                  <View
                    key={dmcUser.id}
                    className="mb-3 p-4 rounded-xl"
                    style={{ backgroundColor: rowBg }}
                  >
                    <Text
                      className="text-xs font-semibold mb-2"
                      style={{ color: "#F4C430" }}
                    >
                      {index + 1}. {dmcUser.dmc}
                    </Text>
                    <View className="flex-row items-center">
                      <View
                        className="w-9 h-9 rounded-full items-center justify-center mr-3"
                        style={{
                          backgroundColor: isDark ? "#2A2B30" : "#e5e7eb",
                        }}
                      >
                        <Ionicons
                          name="person"
                          size={16}
                          color={textPrimary}
                        />
                      </View>
                      <View>
                        <Text
                          className="text-sm font-medium"
                          style={{ color: textPrimary }}
                        >
                          {dmcUser.name}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{ color: textSecondary }}
                        >
                          {dmcUser.email}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View className="items-center py-8">
                  <Ionicons
                    name="people-outline"
                    size={32}
                    color={textSecondary}
                  />
                  <Text
                    className="text-sm mt-2"
                    style={{ color: textSecondary }}
                  >
                    No DMC accounts available
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Appearance modal */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setThemeModalVisible(false)}
          />
          <View
            style={[
              styles.modalCard,
              { backgroundColor: modalBg, borderColor: modalBorder },
            ]}
          >
            <View
              className="px-4 py-3"
              style={{
                borderBottomWidth: 1,
                borderBottomColor: divider,
              }}
            >
              <Text
                className="text-lg font-semibold"
                style={{ color: textPrimary }}
              >
                Appearance
              </Text>
              <Text className="text-sm mt-0.5" style={{ color: textSecondary }}>
                Choose light or dark mode
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setTheme("light")}
              className="flex-row items-center px-4 py-4"
              style={{
                borderBottomWidth: 1,
                borderBottomColor: divider,
              }}
              activeOpacity={0.7}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: isDark ? "#2A2B30" : "#e5e7eb" }}
              >
                <Ionicons name="sunny-outline" size={22} color={textPrimary} />
              </View>
              <Text
                className="text-base font-medium flex-1"
                style={{ color: textPrimary }}
              >
                Light mode
              </Text>
              {colorScheme === "light" && (
                <Ionicons name="checkmark-circle" size={24} color={primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTheme("dark")}
              className="flex-row items-center px-4 py-4"
              activeOpacity={0.7}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: isDark ? "#2A2B30" : "#e5e7eb" }}
              >
                <Ionicons name="moon-outline" size={22} color={textPrimary} />
              </View>
              <Text
                className="text-base font-medium flex-1"
                style={{ color: textPrimary }}
              >
                Dark mode
              </Text>
              {colorScheme === "dark" && (
                <Ionicons name="checkmark-circle" size={24} color={primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete account modal */}
      <Modal
        visible={deleteAccountVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteAccountVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDeleteAccountVisible(false)}
          />
          <View
            style={[
              styles.modalCard,
              { backgroundColor: modalBg, borderColor: modalBorder },
            ]}
          >
            <View className="items-center pt-4 pb-2 px-4">
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(248, 113, 113, 0.2)" }}
              >
                <Ionicons name="trash-outline" size={32} color="#ef4444" />
              </View>
              <Text
                className="text-lg font-bold mb-1 text-center"
                style={{ color: textPrimary }}
              >
                Delete account
              </Text>
              <Text
                className="text-sm text-center mb-4"
                style={{ color: textSecondary }}
              >
                To delete your account, send an email to{" "}
                <Text className="font-semibold" style={{ color: textPrimary }}>
                  travcadmin@travclicks.com
                </Text>
                . Your account will be deleted within 72 hours.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const subject = encodeURIComponent(
                    "Account Deletion Request - Travhorse Restaurants",
                  );
                  const body = encodeURIComponent(
                    "Hello Travhorse Support Team,\n\n" +
                      "I would like to request the permanent deletion of my restaurant account from the Travhorse Restaurants app.\n\n" +
                      "Email: " +
                      (user?.email ?? "") +
                      "\n" +
                      "Restaurant ID: " +
                      (user?.id ?? "") +
                      "\n" +
                      "Restaurant Name: " +
                      (user?.name ?? "") +
                      "\n\n" +
                      "Please confirm once the account has been deleted.\n\n" +
                      "Thank you.",
                  );
                  Linking.openURL(
                    `mailto:travcadmin@travclicks.com?subject=${subject}&body=${body}`,
                  );
                }}
                className="w-full flex-row items-center justify-center rounded-xl py-3.5 px-4 mb-3"
                style={{ backgroundColor: primary }}
                activeOpacity={0.8}
              >
                <Ionicons name="mail" size={20} color="#ffffff" />
                <Text className="text-base font-semibold text-white ml-2">
                  Send email
                </Text>
              </TouchableOpacity>
            </View>
            <View className="px-4 pb-4">
              <TouchableOpacity
                onPress={() => setDeleteAccountVisible(false)}
                className="rounded-xl py-3.5 items-center justify-center"
                style={{ backgroundColor: isDark ? "#2A2B30" : "#e2e8f0" }}
                activeOpacity={0.8}
              >
                <Text
                  className="text-base font-semibold"
                  style={{ color: textPrimary }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sign out modal */}
      <Modal
        visible={signOutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSignOutVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSignOutVisible(false)}
          />
          <View
            style={[
              styles.modalCard,
              { backgroundColor: modalBg, borderColor: modalBorder },
            ]}
          >
            <View className="items-center pt-3 pb-4 px-4">
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(248, 113, 113, 0.18)" }}
              >
                <Ionicons name="log-out-outline" size={32} color="#f87171" />
              </View>
              <Text
                className="text-lg font-bold mb-1 text-center"
                style={{ color: textPrimary }}
              >
                Sign out?
              </Text>
              <Text
                className="text-sm text-center"
                style={{ color: textSecondary }}
              >
                You'll be returned to the sign-in screen. You can log back in at
                any time.
              </Text>
            </View>
            <View className="flex-row px-4 pb-4" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => setSignOutVisible(false)}
                className="flex-1 rounded-xl py-3.5 items-center justify-center"
                style={{ backgroundColor: isDark ? "#2A2B30" : "#e2e8f0" }}
                activeOpacity={0.8}
              >
                <Text
                  className="text-base font-semibold"
                  style={{ color: textPrimary }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onConfirmSignOut}
                className="flex-1 rounded-xl py-3.5 items-center justify-center"
                style={{ backgroundColor: primary }}
                activeOpacity={0.8}
              >
                <Text className="text-base font-semibold text-white">
                  Sign out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
});
