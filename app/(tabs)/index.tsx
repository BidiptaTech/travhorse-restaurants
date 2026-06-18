import { WaveScreenHeader } from "@/components/ui/WaveScreenHeader";
import { BRAND_BLUE } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Dimensions,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiUrl } from "../../constants/api";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { signOut } from "../../store/slices/authSlice";
import { clearAuth, loadAuth } from "../../utils/authStorage";
import { addHistoryScan } from "../../utils/scanHistoryStorage";
import { scannerTrigger } from "../../utils/scannerTrigger";
import {
    formatTicketDisplay,
    parseScannedTicket,
} from "../../utils/ticketDisplay";
import {
    addTodayScan,
    deleteTodayScan,
    getTodayScans,
    type TodayScanItem,
} from "../../utils/todayScansStorage";

export default function TicketScannerHome() {
  const [scanVisible, setScanVisible] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanResultVisible, setScanResultVisible] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [invalidTicketVisible, setInvalidTicketVisible] = useState(false);
  const [restaurantIdErrorVisible, setRestaurantIdErrorVisible] =
    useState(false);
  const [restaurantIdErrorTitle, setRestaurantIdErrorTitle] = useState(
    "Restaurant ID not found",
  );
  const [restaurantIdErrorMessage, setRestaurantIdErrorMessage] = useState("");
  const [redeemInfoVisible, setRedeemInfoVisible] = useState(false);
  const [redeemInfoMessage, setRedeemInfoMessage] = useState<string | null>(
    null,
  );
  const [redeemFailedVisible, setRedeemFailedVisible] = useState(false);
  const [redeemFailedTitle, setRedeemFailedTitle] = useState("Redeem failed");
  const [redeemFailedMessage, setRedeemFailedMessage] = useState("");
  const [lastRedeemedCode, setLastRedeemedCode] = useState<string | null>(null);
  const [redeemSuccessToastVisible, setRedeemSuccessToastVisible] =
    useState(false);
  const [redeemSuccessToastMessage, setRedeemSuccessToastMessage] =
    useState("");
  const redeemSuccessToastTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [deleteScanVisible, setDeleteScanVisible] = useState(false);
  const [scanToDelete, setScanToDelete] = useState<
    | (TodayScanItem & { isHistory?: false })
    | { isHistory: true; timestamp: number }
    | null
  >(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [todayScans, setTodayScans] = useState<TodayScanItem[]>([]);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const { colorScheme } = useColorScheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const openTodaySwipeRef = useRef<Swipeable | null>(null);
  const scanLineAnimation = useRef(new Animated.Value(0)).current;
  const lastBarcodeScannedAt = useRef(0);
  const SCAN_THROTTLE_MS = 1200;

  const userId = user?.id ?? "";

  useEffect(() => {
    if (userId) {
      getTodayScans(userId).then(setTodayScans);
    } else {
      setTodayScans([]);
    }
  }, [userId]);

  const startScanLineAnimation = useCallback(() => {
    scanLineAnimation.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(scanLineAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [scanLineAnimation]);

  const openScanner = useCallback(async () => {
    if (!user?.id?.trim()) {
      setRestaurantIdErrorTitle("Restaurant ID not found");
      setRestaurantIdErrorMessage(
        "Your account is missing a restaurant ID. Please sign out and sign in again.",
      );
      setRestaurantIdErrorVisible(true);
      return;
    }
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          "Camera access",
          "Camera permission is required to scan tickets.",
        );
        return;
      }
    }
    setLastScanned(null);
    setScanVisible(true);
    startScanLineAnimation();
  }, [user?.id, permission?.granted, requestPermission, startScanLineAnimation]);

  useEffect(() => {
    scannerTrigger.setCallback(openScanner);
    return () => {
      if (redeemSuccessToastTimeoutRef.current) {
        clearTimeout(redeemSuccessToastTimeoutRef.current);
        redeemSuccessToastTimeoutRef.current = null;
      }
      scannerTrigger.clear();
      scanLineAnimation.stopAnimation();
    };
  }, [openScanner, scanLineAnimation]);

  const toggleFlash = useCallback(() => {
    setFlashEnabled(!flashEnabled);
  }, [flashEnabled]);

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      const code = data?.trim() ?? "";
      if (!code) return;

      const now = Date.now();
      if (now - lastBarcodeScannedAt.current < SCAN_THROTTLE_MS) return;
      lastBarcodeScannedAt.current = now;

      const uid = user?.id ?? "";
      scanLineAnimation.stopAnimation();

      if (__DEV__) {
        console.log("QR scan:", code.slice(0, 40) + (code.length > 40 ? "…" : ""));
      }

      if (!uid) {
        setRestaurantIdErrorTitle("Restaurant ID not found");
        setRestaurantIdErrorMessage(
          "Your account is missing a restaurant ID. Please sign out and sign in again.",
        );
        setRestaurantIdErrorVisible(true);
        setScanVisible(false);
        setScannedData(null);
        setScanResultVisible(false);
        return;
      }

      if (lastRedeemedCode && code === lastRedeemedCode) {
        setScanVisible(false);
        setScannedData(null);
        setScanResultVisible(false);
        setRedeemFailedTitle("Already redeemed");
        setRedeemFailedMessage("This voucher has already been redeemed.");
        setRedeemFailedVisible(true);
        return;
      }

      const ticket = parseScannedTicket(code);

      if (
        ticket &&
        (ticket.tid != null || ticket.bid != null || ticket.r != null)
      ) {
        if (ticket.rid == null || ticket.rid === "") {
          setRestaurantIdErrorTitle("Restaurant ID not found");
          setRestaurantIdErrorMessage(
            "This ticket does not contain a restaurant ID and cannot be validated.",
          );
          setRestaurantIdErrorVisible(true);
          setScanVisible(false);
          setScannedData(null);
          setScanResultVisible(false);
          return;
        }
        if (String(ticket.rid) !== uid) {
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
    [user?.id, lastRedeemedCode, scanLineAnimation],
  );

  const onConfirmScannedTicket = useCallback(async () => {
    const code = scannedData?.trim() ?? "";
    const auth = await loadAuth();
    const token = auth?.token ?? null;
    const uid = auth?.user?.id ?? user?.id ?? "";

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
          "This ticket belongs to a different restaurant account.",
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

      // Token expired, invalid, or server error (500) – clear auth and force navigate to login
      if (res.status === 401 || res.status === 403 || res.status === 500) {
        dispatch(signOut());
        await clearAuth(user?.id).catch(() => {});
        router.replace("/(auth-pages)/SignIn");
        return;
      }

      if (!res.ok || data?.success === false) {
        const message =
          data?.message ||
          data?.error ||
          `Failed to redeem ticket (${res.status})`;
        setRedeemFailedTitle("Redeem failed");
        setRedeemFailedMessage(message);
        setRedeemFailedVisible(true);
        return;
      }

      const apiMessage = typeof data?.message === "string" ? data.message : "";
      const isAlreadyRedeemed =
        /already\s+redeem/i.test(apiMessage) ||
        /already\s+used/i.test(apiMessage);

      if (isAlreadyRedeemed) {
        setRedeemFailedTitle("Already redeemed");
        setRedeemFailedMessage(
          apiMessage.trim() || "This voucher has already been redeemed.",
        );
        setRedeemFailedVisible(true);
        setScanResultVisible(false);
        setScannedData(null);
        return;
      }

      // Only store scan locally if redeem succeeded (and not already redeemed)
      addTodayScan(uid, code).then(() =>
        getTodayScans(uid).then(setTodayScans),
      );
      addHistoryScan(uid, code); // Also save to persistent history

      // Remember this code and show success info for any immediate rescan
      setLastRedeemedCode(code);
      setRedeemInfoMessage(
        apiMessage.length > 0 ? apiMessage : "Voucher redeemed successfully",
      );

      setLastScanned(scannedData ?? null);
      setScanResultVisible(false);
      setScannedData(null);

      const msg =
        apiMessage.length > 0 ? apiMessage : "Voucher redeemed successfully";
      setRedeemSuccessToastMessage(msg);
      setRedeemSuccessToastVisible(true);
      if (redeemSuccessToastTimeoutRef.current)
        clearTimeout(redeemSuccessToastTimeoutRef.current);
      redeemSuccessToastTimeoutRef.current = setTimeout(() => {
        setRedeemSuccessToastVisible(false);
        redeemSuccessToastTimeoutRef.current = null;
      }, 1000);
    } catch (err) {
      setRedeemFailedTitle("Error");
      setRedeemFailedMessage(
        err instanceof Error ? err.message : "Network error. Please try again.",
      );
      setRedeemFailedVisible(true);
    }
  }, [dispatch, scannedData, user?.id]);

  const onDismissScanResult = useCallback(() => {
    setScanResultVisible(false);
    setScannedData(null);
  }, []);

  const onConfirmDeleteScan = useCallback(async () => {
    if (!scanToDelete) return;
    const uid = user?.id ?? "";
    if (scanToDelete.isHistory && "timestamp" in scanToDelete) {
      const { deleteHistoryScan } =
        await import("../../utils/scanHistoryStorage");
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

  // Theme: b50, n50, n400, n500; accent BRAND_BLUE (header / tab bar)
  const isDark = colorScheme === "dark";
  const primary = BRAND_BLUE;
  const iconColor = isDark ? "#ffffff" : "#4A4A4A"; // n400
  const contentBg = isDark ? "#151718" : "#F5F5F7"; // n50 / b50
  const cardBgAlt = isDark ? "#242428" : "#EEEEF0"; // n6 / light gray
  const qrPlaceholderBg = isDark ? "#1A1A1C" : "#E5E5E7";
  const textPrimary = isDark ? "#ffffff" : "#4A4A4A"; // n400
  const textSecondary = isDark ? "#9CA3AF" : "#6B6B70"; // n500 / g60

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: isDark ? "#151718" : "#F5F5F7" }}
      edges={["left", "right", "bottom"]}
    >
      <WaveScreenHeader
        showProfile
        userName={user?.name || "Restaurant"}
        userAvatarSource={
          user?.image
            ? { uri: user.image }
            : require("@/assets/images/adaptive-icon2.png")
        }
        onHistoryPress={() => router.push("/(tabs)/history")}
        onProfilePress={() => router.push("/(tabs)/accounts")}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="px-4 pt-4 flex-1"
          style={{ backgroundColor: contentBg }}
        >
          {/* Event banner – primary colour like login */}

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
          <View
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: cardBgAlt }}
          >
            <TouchableOpacity
              onPress={openScanner}
              activeOpacity={0.8}
              style={[
                styles.qrPlaceholder,
                {
                  backgroundColor: qrPlaceholderBg,
                  borderColor: isDark ? "#2A2C33" : "#cbd5e1",
                },
              ]}
              className="items-center justify-center rounded-lg"
            >
              <Ionicons name="qr-code" size={96} color={iconColor} />
            </TouchableOpacity>
            <Text
              className="mt-3 text-center text-xs"
              style={{ color: textSecondary }}
            >
              SCAN QR CODE
            </Text>
          </View>

          {/* QR Scanner modal - PhonePe Style */}
          <Modal
            visible={scanVisible}
            animationType="slide"
            onRequestClose={() => setScanVisible(false)}
          >
            <View style={styles.phonePayScannerContainer}>
              {permission?.granted === false ? (
                <View style={styles.permissionContainer}>
                  <View style={styles.permissionContent}>
                    <View style={styles.permissionIcon}>
                      <Ionicons name="camera-outline" size={64} color="#ffffff" />
                    </View>
                    <Text style={styles.permissionTitle}>
                      Camera Permission Required
                    </Text>
                    <Text style={styles.permissionMessage}>
                      We need camera access to scan QR codes and vouchers
                    </Text>
                    <TouchableOpacity
                      onPress={requestPermission}
                      style={[styles.permissionButton, { backgroundColor: primary }]}
                    >
                      <Text style={styles.permissionButtonText}>
                        Allow Camera Access
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setScanVisible(false)}
                      style={styles.permissionCancelButton}
                    >
                      <Text style={styles.permissionCancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <SafeAreaView style={styles.scannerSafeArea} edges={["top"]}>
                    {/* Header – Scan any QR style */}
                    <View style={styles.phonePayHeader}>
                      <TouchableOpacity
                        onPress={() => {
                          scanLineAnimation.stopAnimation();
                          setScanVisible(false);
                        }}
                        style={styles.phonePayHeaderButton}
                      >
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                      </TouchableOpacity>
                      <View style={styles.phonePayHeaderCenter}>
                        <Text style={styles.phonePayHeaderTitle}>
                          Scan any QR
                        </Text>
                        <Text style={styles.phonePayHeaderSubtitle}>
                          Voucher • Ticket • QR Code
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={toggleFlash}
                        style={styles.phonePayHeaderButton}
                      >
                        <Ionicons 
                          name={flashEnabled ? "flash" : "flash-off"} 
                          size={24} 
                          color={flashEnabled ? "#FFD700" : "#ffffff"} 
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Camera View */}
                    <View style={styles.phonePayCameraContainer}>
                      <CameraView
                        style={StyleSheet.absoluteFill}
                        facing="back"
                        enableTorch={flashEnabled}
                        barcodeScannerSettings={{
                          barcodeTypes: ["qr"],
                        }}
                        onBarcodeScanned={onBarcodeScanned}
                      />
                      
                      {/* Dark overlay */}
                      <View style={styles.phonePayOverlay}>
                        {/* Top overlay */}
                        <View style={styles.phonePayOverlayTop} />
                        
                        {/* Middle row with side overlays and scanning area */}
                        <View style={styles.phonePayOverlayMiddle}>
                          <View style={styles.phonePayOverlaySide} />
                          
                          {/* Scanning Frame */}
                          <View style={styles.phonePayScanFrame}>
                            {/* Corner brackets */}
                            <View style={[styles.phonePayCorner, styles.phonePayCornerTopLeft]} />
                            <View style={[styles.phonePayCorner, styles.phonePayCornerTopRight]} />
                            <View style={[styles.phonePayCorner, styles.phonePayCornerBottomLeft]} />
                            <View style={[styles.phonePayCorner, styles.phonePayCornerBottomRight]} />
                            
                            {/* Animated scan line */}
                            <Animated.View
                              style={[
                                styles.phonePayScanLine,
                                {
                                  transform: [{
                                    translateY: scanLineAnimation.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0, 240], // Scan frame height minus line height
                                    })
                                  }]
                                }
                              ]}
                            />
                          </View>
                          
                          <View style={styles.phonePayOverlaySide} />
                        </View>
                        
                        {/* Bottom overlay */}
                        <View style={styles.phonePayOverlayBottom} />
                      </View>
                    </View>

                    {/* Instructions */}
                    <View style={styles.phonePayInstructions}>
                      <Text style={styles.phonePayInstructionTitle}>
                        Position QR code within the frame
                      </Text>
                      <Text style={styles.phonePayInstructionSubtitle}>
                        Hold your phone steady to scan
                      </Text>
                    </View>

                    {/* Bottom buttons */}
                    <View style={styles.phonePayBottomActions}>
                      <TouchableOpacity 
                        style={styles.phonePayActionButton}
                        onPress={toggleFlash}
                      >
                        <View style={styles.phonePayActionButtonInner}>
                          <Ionicons 
                            name={flashEnabled ? "flash" : "flash-off"} 
                            size={24} 
                            color="#ffffff" 
                          />
                        </View>
                        <Text style={styles.phonePayActionButtonText}>Torch</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.phonePayActionButton}
                        onPress={() => {
                          scanLineAnimation.stopAnimation();
                          setScanVisible(false);
                        }}
                      >
                        <View style={styles.phonePayActionButtonInner}>
                          <Ionicons name="close" size={24} color="#ffffff" />
                        </View>
                        <Text style={styles.phonePayActionButtonText}>Close</Text>
                      </TouchableOpacity>
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
                    backgroundColor: isDark ? "#151718" : "#F5F5F7",
                    borderColor: isDark ? "#2A2A2E" : "#E5E5E7",
                  },
                ]}
              >
                <View className="items-center pt-2 pb-2">
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: "rgba(97, 59, 255, 0.15)" }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={48}
                      color={primary}
                    />
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
                      if (
                        ticket &&
                        (ticket.tid != null ||
                          ticket.bid != null ||
                          ticket.r != null)
                      ) {
                        const borderColor = isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.06)";
                        const row = (
                          label: string,
                          value: string | number | undefined,
                          highlight: boolean = false,
                        ) =>
                          value !== undefined && value !== "" ? (
                            <View
                              key={label}
                              className={`flex-row justify-between py-2 ${highlight ? "px-2 -mx-2 rounded-lg" : ""}`}
                              style={{
                                borderBottomWidth: highlight ? 0 : 1,
                                borderBottomColor: borderColor,
                                backgroundColor: highlight
                                  ? isDark
                                    ? "rgba(97, 59, 255, 0.15)"
                                    : "rgba(97, 59, 255, 0.1)"
                                  : "transparent",
                              }}
                            >
                              <Text
                                className={`text-xs flex-shrink ${highlight ? "font-semibold" : ""}`}
                                style={{
                                  color: highlight ? primary : textSecondary,
                                }}
                              >
                                {label}
                              </Text>
                              <Text
                                className={`text-sm flex-1 text-right ml-2 ${highlight ? "font-bold" : "font-semibold"}`}
                                style={{
                                  color: highlight ? primary : textPrimary,
                                }}
                                numberOfLines={2}
                              >
                                {String(value)}
                              </Text>
                            </View>
                          ) : null;
                        const guests =
                          ticket.g && ticket.g.length > 0
                            ? ticket.g.length === 1
                              ? String(ticket.g[0])
                              : `${ticket.g[0] ?? 0} adults, ${ticket.g[1] ?? 0} children`
                            : undefined;
                        return (
                          <>
                            {row("DMC", ticket.dmc, true)}
                            {row("Tour ID", ticket.tid)}
                            {row("Restaurant ID", ticket.rid as any)}
                            {row("Booking ID", ticket.bid)}
                            {row("Restaurant", ticket.r)}
                            {row("Received date", ticket.rd)}
                            {row("Received time", ticket.rt)}
                            {row("Meal type", ticket.mt)}
                            {row("Meal specific", ticket.ms)}
                            {row("Guests", guests)}
                            {row(
                              "Price",
                              ticket.p != null ? `SGD ${ticket.p}` : undefined,
                            )}
                            {row("Reference", ticket.ref)}
                          </>
                        );
                      }
                      return (
                        <View>
                          <Text
                            className="text-xs mb-1"
                            style={{ color: textSecondary }}
                          >
                            Scanned code
                          </Text>
                          <Text
                            className="text-base font-mono font-semibold"
                            style={{ color: textPrimary }}
                            selectable
                          >
                            {scannedData ?? "\u2014"}
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
                      backgroundColor: isDark ? "#2A2A2E" : "#E5E5E7",
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
                    className="flex-1 rounded-xl py-3.5 items-center justify-center"
                    style={{ backgroundColor: primary }}
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
              <View
                className="w-8 h-8 rounded-full items-center justify-center mb-1.5"
                style={{ backgroundColor: isDark ? "#4f46e5" : "#60a5fa" }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={isDark ? "#eef2ff" : "#0f172a"}
                />
              </View>
              <Text
                className="text-xs mb-0.5 font-semibold"
                style={{ color: isDark ? "#bfdbfe" : "#1d4ed8" }}
              >
                Upcoming
              </Text>
              <Text
                className="text-[11px]"
                style={{ color: isDark ? "#93c5fd" : "#2563eb" }}
              >
                Events
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent tickets – today only; cleared after day change */}
          <Text
            className="text-sm font-semibold mb-2"
            style={{ color: textPrimary }}
          >
            Meal Voucher Redeemed
          </Text>

          {todayScans.length === 0 ? (
            <View
              className="rounded-lg p-4 items-center justify-center"
              style={{ backgroundColor: cardBgAlt }}
            >
              <Ionicons
                name="ticket-outline"
                size={28}
                color={textSecondary}
                style={{ marginBottom: 8 }}
              />
              <Text className="text-sm" style={{ color: textSecondary }}>
                No vouchers scanned today.
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-xs mb-2" style={{ color: textSecondary }}>
                {todayScans.length} vouchers scanned today
              </Text>
              {todayScans
                .slice()
                .reverse()
                .map((item, index) => {
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
                        <Ionicons
                          name="trash-outline"
                          size={24}
                          color="#ffffff"
                        />
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
                          if (
                            openTodaySwipeRef.current &&
                            openTodaySwipeRef.current !== rowRef
                          ) {
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
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#ffffff"
                          />
                        </View>
                        <View className="flex-1">
                          {(() => {
                            const { title, subtitle } = formatTicketDisplay(
                              item.code,
                            );
                            const ticket = parseScannedTicket(item.code);
                            const dmcName = ticket?.dmc;
                            return (
                              <>
                                <View className="flex-row justify-between items-start mb-0.5">
                                  <Text
                                    className="text-sm font-semibold flex-1 mr-2"
                                    style={{ color: textPrimary }}
                                    numberOfLines={1}
                                  >
                                    {title}
                                  </Text>
                                  {dmcName ? (
                                    <View
                                      className="px-2 py-0.5 rounded-md"
                                      style={{
                                        backgroundColor:
                                          "rgba(26, 127, 59, 0.2)",
                                      }}
                                    >
                                      <Text
                                        className="text-[11px] font-semibold"
                                        style={{ color: "#1A7F3B" }}
                                        numberOfLines={1}
                                      >
                                        {dmcName}
                                      </Text>
                                    </View>
                                  ) : null}
                                </View>
                                <Text
                                  className="text-xs"
                                  style={{ color: textSecondary }}
                                >
                                  {subtitle
                                    ? `${item.time} \u2022 ${subtitle}`
                                    : item.time}
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

      {/* Restaurant ID not found – styled error modal */}
      <Modal
        visible={restaurantIdErrorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRestaurantIdErrorVisible(false)}
      >
        <View style={styles.resultModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setRestaurantIdErrorVisible(false)}
          />
          <View
            style={[
              styles.resultModalCard,
              {
                backgroundColor: isDark ? "#151718" : "#F5F5F7",
                borderColor: isDark ? "#4B1010" : "#fecaca",
              },
            ]}
          >
            <View className="items-center pt-4 pb-2 px-4">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(248, 113, 113, 0.2)" }}
              >
                <Ionicons name="warning" size={36} color="#ef4444" />
              </View>
              <Text
                className="text-lg font-bold mb-2 text-center"
                style={{ color: isDark ? "#fecaca" : "#b91c1c" }}
              >
                {restaurantIdErrorTitle}
              </Text>
              <Text
                className="text-sm text-center px-3 mb-4"
                style={{ color: textSecondary }}
              >
                {restaurantIdErrorMessage}
              </Text>
              <TouchableOpacity
                onPress={() => setRestaurantIdErrorVisible(false)}
                className="w-full rounded-xl py-3.5 items-center justify-center bg-[#ef4444]"
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

      {/* Redeem success toast – message only, auto-close 1s, OK button */}
      <Modal
        visible={redeemSuccessToastVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (redeemSuccessToastTimeoutRef.current) {
            clearTimeout(redeemSuccessToastTimeoutRef.current);
            redeemSuccessToastTimeoutRef.current = null;
          }
          setRedeemSuccessToastVisible(false);
        }}
      >
        <View style={styles.resultModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (redeemSuccessToastTimeoutRef.current) {
                clearTimeout(redeemSuccessToastTimeoutRef.current);
                redeemSuccessToastTimeoutRef.current = null;
              }
              setRedeemSuccessToastVisible(false);
            }}
          />
          <View
            style={[
              styles.resultModalCard,
              {
                backgroundColor: isDark ? "#18191C" : "#ffffff",
                borderColor: isDark ? "#14532d" : "#bbf7d0",
                borderWidth: 1,
              },
            ]}
          >
            <View className="items-center pt-5 pb-4 px-5">
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(34, 197, 94, 0.18)" }}
              >
                <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
              </View>
              <Text
                className="text-base text-center px-2 mb-4"
                style={{ color: textSecondary, lineHeight: 22 }}
              >
                {redeemSuccessToastMessage}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (redeemSuccessToastTimeoutRef.current) {
                    clearTimeout(redeemSuccessToastTimeoutRef.current);
                    redeemSuccessToastTimeoutRef.current = null;
                  }
                  setRedeemSuccessToastVisible(false);
                }}
                className="w-full rounded-xl py-3.5 items-center justify-center bg-[#16a34a]"
                activeOpacity={0.8}
              >
                <Text className="text-base font-semibold text-white">OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Redeem failed – styled error modal */}
      <Modal
        visible={redeemFailedVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRedeemFailedVisible(false)}
      >
        <View style={styles.resultModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setRedeemFailedVisible(false)}
          />
          <View
            style={[
              styles.resultModalCard,
              {
                backgroundColor: isDark ? "#151718" : "#F5F5F7",
                borderColor: isDark ? "#4B1010" : "#fecaca",
              },
            ]}
          >
            <View className="items-center pt-4 pb-2 px-4">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(248, 113, 113, 0.2)" }}
              >
                <Ionicons name="close-circle" size={36} color="#ef4444" />
              </View>
              <Text
                className="text-lg font-bold mb-2 text-center"
                style={{ color: isDark ? "#fecaca" : "#b91c1c" }}
              >
                {redeemFailedTitle}
              </Text>
              <Text
                className="text-sm text-center px-3 mb-4"
                style={{ color: textSecondary }}
              >
                {redeemFailedMessage}
              </Text>
              <TouchableOpacity
                onPress={() => setRedeemFailedVisible(false)}
                className="w-full rounded-xl py-3.5 items-center justify-center bg-[#ef4444]"
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
                backgroundColor: isDark ? "#151718" : "#F5F5F7",
                borderColor: isDark ? "#2A2A2E" : "#E5E5E7",
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
              {scanToDelete &&
                "code" in scanToDelete &&
                (() => {
                  const codeStr =
                    typeof scanToDelete.code === "string"
                      ? scanToDelete.code
                      : JSON.stringify(scanToDelete.code);
                  const { title, subtitle } = formatTicketDisplay(codeStr);
                  return (
                    <View
                      className="mt-2 px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: isDark ? "#0E1014" : "#f1f5f9",
                      }}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: textPrimary }}
                        numberOfLines={1}
                      >
                        {title}
                      </Text>
                      {subtitle ? (
                        <Text
                          className="text-xs mt-0.5"
                          style={{ color: textSecondary }}
                          numberOfLines={1}
                        >
                          {subtitle}
                        </Text>
                      ) : null}
                    </View>
                  );
                })()}
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  qrPlaceholder: {
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
  },
  // PhonePe Style Scanner – no solid black; semi-transparent for dark mode design
  phonePayScannerContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scannerSafeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  permissionContent: {
    alignItems: "center",
    maxWidth: 300,
  },
  permissionIcon: {
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  permissionMessage: {
    fontSize: 16,
    color: "#cccccc",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  permissionCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  permissionCancelText: {
    fontSize: 16,
    color: "#888888",
  },
  phonePayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  phonePayHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  phonePayHeaderCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  phonePayHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  phonePayHeaderSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  phonePayCameraContainer: {
    flex: 1,
    position: "relative",
  },
  phonePayOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  phonePayOverlayTop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  phonePayOverlayMiddle: {
    height: 260,
    flexDirection: "row",
  },
  phonePayOverlaySide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  phonePayScanFrame: {
    width: 260,
    height: 260,
    position: "relative",
    backgroundColor: "transparent",
  },
  phonePayCorner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: BRAND_BLUE,
    borderWidth: 4,
  },
  phonePayCornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  phonePayCornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  phonePayCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  phonePayCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  phonePayScanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: BRAND_BLUE,
    borderRadius: 1.5,
    shadowColor: BRAND_BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 4,
  },
  phonePayOverlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  phonePayInstructions: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  phonePayInstructionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  phonePayInstructionSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  phonePayBottomActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
    paddingVertical: 24,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  phonePayActionButton: {
    alignItems: "center",
  },
  phonePayActionButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  phonePayActionButtonText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "500",
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
