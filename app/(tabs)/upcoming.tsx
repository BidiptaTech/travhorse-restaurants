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
import { fetchRestaurantOrders, type UpcomingOrder } from "@/store/slices/ordersSlice";

export default function UpcomingScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const dispatch = useAppDispatch();
  const { upcoming: tickets, loading, error } = useAppSelector((s) => s.orders);

  const bg = isDark ? "#000000" : "#ffffff";
  const headerBg = isDark ? "#18191C" : "#f8fafc";
  const cardBg = isDark ? "#15161B" : "#e0f2fe";
  const textPrimary = isDark ? "#ffffff" : "#0f172a";
  const textSecondary = isDark ? "#9ca3af" : "#1d4ed8";
  const modalBg = isDark ? "#18191C" : "#ffffff";
  const modalBorder = isDark ? "#2A2B30" : "#e5e7eb";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<UpcomingOrder | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchRestaurantOrders());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchRestaurantOrders());
    setRefreshing(false);
  };

  const filteredTickets = tickets.filter((t) =>
    t.ticketId.toLowerCase().includes(searchQuery.trim().toLowerCase())
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
          Upcoming events
        </Text>
      </View>

      <View className="px-4 pt-3 pb-2" style={{ backgroundColor: bg }}>
        <View
          className="flex-row items-center rounded-xl px-3 py-2.5"
          style={{
            backgroundColor: isDark ? "#1D1F24" : "#e0f2fe",
          }}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Search by ticket ID"
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
        {filteredTickets.map((ticket) => (
          <TouchableOpacity
            key={ticket.id}
            className="mb-3 rounded-xl px-4 py-3 flex-row items-center"
            style={{ backgroundColor: cardBg }}
            activeOpacity={0.85}
            onPress={() => setSelectedTicket(ticket)}
          >
            <View className="w-9 h-9 rounded-full bg-[#2563eb] items-center justify-center mr-3">
              <Ionicons name="calendar-outline" size={20} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text
                className="text-xs font-mono mb-0.5"
                style={{ color: textSecondary }}
              >
                {ticket.ticketId}
              </Text>
              <Text
                className="text-sm font-semibold mb-0.5"
                style={{ color: textPrimary }}
              >
                {ticket.event}
              </Text>
              <Text
                className="text-[11px]"
                style={{ color: textSecondary }}
              >
                {ticket.date} · {ticket.guests} guests
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {filteredTickets.length === 0 && (
          <View className="items-center justify-center mt-16">
            <Ionicons
              name={searchQuery.trim() ? "search-outline" : "calendar-outline"}
              size={32}
              color={textSecondary}
            />
            <Text
              className="text-sm mt-2 text-center"
              style={{ color: textSecondary }}
            >
              {searchQuery.trim()
                ? `No tickets found for "${searchQuery.trim()}"`
                : "No upcoming events scheduled."}
            </Text>
          </View>
        )}
        </>
        )}
      </ScrollView>

      {/* Ticket detail modal */}
      <Modal
        visible={!!selectedTicket}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTicket(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedTicket(null)}
          />
          {selectedTicket && (
            <View
              style={[
                styles.modalCard,
                { backgroundColor: modalBg, borderColor: modalBorder },
              ]}
            >
              {/* Header */}
              <View
                className="px-4 pt-5 pb-4"
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#2A2B30" : "#e5e7eb",
                }}
              >
                <View className="flex-row items-center mb-3">
                  <View className="w-12 h-12 rounded-xl bg-[#2563eb] items-center justify-center mr-3">
                    <Ionicons name="ticket-outline" size={26} color="#ffffff" />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-[11px] font-mono uppercase tracking-wide mb-0.5"
                      style={{ color: textSecondary }}
                    >
                      Ticket ID
                    </Text>
                    <Text
                      className="text-base font-bold"
                      style={{ color: textPrimary }}
                    >
                      {selectedTicket.ticketId}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="calendar" size={16} color={textSecondary} style={{ marginRight: 6 }} />
                  <Text className="text-sm font-semibold" style={{ color: textPrimary }}>
                    {selectedTicket.event}
                  </Text>
                </View>
              </View>

              {/* Details with icons */}
              <View className="px-4 py-4">
                <View
                  className="flex-row items-center py-3 rounded-xl px-3 mb-2"
                  style={{ backgroundColor: isDark ? "#1D1F24" : "#f0f9ff" }}
                >
                  <View className="w-9 h-9 rounded-lg bg-[#2563eb]/15 items-center justify-center mr-3">
                    <Ionicons name="person-outline" size={18} color="#2563eb" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] uppercase tracking-wide" style={{ color: textSecondary }}>
                      Guest name
                    </Text>
                    <Text className="text-sm font-semibold" style={{ color: textPrimary }}>
                      {selectedTicket.holder}
                    </Text>
                  </View>
                </View>

                <View
                  className="flex-row items-center py-3 rounded-xl px-3 mb-2"
                  style={{ backgroundColor: isDark ? "#1D1F24" : "#f0f9ff" }}
                >
                  <View className="w-9 h-9 rounded-lg bg-[#2563eb]/15 items-center justify-center mr-3">
                    <Ionicons name="calendar-outline" size={18} color="#2563eb" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] uppercase tracking-wide" style={{ color: textSecondary }}>
                      Event date
                    </Text>
                    <Text className="text-sm font-semibold" style={{ color: textPrimary }}>
                      {selectedTicket.date}
                    </Text>
                  </View>
                </View>

                <View
                  className="flex-row items-center py-3 rounded-xl px-3"
                  style={{ backgroundColor: isDark ? "#1D1F24" : "#f0f9ff" }}
                >
                  <View className="w-9 h-9 rounded-lg bg-[#2563eb]/15 items-center justify-center mr-3">
                    <Ionicons name="people-outline" size={18} color="#2563eb" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] uppercase tracking-wide" style={{ color: textSecondary }}>
                      Guests
                    </Text>
                    <Text className="text-sm font-semibold" style={{ color: textPrimary }}>
                      {selectedTicket.guests}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="px-4 pb-5 pt-1 flex-row justify-end">
                <TouchableOpacity
                  onPress={() => setSelectedTicket(null)}
                  className="flex-row items-center px-5 py-2.5 rounded-xl"
                  style={{
                    backgroundColor: isDark ? "#2A2B30" : "#e5e7eb",
                  }}
                >
                  <Ionicons name="close-outline" size={18} color={textPrimary} style={{ marginRight: 6 }} />
                  <Text className="text-sm font-semibold" style={{ color: textPrimary }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
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
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
});

