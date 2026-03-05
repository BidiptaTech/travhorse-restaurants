import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useState } from "react";
import {
    ImageBackground,
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

// DMC list: show ~5 cards visible, then scroll with scrollbar for the rest
const DMC_CARD_APPROX_HEIGHT = 100;
const DMC_VISIBLE_CARDS = 5;
const DMC_LIST_MAX_HEIGHT = DMC_CARD_APPROX_HEIGHT * DMC_VISIBLE_CARDS;

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
  const destructiveRed = "#ef4444";
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: bg }} edges={["top"]}>
      {/* Purple wave header with profile inside */}
      <ImageBackground
        source={require("@/assets/images/top-bg-shape2.png")}
        style={s.headerBg}
        resizeMode="stretch"
      >
        {/* Top row: back chevron + title left-aligned */}
        <View style={s.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={26} color="#ffffff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Account</Text>
        </View>
        {/* Avatar + name + email centered on purple */}
        <TouchableOpacity
          onPress={() => setDmcModalVisible(true)}
          activeOpacity={0.8}
          style={s.profileSection}
        >
          <View
            style={[
              s.avatarCircle,
              { backgroundColor: isDark ? "#3a3a5c" : "#b0d4f1" },
            ]}
          >
            <Ionicons
              name="person"
              size={52}
              color={isDark ? "#c0c0c0" : "#ffffff"}
            />
          </View>
          <Text style={s.profileName} numberOfLines={1}>
            {user?.name || "Restaurant"}
          </Text>
          <Text style={s.profileEmail} numberOfLines={1}>
            {user?.email || "—"}
          </Text>
        </TouchableOpacity>
      </ImageBackground>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* DMC count */}
        <TouchableOpacity
          onPress={() => setDmcModalVisible(true)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginHorizontal: 16,
            marginTop: 16,
            padding: 16,
            backgroundColor: cardBg,
            borderRadius: 16,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: isDark ? "#2A2B30" : "#e5e7eb",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Ionicons
              name="people-outline"
              size={22}
              color={isDark ? "#ffffff" : "#374151"}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: textPrimary,
              }}
            >
              DMC Accounts
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: textSecondary,
                marginTop: 2,
              }}
            >
              {user?.dmcUsers?.length ?? 0} DMC
              {(user?.dmcUsers?.length ?? 0) !== 1 ? "s" : ""} linked
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={textSecondary} />
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
                {items.map((item, idx) => {
                  const isDestructive = Boolean(item.color);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => onMenuItem(item.id)}
                      activeOpacity={0.7}
                      style={[
                        s.menuRow,
                        {
                          borderBottomWidth: idx < items.length - 1 ? 1 : 0,
                          borderBottomColor: divider,
                        },
                      ]}
                    >
                      <View
                        style={[
                          s.menuRowIconWrap,
                          {
                            backgroundColor: isDestructive
                              ? (isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.12)")
                              : isDark
                                ? "#2A2B30"
                                : "#e5e7eb",
                          },
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={22}
                          color={isDestructive ? destructiveRed : (isDark ? "#ffffff" : "#374151")}
                        />
                      </View>
                      <Text
                        style={[
                          s.menuRowLabel,
                          {
                            color: isDestructive ? destructiveRed : textPrimary,
                            fontWeight: isDestructive ? "600" : "500",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={isDestructive ? destructiveRed : textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
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
              s.dmcModalCard,
              { backgroundColor: modalBg, borderColor: modalBorder },
            ]}
          >
            {/* Header */}
            <View
              style={[
                s.dmcModalHeader,
                { borderBottomColor: divider },
              ]}
            >
              <View>
                <Text style={[s.dmcModalTitle, { color: textPrimary }]}>
                  DMC Accounts
                </Text>
                <Text style={[s.dmcModalSubtitle, { color: textSecondary }]}>
                  {user?.dmcUsers?.length
                    ? `${user.dmcUsers.length} linked account${user.dmcUsers.length !== 1 ? "s" : ""}`
                    : "No accounts linked"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDmcModalVisible(false)}
                style={[s.dmcModalCloseBtn, { backgroundColor: rowBg }]}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={22} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {/* List – fixed max height so many DMCs scroll with scrollbar */}
            <ScrollView
              style={[s.dmcModalScroll, { maxHeight: DMC_LIST_MAX_HEIGHT }]}
              contentContainerStyle={s.dmcModalScrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {user?.dmcUsers?.length ? (
                user.dmcUsers.map((dmcUser, index) => (
                  <View
                    key={dmcUser.id}
                    style={[s.dmcCard, { backgroundColor: rowBg }]}
                  >
                    <View style={s.dmcCardHeader}>
                      <View
                        style={[
                          s.dmcCardNumber,
                          {
                            backgroundColor: isDark
                              ? "rgba(244, 196, 48, 0.2)"
                              : "rgba(244, 196, 48, 0.25)",
                          },
                        ]}
                      >
                        <Text
                          style={s.dmcCardNumberText}
                          numberOfLines={1}
                        >
                          {index + 1}
                        </Text>
                      </View>
                      <Text
                        style={[s.dmcCardCompany, { color: textPrimary }]}
                        numberOfLines={2}
                      >
                        {dmcUser.dmc}
                      </Text>
                    </View>
                    <View style={s.dmcCardUser}>
                      <View
                        style={[
                          s.dmcCardAvatar,
                          {
                            backgroundColor: isDark ? "#2A2B30" : "#e5e7eb",
                          },
                        ]}
                      >
                        <Ionicons
                          name="person"
                          size={20}
                          color={textPrimary}
                        />
                      </View>
                      <View style={s.dmcCardUserInfo}>
                        <Text
                          style={[s.dmcCardUserName, { color: textPrimary }]}
                          numberOfLines={1}
                        >
                          {dmcUser.name}
                        </Text>
                        <Text
                          style={[s.dmcCardUserEmail, { color: textSecondary }]}
                          numberOfLines={1}
                        >
                          {dmcUser.email}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={s.dmcEmptyState}>
                  <View
                    style={[
                      s.dmcEmptyIconWrap,
                      { backgroundColor: rowBg },
                    ]}
                  >
                    <Ionicons
                      name="people-outline"
                      size={40}
                      color={textSecondary}
                    />
                  </View>
                  <Text
                    style={[s.dmcEmptyTitle, { color: textPrimary }]}
                  >
                    No DMC accounts
                  </Text>
                  <Text
                    style={[s.dmcEmptyMessage, { color: textSecondary }]}
                  >
                    Linked DMC accounts will appear here.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={[s.dmcModalFooter, { borderTopColor: divider }]}>
              <TouchableOpacity
                onPress={() => setDmcModalVisible(false)}
                style={[s.dmcModalCloseButton, { backgroundColor: primary }]}
                activeOpacity={0.8}
              >
                <Text style={s.dmcModalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
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

const s = StyleSheet.create({
  headerBg: {
    minHeight: 260,
    width: "100%",
    justifyContent: "flex-start",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
  },
  profileSection: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 24,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuRowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuRowLabel: {
    flex: 1,
    fontSize: 16,
  },
  // DMC modal
  dmcModalCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  dmcModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  dmcModalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  dmcModalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  dmcModalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dmcModalScroll: {
    maxHeight: 380,
  },
  dmcModalScrollContent: {
    padding: 16,
    paddingBottom: 8,
  },
  dmcCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  dmcCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dmcCardNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  dmcCardNumberText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B45309",
  },
  dmcCardCompany: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  dmcCardUser: {
    flexDirection: "row",
    alignItems: "center",
  },
  dmcCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dmcCardUserInfo: {
    flex: 1,
    minWidth: 0,
  },
  dmcCardUserName: {
    fontSize: 15,
    fontWeight: "600",
  },
  dmcCardUserEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  dmcEmptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  dmcEmptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  dmcEmptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  dmcEmptyMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  dmcModalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  dmcModalCloseButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dmcModalCloseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});

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
