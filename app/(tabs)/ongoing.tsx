import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchRestaurantOrders,
  type RestaurantOrder,
  type RawRestaurantOrder,
  type OrderDataItem,
} from "@/store/slices/ordersSlice";
import { formatDateShort, formatTimeAmPm } from "@/utils/dateFormat";

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
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchRestaurantOrders("ongoing"));
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchRestaurantOrders("ongoing"));
    setRefreshing(false);
  };

  const filteredOrders = orders.filter((o) =>
    o.bookingId.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: bg }}
    >
      <View
        className="px-4 py-3 flex-row items-center"
        style={{ backgroundColor: headerBg }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full items-center justify-center mr-3"
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={isDark ? "#ffffff" : "#111827"}
          />
        </TouchableOpacity>
        <Text className="text-lg font-semibold" style={{ color: textPrimary }}>
          Ongoing events
        </Text>
      </View>

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
            placeholder="Search by booking ID"
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
      </View>

      <ScrollView
        className="flex-1 px-4 pt-2"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <View className="items-center justify-center mt-16">
            <Ionicons name="alert-circle-outline" size={32} color={textSecondary} />
            <Text className="text-sm mt-2 text-center px-4" style={{ color: textSecondary }}>
              {error}
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
                  <Text
                    className="text-xs font-mono mb-0.5"
                    style={{ color: textSecondary }}
                  >
                    Booking ID {order.bookingId}
                  </Text>
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: textPrimary }}
                  >
                    {formatDateShort(order.bookingDate)} · {formatTimeAmPm(order.bookingTime)}
                  </Text>
                  <Text className="text-[11px]" style={{ color: textSecondary }}>
                    {order.guests} guest{order.guests !== 1 ? "s" : ""}
                    {order.mealType ? ` · ${order.mealType}` : ""}
                  </Text>
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
                    <Ionicons name="receipt-outline" size={24} color="#D62828" />
                  </View>
                  <View>
                    <Text className="text-[11px] uppercase tracking-wide" style={{ color: textSecondary }}>
                      Booking
                    </Text>
                    <Text className="text-lg font-bold" style={{ color: textPrimary }}>
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
  const first = Array.isArray(order.raw?.data) && order.raw.data.length > 0
    ? (order.raw.data[0] as OrderDataItem)
    : null;

  const iconBg = accentColor + "18";
  const row = (
    key: string,
    label: string,
    value: string,
    icon: React.ComponentProps<typeof Ionicons>["name"]
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
        <Text className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: textSecondary }}>
          {label}
        </Text>
        <Text className="text-sm font-semibold" style={{ color: textPrimary }} numberOfLines={2}>
          {value || "—"}
        </Text>
      </View>
    </View>
  );

  const date = first?.bookingDate ? formatDateShort(first.bookingDate) : "—";
  const time = first?.visitTime ? formatTimeAmPm(first.visitTime) : "—";
  const name = first?.fullName ? String(first.fullName) : "—";
  const mealType = first?.mealType ? String(first.mealType) : "—";
  const mealSpecific = first?.mealSpecificType ? String(first.mealSpecificType) : "—";
  const adults = first?.adultCount != null ? String(first.adultCount) : "—";
  const children = first?.childCount != null ? String(first.childCount) : "—";
  const guestCount = order.guests > 0 ? order.guests : (first ? Number(first.adultCount ?? 0) + Number(first.childCount ?? 0) : 0);
  const totalPrice = first?.totalPrice != null ? `SGD ${first.totalPrice}` : "—";
  const specialRequests = first?.specialRequests ? String(first.specialRequests).trim() : "";

  return (
    <View className="px-4 pt-4">
      {row("date", "Date", date, "calendar-outline")}
      {row("time", "Time", time, "time-outline")}
      {row("name", "Name", name, "person-outline")}
      {row("mealType", "Meal type", mealType, "restaurant-outline")}
      {row("meal", "Meal", mealSpecific, "nutrition-outline")}
      {row("guests", "Guests", String(guestCount), "people-outline")}
      {row("adults", "Adults", adults, "man-outline")}
      {row("children", "Children", children, "happy-outline")}
      {row("total", "Total", totalPrice, "cash-outline")}
      {specialRequests ? row("special", "Special requests", specialRequests, "document-text-outline") : null}

      <TouchableOpacity
        onPress={onClose}
        className="mt-5 py-3.5 rounded-xl flex-row items-center justify-center"
        style={{ backgroundColor: isDark ? "#2A2B30" : "#e5e7eb" }}
        activeOpacity={0.8}
      >
        <Ionicons name="close-circle-outline" size={20} color={textPrimary} style={{ marginRight: 8 }} />
        <Text className="text-base font-semibold" style={{ color: textPrimary }}>
          Close
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
});