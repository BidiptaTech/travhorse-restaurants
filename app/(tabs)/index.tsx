import React, { useState, useCallback, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Pressable,
  Share,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { Swipeable } from "react-native-gesture-handler";
import { setStoredTheme } from "../../utils/themeStorage";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { signOut, AUTH_LOGOUT_ENDPOINT, AUTH_LOGIN_ENDPOINT } from "../../store/slices/authSlice";
import { clearAuth } from "../../utils/authStorage";
import FormField from "../../components/inputFields/FormField";
import { apiUrl } from "../../constants/api";
import {
  getTodayScans,
  addTodayScan,
  deleteTodayScan,
  type TodayScanItem,
} from "../../utils/todayScansStorage";
import { addHistoryScan } from "../../utils/scanHistoryStorage";
import {
  parseScannedTicket,
  formatTicketDisplay,
} from "../../utils/ticketDisplay";

const MENU_FEATURES = [
  { id: "ongoing", icon: "time-outline", label: "Ongoing" },
  { id: "upcoming", icon: "calendar-outline", label: "Upcoming" },
  { id: "support", icon: "help-circle-outline", label: "Customer support" },
  { id: "share", icon: "share-social-outline", label: "Share app" },
  { id: "appearance", icon: "contrast-outline", label: "Appearance" },
  { id: "delete-account", icon: "trash-outline", label: "Delete account" },
  { id: "sign-out", icon: "log-out-outline", label: "Sign out" },
] as const;

export default function TicketScannerHome() {
  const [scanVisible, setScanVisible] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanResultVisible, setScanResultVisible] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [invalidTicketVisible, setInvalidTicketVisible] = useState(false);
  const [redeemInfoVisible, setRedeemInfoVisible] = useState(false);
  const [redeemInfoMessage, setRedeemInfoMessage] = useState<string | null>(null);
  const [lastRedeemedCode, setLastRedeemedCode] = useState<string | null>(null);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [deleteAccountPasswordError, setDeleteAccountPasswordError] = useState("");
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [deleteScanVisible, setDeleteScanVisible] = useState(false);
  const [scanToDelete, setScanToDelete] = useState<
    (TodayScanItem & { isHistory?: false }) | { isHistory: true; timestamp: number }
    | null
  >(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [todayScans, setTodayScans] = useState<TodayScanItem[]>([]);
  const { colorScheme, setColorScheme } = useColorScheme();
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((s) => s.auth);
  const openTodaySwipeRef = useRef<Swipeable | null>(null);

  const userId = user?.id ?? "";

  useEffect(() => {
    if (userId) {
      getTodayScans(userId).then(setTodayScans);
    } else {
      setTodayScans([]);
    }
  }, [userId]);

  const onMenuFeature = useCallback((id: string) => {
    setMenuOpen(false);
    if (id === "sign-out") {
      setSignOutVisible(true);
      return;
    }
    if (id === "appearance") {
      setThemeModalVisible(true);
      return;
    }
    if (id === "ongoing") {
      router.push("/(tabs)/ongoing" as any);
      return;
    }
    if (id === "upcoming") {
      router.push("/(tabs)/upcoming" as any);
      return;
    }
    if (id === "delete-account") {
      setDeleteAccountVisible(true);
      return;
    }
    if (id === "support") {
      Alert.alert(
        "Customer support",
        "For help with ticket scanning or check-ins, contact:\n\nEmail: support@travhorserestaurants.com\nPhone: +1 (000) 000-0000",
        [{ text: "OK" }]
      );
      return;
    }
    if (id === "share") {
      Share.share({
        message:
          "Check out this restaurant ticket checker app I’m using to scan and validate tickets.",
      }).catch(() => {});
      return;
    }
    // Placeholder actions for Ongoing / Upcoming
    Alert.alert("Coming soon", `${id} section is not ready yet.`, [
      { text: "OK" },
    ]);
  }, []);

  const setTheme = useCallback((theme: "light" | "dark") => {
    setColorScheme(theme);
    setStoredTheme(theme);
    setThemeModalVisible(false);
  }, [setColorScheme]);

  const openScanner = useCallback(async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          "Camera access",
          "Camera permission is required to scan tickets."
        );
        return;
      }
    }
    setLastScanned(null);
    setScanVisible(true);
  }, [permission?.granted, requestPermission]);

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      const code = data?.trim() ?? "";
      const uid = user?.id ?? "";

      if (!code) {
        return;
      }

      // If this exact code was just redeemed successfully, show info modal and close camera
      if (lastRedeemedCode && code === lastRedeemedCode) {
        setScanVisible(false);
        setScannedData(null);
        setScanResultVisible(false);
        setRedeemInfoVisible(true);
        return;
      }

      // If QR payload contains a restaurant ID, ensure it matches the logged-in restaurant
      const ticket = parseScannedTicket(code);
      if (ticket?.rid != null && uid) {
        const scannedRestaurantId = String(ticket.rid);
        if (scannedRestaurantId !== uid) {
          // Show styled error modal and close camera
          setScanVisible(false);
          setScannedData(null);
          setScanResultVisible(false);
          setInvalidTicketVisible(true);
          return;
        }
      }

      setScanVisible(false);
      setScannedData(code);
      setScanResultVisible(true);
    },
    [user?.id, lastRedeemedCode]
  );

  const onConfirmScannedTicket = useCallback(async () => {
    const code = scannedData?.trim() ?? "";
    const uid = user?.id ?? "";

    if (!code || !uid) {
      return;
    }

    // If QR payload contains a restaurant ID, ensure it matches the logged-in restaurant
    const ticket = parseScannedTicket(code);
    if (ticket?.rid != null) {
      const scannedRestaurantId = String(ticket.rid);
      if (scannedRestaurantId !== uid) {
        Alert.alert(
          "Invalid ticket",
          "This ticket belongs to a different restaurant account."
        );
        return;
      }
    }

    if (!ticket || ticket.bid == null) {
      Alert.alert("Invalid ticket", "Booking ID is missing from this ticket.");
      return;
    }

    if (!token) {
      Alert.alert("Error", "Authentication token not found.");
      return;
    }

    try {
      const redeemEndpoint = apiUrl("redeem-voucher-code");
      const res = await fetch(redeemEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurant_id: uid,
          order_id: ticket.bid,
        }),
      });

      const data = await res.json().catch(() => ({}));
      console.log("[Redeem] response", { status: res.status, data });

      if (!res.ok || data?.success === false) {
        const message =
          data?.message || data?.error || `Failed to redeem ticket (${res.status})`;
        Alert.alert("Redeem failed", message);
        return;
      }

      // Only store scan locally if redeem succeeded
      addTodayScan(uid, code).then(() => getTodayScans(uid).then(setTodayScans));
      addHistoryScan(uid, code); // Also save to persistent history

      // Remember this code and show success info for any immediate rescan
      setLastRedeemedCode(code);
      setRedeemInfoMessage(
        typeof data?.message === "string" && data.message.length > 0
          ? data.message
          : "Voucher redeemed successfully"
      );

      setLastScanned(scannedData ?? null);
      setScanResultVisible(false);
      setScannedData(null);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    }
  }, [scannedData, user?.id, token]);

  const onDismissScanResult = useCallback(() => {
    setScanResultVisible(false);
    setScannedData(null);
  }, []);

  const onVerifyPassword = useCallback(async () => {
    if (!deleteAccountPassword.trim()) {
      setDeleteAccountPasswordError("Password is required");
      return;
    }

    if (!user?.email) {
      Alert.alert("Error", "User email not found");
      return;
    }

    setDeleteAccountPasswordError("");
    setDeleteAccountLoading(true);

    try {
      // Verify password by attempting login
      const res = await fetch(AUTH_LOGIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          password: deleteAccountPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        setDeleteAccountPasswordError("Incorrect password");
        setDeleteAccountLoading(false);
        return;
      }

      // Password is correct, show final confirmation
      setDeleteAccountLoading(false);
      setShowDeleteConfirmation(true);
    } catch (err) {
      setDeleteAccountPasswordError("Network error. Please try again.");
      setDeleteAccountLoading(false);
    }
  }, [deleteAccountPassword, user?.email]);

  const onConfirmDeleteAccount = useCallback(async () => {
    if (!token) {
      Alert.alert("Error", "Authentication token not found");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "Restaurant ID not found");
      return;
    }

    if (!deleteAccountPassword.trim()) {
      Alert.alert("Error", "Password is required");
      return;
    }

    setDeleteAccountLoading(true);

    try {
      const deleteEndpoint = apiUrl("delete-restaurant-account");
      const res = await fetch(deleteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurant_id: user.id,
          Password: deleteAccountPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      console.log("[Delete Account] response", { status: res.status, data });

      if (!res.ok) {
        const message = data?.message || data?.error || `Failed to delete account (${res.status})`;
        Alert.alert("Delete Failed", message);
        setDeleteAccountLoading(false);
        return;
      }

      // Account deleted successfully
      await clearAuth();
      dispatch(signOut());
      setDeleteAccountVisible(false);
      setDeleteAccountPassword("");
      setDeleteAccountPasswordError("");
      setShowDeleteConfirmation(false);
      setDeleteAccountLoading(false);
      router.replace("/(auth-pages)/SignIn");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Network error. Please try again.");
      setDeleteAccountLoading(false);
    }
  }, [token, user?.id, deleteAccountPassword, dispatch]);

  const onDismissDeleteAccount = useCallback(() => {
    setDeleteAccountVisible(false);
    setDeleteAccountPassword("");
    setDeleteAccountPasswordError("");
    setDeleteAccountLoading(false);
    setShowDeleteConfirmation(false);
  }, []);

  const onConfirmSignOut = useCallback(async () => {
    setSignOutVisible(false);

    if (token) {
      try {
        const res = await fetch(AUTH_LOGOUT_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json().catch(() => ({}));
        console.log("[Logout] response", { status: res.status, data });
      } catch (err) {
        console.log("[Logout] error", err);
        // Still sign out locally if logout API fails
      }
    }

    dispatch(signOut());
    clearAuth().catch(() => {});
    router.replace("/(auth-pages)/SignIn");
  }, [dispatch, token]);

  const onDismissSignOut = useCallback(() => {
    setSignOutVisible(false);
  }, []);

  const onConfirmDeleteScan = useCallback(async () => {
    if (!scanToDelete) return;
    const uid = user?.id ?? "";
    if (scanToDelete.isHistory && "timestamp" in scanToDelete) {
      const { deleteHistoryScan } = await import("../../utils/scanHistoryStorage");
      await deleteHistoryScan(uid, scanToDelete.timestamp);
    } else {
      await deleteTodayScan(uid, scanToDelete as TodayScanItem);
      getTodayScans(uid).then(setTodayScans);
    }
    setDeleteScanVisible(false);
    setScanToDelete(null);
  }, [scanToDelete, user?.id]);

  const onDismissDeleteScan = useCallback(() => {
    setDeleteScanVisible(false);
    setScanToDelete(null);
  }, []);

  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#ffffff" : "#1f2937";
  const headerBg = isDark ? "#18191C" : "#f8fafc";
  const contentBg = isDark ? "#121317" : "#ffffff";
  const cardBg = isDark ? "#1D1F24" : "#f1f5f9";
  const cardBgAlt = isDark ? "#15161B" : "#e2e8f0";
  const qrPlaceholderBg = isDark ? "#0E1014" : "#cbd5e1";
  const borderColor = isDark ? "#2A2B30" : "#e2e8f0";
  const textPrimary = isDark ? "#ffffff" : "#1e293b";
  const textSecondary = isDark ? "#9ca3af" : "#64748b";

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: isDark ? "#000000" : "#ffffff" }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          className="px-4 pt-4 pb-3 flex-row items-center justify-between"
          style={{ backgroundColor: headerBg }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              className="mr-3"
              onPress={() => setMenuOpen(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={24} color={iconColor} />
            </TouchableOpacity>
            <Text
              className="text-xl font-semibold"
              style={{ color: textPrimary }}
            >
              Ticket Scanner
            </Text>
          </View>
          <TouchableOpacity
              onPress={() => router.push("/(tabs)/history")}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? "#2A2B30" : "#e2e8f0" }}
            >
              <Ionicons name="time-outline" size={20} color={iconColor} />
            </TouchableOpacity>
        </View>

        <View className="px-4 pt-4 flex-1" style={{ backgroundColor: contentBg }}>
          {/* Event banner */}
          <View className="rounded-lg bg-[#7A1D23] px-4 py-3 mb-4">
            <Text className="text-xs text-white opacity-80 mb-1">
              Restaurant
            </Text>
            <Text className="text-white text-base font-semibold">
              {user?.name || "Wine Tasting Night"}
            </Text>
          </View>

          {/* Stats row */}
          {/* <View className="flex-row mb-4">
            <View
              className="flex-1 mr-2 rounded-lg px-4 py-3"
              style={{ backgroundColor: cardBg }}
            >
              <Text className="text-xs mb-1" style={{ color: textSecondary }}>
                Tickets Scanned
              </Text>
              <Text className="text-base font-semibold" style={{ color: textPrimary }}>
                128 <Text className="text-sm" style={{ color: textSecondary }}>/ 200</Text>
              </Text>
            </View>
            <View
              className="w-20 rounded-lg px-3 py-3 items-center justify-center"
              style={{ backgroundColor: cardBg }}
            >
              <Text className="text-xs mb-1" style={{ color: textSecondary }}>Pending</Text>
              <Text className="text-xl font-semibold" style={{ color: textPrimary }}>14</Text>
            </View>
          </View> */}

          {/* QR preview card */}
          <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: cardBgAlt }}>
            <TouchableOpacity
              onPress={openScanner}
              activeOpacity={0.8}
              style={[styles.qrPlaceholder, { backgroundColor: qrPlaceholderBg, borderColor: isDark ? "#2A2C33" : "#cbd5e1" }]}
              className="items-center justify-center rounded-lg"
            >
              <Ionicons name="qr-code" size={96} color={iconColor} />
              {lastScanned ? (
                <Text
                  className="absolute bottom-3 left-3 right-3 text-center text-green-600 text-xs"
                  numberOfLines={2}
                >
                  Last: {lastScanned}
                </Text>
              ) : null}
            </TouchableOpacity>
            <Text className="mt-3 text-center text-xs" style={{ color: textSecondary }}>
              SCAN QR CODE
            </Text>
          </View>

          {/* Scan button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={openScanner}
            className="flex-row items-center justify-center bg-[#D62828] rounded-lg py-3 mb-4"
          >
            <Ionicons name="camera" size={18} color="#ffffff" />
            <Text className="text-white text-base font-semibold ml-2">
              Scan Ticket
            </Text>
          </TouchableOpacity>

          {/* QR Scanner modal */}
          <Modal
            visible={scanVisible}
            animationType="slide"
            onRequestClose={() => setScanVisible(false)}
          >
            <View className="flex-1 bg-black">
              {permission?.granted === false ? (
                <View className="flex-1 items-center justify-center p-6">
                  <Text className="text-white text-center mb-4">
                    Camera permission is required to scan tickets.
                  </Text>
                  <TouchableOpacity
                    onPress={requestPermission}
                    className="bg-[#D62828] rounded-lg px-6 py-3"
                  >
                    <Text className="text-white font-semibold">
                      Grant permission
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setScanVisible(false)}
                    className="mt-4"
                  >
                    <Text className="text-gray-400">Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <SafeAreaView className="flex-1" edges={["top"]}>
                    <View className="flex-row items-center justify-between px-4 py-3 bg-black/80">
                      <Text className="text-white text-lg font-semibold">
                        Scan ticket QR code
                      </Text>
                      <TouchableOpacity
                        onPress={() => setScanVisible(false)}
                        className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
                      >
                        <Ionicons name="close" size={24} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                    <View className="flex-1 overflow-hidden">
                      <CameraView
                        style={StyleSheet.absoluteFill}
                        facing="back"
                        barcodeScannerSettings={{
                          barcodeTypes: ["qr"],
                        }}
                        onBarcodeScanned={onBarcodeScanned}
                      />
                      <View
                        style={styles.scanOverlay}
                        pointerEvents="none"
                      />
                    </View>
                  </SafeAreaView>
                </>
              )}
            </View>
          </Modal>

          {/* Scan result modal – shown after QR scan, with Confirm (API later) */}
          <Modal
            visible={scanResultVisible}
            transparent
            animationType="fade"
            onRequestClose={onDismissScanResult}
          >
            <View style={styles.resultModalBackdrop}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={onDismissScanResult}
              />
              <View
                style={[
                  styles.resultModalCard,
                  {
                    backgroundColor: isDark ? "#18191C" : "#ffffff",
                    borderColor: isDark ? "#2A2B30" : "#e2e8f0",
                  },
                ]}
              >
                <View className="items-center pt-2 pb-2">
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: "rgba(34, 197, 94, 0.15)" }}
                  >
                    <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
                  </View>
                  <Text
                    className="text-xl font-bold mb-1"
                    style={{ color: textPrimary }}
                  >
                    Ticket Scanned
                  </Text>
                  <Text
                    className="text-sm mb-3"
                    style={{ color: textSecondary }}
                  >
                    Scan successful. Confirm to validate this ticket.
                  </Text>
                  <ScrollView
                    className="w-full max-h-64 rounded-xl mb-4 px-4 py-3"
                    style={{
                      backgroundColor: isDark ? "#0E1014" : "#f1f5f9",
                      borderWidth: 1,
                      borderColor: isDark ? "#2A2C33" : "#e2e8f0",
                    }}
                    contentContainerStyle={{ paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {(() => {
                      const ticket = parseScannedTicket(scannedData ?? null);
                      if (ticket && (ticket.tid != null || ticket.bid != null || ticket.r != null)) {
                        const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
                        const row = (label: string, value: string | number | undefined) =>
                          value !== undefined && value !== "" ? (
                            <View key={label} className="flex-row justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: borderColor }}>
                              <Text className="text-xs flex-shrink" style={{ color: textSecondary }}>
                                {label}
                              </Text>
                              <Text className="text-sm font-semibold flex-1 text-right ml-2" style={{ color: textPrimary }} numberOfLines={2}>
                                {String(value)}
                              </Text>
                            </View>
                          ) : null;
                        const guests = ticket.g && ticket.g.length > 0
                          ? ticket.g.length === 1 ? String(ticket.g[0]) : `${ticket.g[0] ?? 0} adults, ${ticket.g[1] ?? 0} children`
                          : undefined;
                        return (
                          <>
                            {row("Tour ID", ticket.tid)}
                            {row("Restaurant ID", ticket.rid as any)}
                            {row("Booking ID", ticket.bid)}
                            {row("Restaurant", ticket.r)}
                            {row("Received date", ticket.rd)}
                            {row("Received time", ticket.rt)}
                            {row("Meal type", ticket.mt)}
                            {row("Meal specific", ticket.ms)}
                            {row("Guests", guests)}
                            {row("Price", ticket.p != null ? `SGD ${ticket.p}` : undefined)}
                            {row("Reference", ticket.ref)}
                          </>
                        );
                      }
                      return (
                        <View>
                          <Text className="text-xs mb-1" style={{ color: textSecondary }}>
                            Scanned code
                          </Text>
                          <Text
                            className="text-base font-mono font-semibold"
                            style={{ color: textPrimary }}
                            selectable
                          >
                            {scannedData ?? "—"}
                          </Text>
                        </View>
                      );
                    })()}
                  </ScrollView>
                </View>
                <View className="flex-row px-4 pb-4" style={{ gap: 12 }}>
                  <TouchableOpacity
                    onPress={onDismissScanResult}
                    className="flex-1 rounded-xl py-3.5 items-center justify-center"
                    style={{
                      backgroundColor: isDark ? "#2A2B30" : "#e2e8f0",
                    }}
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
                    onPress={onConfirmScannedTicket}
                    className="flex-1 rounded-xl py-3.5 items-center justify-center bg-[#D62828]"
                    activeOpacity={0.8}
                  >
                    <Text className="text-base font-semibold text-white">
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Action buttons: Ongoing / Upcoming */}
          <View className="flex-row justify-between mb-5">
            <TouchableOpacity
              className="flex-1 mr-2 rounded-xl py-3 items-center"
              style={{
                backgroundColor: isDark ? "#451a03" : "#ffedd5",
              }}
              activeOpacity={0.85}
              onPress={() => router.push("/(tabs)/ongoing" as any)}
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center mb-1.5"
                style={{ backgroundColor: isDark ? "#f97316" : "#fdba74" }}
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={isDark ? "#1f2937" : "#7c2d12"}
                />
              </View>
              <Text
                className="text-xs mb-0.5 font-semibold"
                style={{ color: isDark ? "#fed7aa" : "#c2410c" }}
              >
                Ongoing
              </Text>
              <Text
                className="text-[11px]"
                style={{ color: isDark ? "#fdba74" : "black" }}
              >
                Events
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 ml-2 rounded-xl py-3 items-center"
              style={{
                backgroundColor: isDark ? "#1d2448" : "#e0f2fe",
              }}
              activeOpacity={0.85}
              onPress={() => router.push("/(tabs)/upcoming" as any)}
            >
              <View className="w-8 h-8 rounded-full items-center justify-center mb-1.5" style={{ backgroundColor: isDark ? "#4f46e5" : "#60a5fa" }}>
                <Ionicons name="calendar-outline" size={18} color={isDark ? "#eef2ff" : "#0f172a"} />
              </View>
              <Text className="text-xs mb-0.5 font-semibold" style={{ color: isDark ? "#bfdbfe" : "#1d4ed8" }}>
                Upcoming
              </Text>
              <Text className="text-[11px]" style={{ color: isDark ? "#93c5fd" : "#2563eb" }}>
                Events
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent tickets – today only; cleared after day change */}
          <Text className="text-sm font-semibold mb-2" style={{ color: textPrimary }}>
            Recent Tickets
          </Text>

          {todayScans.length === 0 ? (
            <View
              className="rounded-lg p-4 items-center justify-center"
              style={{ backgroundColor: cardBgAlt }}
            >
              <Ionicons name="ticket-outline" size={28} color={textSecondary} style={{ marginBottom: 8 }} />
              <Text className="text-sm" style={{ color: textSecondary }}>
                No tickets scanned today.
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-xs mb-2" style={{ color: textSecondary }}>
                {todayScans.length} scanned today
              </Text>
              {todayScans.slice().reverse().map((item, index) => {
                const renderRightActions = () => (
                  <View
                    className="rounded-lg mb-2 flex-row items-center justify-end pr-4"
                    style={{ backgroundColor: "#ef4444", width: 80 }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setScanToDelete({ ...item, isHistory: false });
                        setDeleteScanVisible(true);
                      }}
                      className="items-center justify-center"
                    >
                      <Ionicons name="trash-outline" size={24} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                );

                let rowRef: Swipeable | null = null;

                return (
                  <Swipeable
                    ref={(ref) => {
                      if (ref) {
                        rowRef = ref;
                      }
                    }}
                    onSwipeableOpen={() => {
                      if (rowRef) {
                        if (openTodaySwipeRef.current && openTodaySwipeRef.current !== rowRef) {
                          openTodaySwipeRef.current.close();
                        }
                        openTodaySwipeRef.current = rowRef;
                      }
                    }}
                    key={`${item.code}-${item.time}-${index}`}
                    renderRightActions={renderRightActions}
                    overshootRight={false}
                  >
                    <TouchableOpacity
                      onLongPress={() => {
                        setScanToDelete({ ...item, isHistory: false });
                        setDeleteScanVisible(true);
                      }}
                      className="rounded-lg p-3 mb-2 flex-row items-center"
                      style={{ backgroundColor: cardBgAlt }}
                      activeOpacity={0.7}
                    >
                      <View className="w-7 h-7 rounded-full bg-[#1A7F3B] items-center justify-center mr-3">
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                      </View>
                      <View className="flex-1">
                        {(() => {
                          const { title, subtitle } = formatTicketDisplay(item.code);
                          return (
                            <>
                              <Text
                                className="text-sm font-semibold"
                                style={{ color: textPrimary }}
                                numberOfLines={1}
                              >
                                {title}
                              </Text>
                              <Text className="text-xs" style={{ color: textSecondary }}>
                                {subtitle ? `${item.time} • ${subtitle}` : item.time}
                              </Text>
                            </>
                          );
                        })()}
                      </View>
                    </TouchableOpacity>
                  </Swipeable>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>

      {/* Appearance (Dark / Light) modal */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.themeModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setThemeModalVisible(false)}
          />
          <View
            className="bg-[#18191C] rounded-2xl overflow-hidden"
            style={styles.themeModalBox}
          >
            <View className="px-4 py-3 border-b border-[#2A2B30]">
              <Text className="text-white text-lg font-semibold">
                Appearance
              </Text>
              <Text className="text-gray-400 text-sm mt-0.5">
                Choose light or dark mode
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setTheme("light")}
              className="flex-row items-center px-4 py-4 border-b border-[#2A2B30] active:opacity-80"
            >
              <View className="w-10 h-10 rounded-full bg-[#2A2B30] items-center justify-center mr-3">
                <Ionicons name="sunny-outline" size={22} color="#ffffff" />
              </View>
              <Text className="text-white text-base font-medium flex-1">
                Light mode
              </Text>
              {colorScheme === "light" && (
                <Ionicons name="checkmark-circle" size={24} color="#D62828" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTheme("dark")}
              className="flex-row items-center px-4 py-4 active:opacity-80"
            >
              <View className="w-10 h-10 rounded-full bg-[#2A2B30] items-center justify-center mr-3">
                <Ionicons name="moon-outline" size={22} color="#ffffff" />
              </View>
              <Text className="text-white text-base font-medium flex-1">
                Dark mode
              </Text>
              {colorScheme === "dark" && (
                <Ionicons name="checkmark-circle" size={24} color="#D62828" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete account confirm modal (same style as sign out) */}
      <Modal
        visible={deleteAccountVisible}
        transparent
        animationType="fade"
        onRequestClose={onDismissDeleteAccount}
      >
        <View style={styles.resultModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onDismissDeleteAccount}
          />
          <View
            style={[
              styles.resultModalCard,
              {
                backgroundColor: isDark ? "#18191C" : "#ffffff",
                borderColor: isDark ? "#2A2B30" : "#e2e8f0",
              },
            ]}
          >
            <View className="items-center pt-3 pb-4 px-4">
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(248, 113, 113, 0.2)" }}
              >
                <Ionicons name="trash-outline" size={32} color="#ef4444" />
              </View>
              {!showDeleteConfirmation ? (
                <>
                  <Text
                    className="text-lg font-bold mb-1 text-center"
                    style={{ color: textPrimary }}
                  >
                    Delete account?
                  </Text>
                  <Text
                    className="text-sm text-center mb-4"
                    style={{ color: textSecondary }}
                  >
                    This will permanently remove this account and its data from this
                    device. This action cannot be undone.
                  </Text>
                  <View className="w-full px-2">
                    <FormField
                      isTitle={true}
                      title="Password"
                      placeholder="Enter your password"
                      value={deleteAccountPassword}
                      onChangeText={(text) => {
                        setDeleteAccountPassword(text);
                        if (deleteAccountPasswordError) {
                          setDeleteAccountPasswordError("");
                        }
                      }}
                      error={deleteAccountPasswordError}
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text
                    className="text-lg font-bold mb-1 text-center"
                    style={{ color: textPrimary }}
                  >
                    Are you sure?
                  </Text>
                  <Text
                    className="text-sm text-center mb-4"
                    style={{ color: textSecondary }}
                  >
                    This action cannot be undone. Your account and all associated data will be permanently deleted.
                  </Text>
                </>
              )}
            </View>
            <View className="flex-row px-4 pb-4" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={onDismissDeleteAccount}
                disabled={deleteAccountLoading}
                className="flex-1 rounded-xl py-3.5 items-center justify-center"
                style={{
                  backgroundColor: isDark ? "#2A2B30" : "#e2e8f0",
                  opacity: deleteAccountLoading ? 0.6 : 1,
                }}
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
                onPress={showDeleteConfirmation ? onConfirmDeleteAccount : onVerifyPassword}
                disabled={deleteAccountLoading}
                className="flex-1 rounded-xl py-3.5 items-center justify-center bg-[#D62828]"
                style={{ opacity: deleteAccountLoading ? 0.6 : 1 }}
                activeOpacity={0.8}
              >
                {deleteAccountLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-base font-semibold text-white">
                    {showDeleteConfirmation ? "Yes, Delete" : "Verify"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sign out confirm modal */}
      <Modal
        visible={signOutVisible}
        transparent
        animationType="fade"
        onRequestClose={onDismissSignOut}
      >
        <View style={styles.resultModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onDismissSignOut}
          />
          <View
            style={[
              styles.resultModalCard,
              {
                backgroundColor: isDark ? "#18191C" : "#ffffff",
                borderColor: isDark ? "#2A2B30" : "#e2e8f0",
              },
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
                You’ll be returned to the sign-in screen. You can log back in
                at any time.
              </Text>
            </View>
            <View className="flex-row px-4 pb-4" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={onDismissSignOut}
                className="flex-1 rounded-xl py-3.5 items-center justify-center"
                style={{
                  backgroundColor: isDark ? "#2A2B30" : "#e2e8f0",
                }}
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
                className="flex-1 rounded-xl py-3.5 items-center justify-center bg-[#D62828]"
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

      {/* Invalid ticket modal – restaurant ID mismatch */}
      <Modal
        visible={invalidTicketVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInvalidTicketVisible(false)}
      >
        <View style={styles.resultModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setInvalidTicketVisible(false)}
          />
          <View
            style={[
              styles.resultModalCard,
              {
                backgroundColor: isDark ? "#18191C" : "#ffffff",
                borderColor: isDark ? "#4B1010" : "#fecaca",
              },
            ]}
          >
            <View className="items-center pt-3 pb-4 px-4">
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(248, 113, 113, 0.2)" }}
              >
                <Ionicons name="alert-circle" size={32} color="#ef4444" />
              </View>
              <Text
                className="text-lg font-bold mb-1 text-center"
                style={{ color: isDark ? "#fecaca" : "#b91c1c" }}
              >
                Invalid ticket
              </Text>
              <Text
                className="text-sm text-center px-2 mb-1"
                style={{ color: textSecondary }}
              >
                This ticket belongs to a different restaurant account and cannot
                be validated here.
              </Text>
            </View>
            <View className="flex-row px-4 pb-4">
              <TouchableOpacity
                onPress={() => setInvalidTicketVisible(false)}
                className="flex-1 rounded-xl py-3.5 items-center justify-center bg-[#ef4444]"
                activeOpacity={0.8}
              >
                <Text className="text-base font-semibold text-white">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Redeem info modal – show success message on rescan of last voucher */}
      <Modal
        visible={redeemInfoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRedeemInfoVisible(false)}
      >
        <View style={styles.resultModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setRedeemInfoVisible(false)}
          />
          <View
            style={[
              styles.resultModalCard,
              {
                backgroundColor: isDark ? "#18191C" : "#ffffff",
                borderColor: isDark ? "#14532d" : "#bbf7d0",
              },
            ]}
          >
            <View className="items-center pt-3 pb-4 px-4">
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(34, 197, 94, 0.18)" }}
              >
                <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
              </View>
              <Text
                className="text-lg font-bold mb-1 text-center"
                style={{ color: isDark ? "#bbf7d0" : "#15803d" }}
              >
                Voucher redeemed
              </Text>
              <Text
                className="text-sm text-center px-2 mb-1"
                style={{ color: textSecondary }}
              >
                {redeemInfoMessage || "This voucher has already been redeemed."}
              </Text>
            </View>
            <View className="flex-row px-4 pb-4">
              <TouchableOpacity
                onPress={() => setRedeemInfoVisible(false)}
                className="flex-1 rounded-xl py-3.5 items-center justify-center bg-[#16a34a]"
                activeOpacity={0.8}
              >
                <Text className="text-base font-semibold text-white">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete scan confirmation modal */}
      <Modal
        visible={deleteScanVisible}
        transparent
        animationType="fade"
        onRequestClose={onDismissDeleteScan}
      >
        <View style={styles.resultModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onDismissDeleteScan}
          />
          <View
            style={[
              styles.resultModalCard,
              {
                backgroundColor: isDark ? "#18191C" : "#ffffff",
                borderColor: isDark ? "#2A2B30" : "#e2e8f0",
              },
            ]}
          >
            <View className="items-center pt-3 pb-4 px-4">
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.18)" }}
              >
                <Ionicons name="trash-outline" size={32} color="#ef4444" />
              </View>
              <Text
                className="text-lg font-bold mb-1 text-center"
                style={{ color: textPrimary }}
              >
                Delete scan?
              </Text>
              <Text
                className="text-sm text-center px-2 mb-1"
                style={{ color: textSecondary }}
              >
                This scan will be permanently removed from your history.
              </Text>
              {scanToDelete && "code" in scanToDelete && (
                <Text
                  className="text-xs font-mono mt-2 px-4 py-2 rounded-lg"
                  style={{
                    color: textSecondary,
                    backgroundColor: isDark ? "#0E1014" : "#f1f5f9",
                  }}
                >
                  {scanToDelete.code}
                </Text>
              )}
            </View>
            <View className="flex-row px-4 pb-4" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={onDismissDeleteScan}
                className="flex-1 rounded-xl py-3.5 items-center justify-center"
                style={{
                  backgroundColor: isDark ? "#2A2B30" : "#e2e8f0",
                }}
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
                onPress={onConfirmDeleteScan}
                className="flex-1 rounded-xl py-3.5 items-center justify-center bg-[#ef4444]"
                activeOpacity={0.8}
              >
                <Text className="text-base font-semibold text-white">
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Side menu drawer */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.menuBackdrop}>
          <View style={styles.menuPanel}>
            <SafeAreaView edges={["top"]} style={styles.menuSafe}>
              <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#2A2B30]">
                <Text className="text-white text-lg font-semibold">Menu</Text>
                <TouchableOpacity
                  onPress={() => setMenuOpen(false)}
                  className="w-9 h-9 rounded-full bg-[#2A2B30] items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingVertical: 8 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Profile card at top of drawer */}
                <View className="px-4 py-4 border-b border-[#2A2B30] mb-1 flex-row items-center">
                  <View className="w-11 h-11 rounded-full bg-[#2A2B30] items-center justify-center mr-3">
                    <Ionicons name="person-outline" size={24} color="#ffffff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-base font-semibold">
                      {user?.name || "Event Host"}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {user?.email || "host@travhorserestaurants.com"}
                    </Text>
                  </View>
                </View>

                {MENU_FEATURES.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => onMenuFeature(item.id)}
                    className="flex-row items-center px-4 py-3 active:opacity-80"
                  >
                    <View className="w-9 h-9 rounded-lg bg-[#2A2B30] items-center justify-center mr-3">
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color="#ffffff"
                      />
                    </View>
                    <Text className="text-white text-base font-medium">
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </SafeAreaView>
          </View>
          <Pressable
            style={styles.menuOverlay}
            onPress={() => setMenuOpen(false)}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  qrPlaceholder: {
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: "rgba(214, 40, 40, 0.8)",
    borderRadius: 24,
    margin: 48,
    backgroundColor: "transparent",
  },
  menuBackdrop: {
    flex: 1,
    flexDirection: "row",
  },
  menuPanel: {
    width: 280,
    backgroundColor: "#18191C",
  },
  menuSafe: {
    flex: 1,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  themeModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  themeModalBox: {
    minWidth: 280,
    alignSelf: "stretch",
    marginHorizontal: 24,
  },
  resultModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  resultModalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
});

