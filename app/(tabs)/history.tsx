import React, { useState, useCallback, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";
import { useAppSelector } from "../../store/hooks";
import {
  getAllHistoryScans,
  groupScansByDate,
  deleteHistoryScan,
  deleteHistoryRange,
  type GroupedScans,
  type ScanHistoryItem,
} from "../../utils/scanHistoryStorage";
import { formatTicketDisplay } from "../../utils/ticketDisplay";

export default function HistoryScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const user = useAppSelector((s) => s.auth.user);
  const userId = user?.id ?? "";
  const [groupedScans, setGroupedScans] = useState<GroupedScans[]>([]);
  const [deleteScanVisible, setDeleteScanVisible] = useState(false);
  const [scanToDelete, setScanToDelete] = useState<ScanHistoryItem | null>(null);
  const openHistorySwipeRef = useRef<Swipeable | null>(null);
  const [bulkDeleteVisible, setBulkDeleteVisible] = useState(false);

  const bg = isDark ? "#000000" : "#ffffff";
  const headerBg = isDark ? "#18191C" : "#f8fafc";
  const cardBg = isDark ? "#15161B" : "#f1f5f9";
  const modalBg = isDark ? "#18191C" : "#ffffff";
  const modalBorder = isDark ? "#2A2B30" : "#e2e7eb";
  const textPrimary = isDark ? "#ffffff" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";

  const loadHistory = useCallback(() => {
    if (!userId) {
      setGroupedScans([]);
      return;
    }
    getAllHistoryScans(userId).then((scans) => {
      setGroupedScans(groupScansByDate(scans));
    });
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const onConfirmDeleteScan = useCallback(async () => {
    if (scanToDelete && userId) {
      await deleteHistoryScan(userId, scanToDelete.timestamp);
      loadHistory();
    }
    setDeleteScanVisible(false);
    setScanToDelete(null);
  }, [scanToDelete, userId, loadHistory]);

  const onDismissDeleteScan = useCallback(() => {
    setDeleteScanVisible(false);
    setScanToDelete(null);
  }, []);

  const handleBulkDelete = useCallback(
    async (range: "today" | "7d" | "1m" | "3m" | "all") => {
      if (userId) {
        await deleteHistoryRange(userId, range);
        loadHistory();
      }
      setBulkDeleteVisible(false);
    },
    [userId, loadHistory]
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: bg }}>
      <View
        className="px-4 py-3 flex-row items-center justify-between"
        style={{ backgroundColor: headerBg }}
      >
        <View className="flex-row items-center">
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
            History
          </Text>
        </View>
        {groupedScans.length > 0 && (
          <TouchableOpacity
            onPress={() => setBulkDeleteVisible(true)}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: isDark ? "#2A2B30" : "#e5e7eb" }}
          >
            <Ionicons
              name="trash-bin-outline"
              size={18}
              color={isDark ? "#fef2f2" : "#b91c1c"}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {groupedScans.length === 0 ? (
          <View className="items-center justify-center mt-16">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: isDark ? "#2A2B30" : "#e5e7eb" }}
            >
              <Ionicons name="time-outline" size={32} color={textSecondary} />
            </View>
            <Text
              className="text-base font-semibold mb-1"
              style={{ color: textPrimary }}
            >
              Scan history
            </Text>
            <Text
              className="text-sm text-center px-6"
              style={{ color: textSecondary }}
            >
              Your scanned tickets will appear here.
            </Text>
          </View>
        ) : (
          groupedScans.map((group) => (
            <View key={group.date} className="mb-6">
              <Text
                className="text-sm font-semibold mb-3 px-1"
                style={{ color: textPrimary }}
              >
                {group.label}
              </Text>
              {group.scans.map((scan, index) => {
                const renderRightActions = () => (
                  <View
                    className="rounded-lg mb-2 flex-row items-center justify-end pr-4"
                    style={{ backgroundColor: "#ef4444", width: 80 }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setScanToDelete(scan);
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
                        if (openHistorySwipeRef.current && openHistorySwipeRef.current !== rowRef) {
                          openHistorySwipeRef.current.close();
                        }
                        openHistorySwipeRef.current = rowRef;
                      }
                    }}
                    key={`${scan.code}-${scan.timestamp}-${index}`}
                    renderRightActions={renderRightActions}
                    overshootRight={false}
                  >
                    <TouchableOpacity
                      onLongPress={() => {
                        setScanToDelete(scan);
                        setDeleteScanVisible(true);
                      }}
                      className="rounded-lg p-3 mb-2 flex-row items-center"
                      style={{ backgroundColor: cardBg }}
                      activeOpacity={0.7}
                    >
                      <View className="w-7 h-7 rounded-full bg-[#1A7F3B] items-center justify-center mr-3">
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                      </View>
                      <View className="flex-1">
                        {(() => {
                          const { title, subtitle } = formatTicketDisplay(scan.code);
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
                                {subtitle ? `${scan.time} • ${subtitle}` : scan.time}
                              </Text>
                            </>
                          );
                        })()}
                      </View>
                    </TouchableOpacity>
                  </Swipeable>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Delete scan confirmation modal */}
      <Modal
        visible={deleteScanVisible}
        transparent
        animationType="fade"
        onRequestClose={onDismissDeleteScan}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onDismissDeleteScan}
          />
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: modalBg,
                borderColor: modalBorder,
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
              {scanToDelete && (() => {
                const { title, subtitle } = formatTicketDisplay(scanToDelete.code);
                return (
                  <Text
                    className="text-xs mt-2 px-4 py-2 rounded-lg"
                    style={{
                      color: textSecondary,
                      backgroundColor: isDark ? "#0E1014" : "#f1f5f9",
                    }}
                    numberOfLines={2}
                  >
                    {subtitle ? `${title} • ${subtitle}` : title}
                  </Text>
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

      {/* Bulk delete modal */}
      <Modal
        visible={bulkDeleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBulkDeleteVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setBulkDeleteVisible(false)}
          />
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: modalBg,
                borderColor: modalBorder,
              },
            ]}
          >
            <View className="px-4 pt-4 pb-2 border-b border-gray-700/50">
              <Text
                className="text-lg font-bold mb-1"
                style={{ color: textPrimary }}
              >
                Clear history
              </Text>
              <Text
                className="text-xs"
                style={{ color: textSecondary }}
              >
                Choose how much of your scan history to delete.
              </Text>
            </View>
            <View className="px-4 py-2">
              <TouchableOpacity
                className="py-3 flex-row items-center"
                onPress={() => handleBulkDelete("today")}
              >
                <Ionicons
                  name="sunny-outline"
                  size={18}
                  color={isDark ? "#f97316" : "#ea580c"}
                  style={{ marginRight: 10 }}
                />
                <Text className="text-sm" style={{ color: textPrimary }}>
                  Delete today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="py-3 flex-row items-center"
                onPress={() => handleBulkDelete("7d")}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={isDark ? "#38bdf8" : "#0284c7"}
                  style={{ marginRight: 10 }}
                />
                <Text className="text-sm" style={{ color: textPrimary }}>
                  Delete last 7 days
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="py-3 flex-row items-center"
                onPress={() => handleBulkDelete("1m")}
              >
                <Ionicons
                  name="calendar-number-outline"
                  size={18}
                  color={isDark ? "#a855f7" : "#7c3aed"}
                  style={{ marginRight: 10 }}
                />
                <Text className="text-sm" style={{ color: textPrimary }}>
                  Delete last 1 month
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="py-3 flex-row items-center"
                onPress={() => handleBulkDelete("3m")}
              >
                <Ionicons
                  name="calendar-sharp"
                  size={18}
                  color={isDark ? "#facc15" : "#ca8a04"}
                  style={{ marginRight: 10 }}
                />
                <Text className="text-sm" style={{ color: textPrimary }}>
                  Delete last 3 months
                </Text>
              </TouchableOpacity>
              <View className="h-px bg-gray-700/50 my-2" />
              <TouchableOpacity
                className="py-3 flex-row items-center"
                onPress={() => handleBulkDelete("all")}
              >
                <Ionicons
                  name="trash-bin-outline"
                  size={18}
                  color="#ef4444"
                  style={{ marginRight: 10 }}
                />
                <Text className="text-sm font-semibold" style={{ color: "#ef4444" }}>
                  Delete all time
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
