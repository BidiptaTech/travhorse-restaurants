import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    fetchRestaurantOrders,
    type OrderDataItem,
    type RestaurantOrder,
} from "@/store/slices/ordersSlice";
import { formatDateShort, formatTimeAmPm } from "@/utils/dateFormat";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    ImageBackground,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// DMC dropdown: show 5 rows visible, then scroll for the rest
const DMC_ROW_HEIGHT = 44;
const DMC_VISIBLE_ROWS = 5;
const DMC_LIST_MAX_HEIGHT = DMC_ROW_HEIGHT * DMC_VISIBLE_ROWS;

export default function OngoingScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const dispatch = useAppDispatch();
  const { ongoing: orders, loading, error } = useAppSelector((s) => s.orders);

  const bg = isDark ? "#000000" : "#ffffff";
  const headerBg = isDark ? "#18191C" : "#f8fafc";
  const cardBg = isDark ? "#15161B" : "#f1f5f9";
  const textPrimary = isDark ? "#ffffff" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const modalBg = isDark ? "#18191C" : "#ffffff";
  const modalBorder = isDark ? "#2A2B30" : "#e5e7eb";
  const rowBg = isDark ? "#1D1F24" : "#f8fafc";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDmc, setSelectedDmc] = useState<string | null>(null);
  const [dmcDropdownVisible, setDmcDropdownVisible] = useState(false);
  const [dmcSearchQuery, setDmcSearchQuery] = useState("");
  const [dmcTriggerLayout, setDmcTriggerLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const dmcTriggerRef = useRef<View>(null);

  // Fetch ongoing orders every time the screen is focused (e.g. when user clicks Ongoing button)
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchRestaurantOrders("ongoing"));
    }, [dispatch]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchRestaurantOrders("ongoing"));
    setRefreshing(false);
  };

  // Extract unique DMC names from orders
  const dmcNames = useMemo(
    () =>
      Array.from(
        new Set(
          orders
            .map((o) => (o.raw.dmc as { name?: string } | undefined)?.name)
            .filter((name): name is string => Boolean(name)),
        ),
      ).sort(),
    [orders],
  );

  const filteredDmcNames = useMemo(() => {
    const q = dmcSearchQuery.trim().toLowerCase();
    if (!q) return dmcNames;
    return dmcNames.filter((name) => name.toLowerCase().includes(q));
  }, [dmcNames, dmcSearchQuery]);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.bookingId
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
    const matchesDmc =
      selectedDmc === null ||
      (o.raw.dmc as { name?: string } | undefined)?.name === selectedDmc;
    return matchesSearch && matchesDmc;
  });

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: bg }} edges={["top"]}>
      {/* Sticky header – purple wave, stays fixed when scrolling */}
      <ImageBackground
        source={require("@/assets/images/top-bg-shape2.png")}
        style={styles.headerBg}
        resizeMode="stretch"
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={26} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ongoing events</Text>
        </View>
      </ImageBackground>

      {/* Sticky search + DMC filter */}
      <View className="px-4 pt-3 pb-2" style={{ backgroundColor: bg }}>
        <View
          className="flex-row items-center rounded-xl px-3 py-2.5"
          style={{
            backgroundColor: isDark ? "#1D1F24" : "#e5e7eb",
          }}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Search by Tour ID"
            placeholderTextColor={textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-base py-0"
            style={{ color: textPrimary }}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* DMC Filter Section – searchable dropdown */}
        {dmcNames.length > 0 && (
          <View className="mt-3">
            <Text
              className="text-xs font-semibold mb-2"
              style={{ color: textSecondary }}
            >
              Filter by DMC
            </Text>
            <View ref={dmcTriggerRef} collapsable={false}>
              <TouchableOpacity
                onPress={() => {
                  dmcTriggerRef.current?.measureInWindow(
                    (x, y, width, height) => {
                      setDmcTriggerLayout({ x, y, width, height });
                      setDmcDropdownVisible(true);
                    },
                  );
                }}
                className="rounded-lg px-3 py-2.5 flex-row items-center justify-between"
                style={{
                  backgroundColor: isDark ? "#1D1F24" : "#e5e7eb",
                  borderWidth: 1,
                  borderColor: isDark ? "#2A2B30" : "#cbd5e1",
                }}
                activeOpacity={0.7}
              >
                <Text
                  className="text-sm flex-1"
                  style={{
                    color: selectedDmc ? textPrimary : textSecondary,
                  }}
                  numberOfLines={1}
                >
                  {selectedDmc || "Filter by DMC"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={textSecondary}
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
            </View>

            <Modal
              visible={dmcDropdownVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setDmcDropdownVisible(false)}
            >
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => {
                  setDmcDropdownVisible(false);
                  setDmcSearchQuery("");
                }}
              />
              <View
                style={[
                  styles.dmcDropdownCard,
                  {
                    position: "absolute",
                    top: dmcTriggerLayout.y + dmcTriggerLayout.height + 6,
                    left: dmcTriggerLayout.x,
                    width: dmcTriggerLayout.width,
                    backgroundColor: modalBg,
                    borderColor: modalBorder,
                  },
                ]}
              >
                <TextInput
                  placeholder="Search DMC..."
                  placeholderTextColor={textSecondary}
                  value={dmcSearchQuery}
                  onChangeText={setDmcSearchQuery}
                  className="rounded-lg px-3 py-2.5 text-sm mb-2"
                  style={{
                    backgroundColor: isDark ? "#0E1014" : "#f1f5f9",
                    color: textPrimary,
                    borderWidth: 1,
                    borderColor: isDark ? "#2A2B30" : "#e2e8f0",
                  }}
                />
                <ScrollView
                  style={{ maxHeight: DMC_LIST_MAX_HEIGHT }}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                >
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedDmc(null);
                      setDmcDropdownVisible(false);
                      setDmcSearchQuery("");
                    }}
                    className="px-3 rounded-lg justify-center"
                    style={{
                      height: DMC_ROW_HEIGHT,
                      backgroundColor:
                        selectedDmc === null
                          ? "rgba(214, 40, 40, 0.15)"
                          : "transparent",
                    }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color: selectedDmc === null ? "#D62828" : textPrimary,
                      }}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  {filteredDmcNames.map((dmcName) => (
                    <TouchableOpacity
                      key={dmcName}
                      onPress={() => {
                        setSelectedDmc(dmcName);
                        setDmcDropdownVisible(false);
                        setDmcSearchQuery("");
                      }}
                      className="px-3 rounded-lg justify-center"
                      style={{
                        height: DMC_ROW_HEIGHT,
                        backgroundColor:
                          selectedDmc === dmcName
                            ? "rgba(214, 40, 40, 0.15)"
                            : "transparent",
                      }}
                    >
                      <Text
                        className="text-sm"
                        style={{
                          color:
                            selectedDmc === dmcName ? "#D62828" : textPrimary,
                        }}
                        numberOfLines={1}
                      >
                        {dmcName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {filteredDmcNames.length === 0 && (
                    <Text
                      className="text-sm py-3 px-3"
                      style={{ color: textSecondary }}
                    >
                      No DMC found
                    </Text>
                  )}
                </ScrollView>
              </View>
            </Modal>
          </View>
        )}
      </View>

      <ScrollView
        className="flex-1 px-4 pt-2"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
          />
        }
      >
        {error ? (
          <View className="items-center justify-center mt-16">
            <Ionicons
              name="alert-circle-outline"
              size={32}
              color={textSecondary}
            />
            <Text
              className="text-sm mt-2 text-center px-4"
              style={{ color: textSecondary }}
            >
              {error}
            </Text>
          </View>
        ) : (loading || refreshing) && filteredOrders.length === 0 ? (
          <View className="items-center justify-center mt-16">
            <ActivityIndicator size="large" color={textSecondary} />
            <Text
              className="text-sm mt-3 text-center"
              style={{ color: textSecondary }}
            >
              Searching…
            </Text>
          </View>
        ) : (
          <>
            {filteredOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                className="mb-3 rounded-xl px-4 py-3 flex-row items-center"
                style={{ backgroundColor: cardBg }}
                activeOpacity={0.85}
                onPress={() => setSelectedOrder(order)}
              >
                <View className="w-9 h-9 rounded-full bg-[#D62828] items-center justify-center mr-3">
                  <Ionicons name="ticket-outline" size={20} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <View className="flex-row justify-between items-start mb-0.5">
                    <Text
                      className="text-xs font-mono flex-shrink"
                      style={{ color: textSecondary }}
                    >
                      Tour ID {order.bookingId}
                    </Text>
                    {(order.raw.dmc as { name?: string } | undefined)?.name && (
                      <View
                        className="px-2 py-0.5 rounded-md flex-shrink-0"
                        style={{ backgroundColor: "rgba(214, 40, 40, 0.15)" }}
                      >
                        <Text
                          className="text-[11px] font-semibold"
                          style={{ color: "#D62828" }}
                        >
                          {(order.raw.dmc as { name: string }).name}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: textPrimary }}
                  >
                    {formatDateShort(order.bookingDate)} ·{" "}
                    {formatTimeAmPm(order.bookingTime)}
                  </Text>
                  <Text
                    className="text-[11px]"
                    style={{ color: textSecondary }}
                  >
                    {order.guests} guest{order.guests !== 1 ? "s" : ""}
                    {order.mealType ? ` · ${order.mealType}` : ""}
                  </Text>
                  {Array.isArray(order.raw.data) &&
                    order.raw.data[0] &&
                    (order.raw.data[0] as OrderDataItem).fullName && (
                      <View
                        className="mt-1.5 self-start px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: "rgba(214, 40, 40, 0.15)" }}
                      >
                        <Text
                          className="text-[11px] font-semibold"
                          style={{ color: "#D62828" }}
                        >
                          {(order.raw.data[0] as OrderDataItem).fullName}
                        </Text>
                      </View>
                    )}
                </View>
              </TouchableOpacity>
            ))}

            {filteredOrders.length === 0 && (
              <View className="items-center justify-center mt-16">
                <Ionicons
                  name={searchQuery.trim() ? "search-outline" : "time-outline"}
                  size={32}
                  color={textSecondary}
                />
                <Text
                  className="text-sm mt-2 text-center"
                  style={{ color: textSecondary }}
                >
                  {searchQuery.trim()
                    ? `No bookings found for "${searchQuery.trim()}"`
                    : "No ongoing events right now."}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Order detail modal – full data */}
      <Modal
        visible={!!selectedOrder}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedOrder(null)}
          />
          {selectedOrder && (
            <View
              style={[
                styles.modalCard,
                { backgroundColor: modalBg, borderColor: modalBorder },
              ]}
            >
              <View
                className="px-4 pt-5 pb-4 flex-row items-center justify-between"
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#2A2B30" : "#e5e7eb",
                }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: "rgba(214, 40, 40, 0.15)" }}
                  >
                    <Ionicons
                      name="receipt-outline"
                      size={24}
                      color="#D62828"
                    />
                  </View>
                  <View>
                    <Text
                      className="text-[11px] uppercase tracking-wide"
                      style={{ color: textSecondary }}
                    >
                      Tour
                    </Text>
                    <Text
                      className="text-lg font-bold"
                      style={{ color: textPrimary }}
                    >
                      #{selectedOrder.bookingId}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedOrder(null)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: isDark ? "#2A2B30" : "#e5e7eb" }}
                >
                  <Ionicons name="close" size={22} color={textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={true}
              >
                <OrderDetailRows
                  order={selectedOrder}
                  isDark={isDark}
                  textPrimary={textPrimary}
                  textSecondary={textSecondary}
                  rowBg={rowBg}
                  accentColor="#D62828"
                  onClose={() => setSelectedOrder(null)}
                />
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function OrderDetailRows({
  order,
  isDark,
  textPrimary,
  textSecondary,
  rowBg,
  accentColor,
  onClose,
}: {
  order: RestaurantOrder;
  isDark: boolean;
  textPrimary: string;
  textSecondary: string;
  rowBg: string;
  accentColor: string;
  onClose: () => void;
}) {
  const first =
    Array.isArray(order.raw?.data) && order.raw.data.length > 0
      ? (order.raw.data[0] as OrderDataItem)
      : null;

  const iconBg = accentColor + "18";
  const row = (
    key: string,
    label: string,
    value: string,
    icon: React.ComponentProps<typeof Ionicons>["name"],
  ) => (
    <View
      key={key}
      className="flex-row items-center py-3 px-3 rounded-xl mb-2"
      style={{ backgroundColor: rowBg }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon} size={20} color={accentColor} />
      </View>
      <View className="flex-1">
        <Text
          className="text-[11px] uppercase tracking-wide mb-0.5"
          style={{ color: textSecondary }}
        >
          {label}
        </Text>
        <Text
          className="text-sm font-semibold"
          style={{ color: textPrimary }}
          numberOfLines={2}
        >
          {value || "—"}
        </Text>
      </View>
    </View>
  );

  const date = first?.bookingDate ? formatDateShort(first.bookingDate) : "—";
  const time = first?.visitTime ? formatTimeAmPm(first.visitTime) : "—";
  const name = first?.fullName ? String(first.fullName) : "—";
  const dmcName = (order.raw.dmc as { name?: string } | undefined)?.name
    ? String((order.raw.dmc as { name: string }).name)
    : "—";
  const mealType = first?.mealType ? String(first.mealType) : "—";
  const mealSpecific = first?.mealSpecificType
    ? String(first.mealSpecificType)
    : "—";
  const adults = first?.adultCount != null ? String(first.adultCount) : "—";
  const children = first?.childCount != null ? String(first.childCount) : "—";
  const guestCount =
    order.guests > 0
      ? order.guests
      : first
        ? Number(first.adultCount ?? 0) + Number(first.childCount ?? 0)
        : 0;
  const totalPrice =
    first?.totalPrice != null ? `SGD ${first.totalPrice}` : "—";
  const specialRequests = first?.specialRequests
    ? String(first.specialRequests).trim()
    : "";

  return (
    <View className="px-4 pt-4">
      {row("date", "Date", date, "calendar-outline")}
      {row("time", "Time", time, "time-outline")}
      {row("name", "Name", name, "person-outline")}
      {row("dmc", "DMC", dmcName, "business-outline")}
      {row("mealType", "Meal type", mealType, "restaurant-outline")}
      {row("meal", "Meal", mealSpecific, "nutrition-outline")}
      {row("guests", "Guests", String(guestCount), "people-outline")}
      {row("adults", "Adults", adults, "man-outline")}
      {row("children", "Children", children, "happy-outline")}
      {row("total", "Total", totalPrice, "cash-outline")}
      {specialRequests
        ? row(
            "special",
            "Special requests",
            specialRequests,
            "document-text-outline",
          )
        : null}

      <TouchableOpacity
        onPress={onClose}
        className="mt-5 py-3.5 rounded-xl flex-row items-center justify-center"
        style={{ backgroundColor: isDark ? "#2A2B30" : "#e5e7eb" }}
        activeOpacity={0.8}
      >
        <Ionicons
          name="close-circle-outline"
          size={20}
          color={textPrimary}
          style={{ marginRight: 8 }}
        />
        <Text
          className="text-base font-semibold"
          style={{ color: textPrimary }}
        >
          Close
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    minHeight: 120,
    width: "100%",
    justifyContent: "flex-start",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "85%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  modalScroll: {
    maxHeight: 400,
  },
  dmcDropdownCard: {
    maxHeight: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
