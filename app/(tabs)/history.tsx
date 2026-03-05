import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { format, subYears } from "date-fns";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import CalendarPicker from "react-native-calendar-picker";
import { Swipeable } from "react-native-gesture-handler";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useAppSelector } from "../../store/hooks";
import {
    deleteHistoryRange,
    deleteHistoryScan,
    getAllHistoryScans,
    groupScansByDate,
    type GroupedScans,
    type ScanHistoryItem,
} from "../../utils/scanHistoryStorage";
import {
    formatTicketDisplay,
    parseScannedTicket,
} from "../../utils/ticketDisplay";

// DMC dropdown: show 5 rows visible, then scroll for the rest
const DMC_ROW_HEIGHT = 44;
const DMC_VISIBLE_ROWS = 5;
const DMC_LIST_MAX_HEIGHT = DMC_ROW_HEIGHT * DMC_VISIBLE_ROWS;

export default function HistoryScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const user = useAppSelector((s) => s.auth.user);
  const userId = user?.id ?? "";
  const [groupedScans, setGroupedScans] = useState<GroupedScans[]>([]);
  const [deleteScanVisible, setDeleteScanVisible] = useState(false);
  const [scanToDelete, setScanToDelete] = useState<ScanHistoryItem | null>(
    null,
  );
  const openHistorySwipeRef = useRef<Swipeable | null>(null);
  const [bulkDeleteVisible, setBulkDeleteVisible] = useState(false);
  // Voucher redemption report filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedDmc, setSelectedDmc] = useState<string | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarStart, setCalendarStart] = useState<Date | null>(null);
  const [calendarEnd, setCalendarEnd] = useState<Date | null>(null);
  const [dmcDropdownVisible, setDmcDropdownVisible] = useState(false);
  const [dmcSearchQuery, setDmcSearchQuery] = useState("");
  const [dmcTriggerLayout, setDmcTriggerLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const dmcTriggerRef = useRef<View>(null);

  const insets = useSafeAreaInsets();
  const bg = isDark ? "#000000" : "#ffffff";
  const headerBg = isDark ? "#18191C" : "#f8fafc";
  const cardBg = isDark ? "#15161B" : "#f1f5f9";
  const modalBg = isDark ? "#18191C" : "#ffffff";
  const modalBorder = isDark ? "#2A2B30" : "#e2e7eb";
  const textPrimary = isDark ? "#ffffff" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const bottomSafePadding = Math.max(insets.bottom, 24);

  const loadHistory = useCallback(() => {
    if (!userId) {
      setGroupedScans([]);
      return;
    }
    getAllHistoryScans(userId).then((scans) => {
      setGroupedScans(groupScansByDate(scans));
    });
  }, [userId]);

  // Flatten all scans for filtering
  const allScans = useMemo(() => {
    return groupedScans.flatMap((g) => g.scans);
  }, [groupedScans]);

  // Unique DMCs from all scans (parsed from code)
  const dmcNames = useMemo(() => {
    const set = new Set<string>();
    allScans.forEach((scan) => {
      const ticket = parseScannedTicket(scan.code);
      if (ticket?.dmc) set.add(ticket.dmc);
    });
    return Array.from(set).sort();
  }, [allScans]);

  // Filter DMCs by search query (for dropdown)
  const filteredDmcNames = useMemo(() => {
    const q = dmcSearchQuery.trim().toLowerCase();
    if (!q) return dmcNames;
    return dmcNames.filter((name) => name.toLowerCase().includes(q));
  }, [dmcNames, dmcSearchQuery]);

  // Filter scans by date range and DMC
  const filteredScans = useMemo(() => {
    return allScans.filter((scan) => {
      const inDateRange =
        (!dateFrom.trim() || scan.date >= dateFrom.trim()) &&
        (!dateTo.trim() || scan.date <= dateTo.trim());
      if (!inDateRange) return false;
      if (!selectedDmc) return true;
      const ticket = parseScannedTicket(scan.code);
      return ticket?.dmc === selectedDmc;
    });
  }, [allScans, dateFrom, dateTo, selectedDmc]);

  // Filtered report: grouped by date and total amount
  const { filteredGroupedScans, totalAmount } = useMemo(() => {
    const grouped = groupScansByDate(filteredScans);
    const total = filteredScans.reduce((sum, scan) => {
      const ticket = parseScannedTicket(scan.code);
      return sum + (ticket?.p != null ? Number(ticket.p) : 0);
    }, 0);
    return { filteredGroupedScans: grouped, totalAmount: total };
  }, [filteredScans]);

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [loadHistory]),
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
    [userId, loadHistory],
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
          <Text
            className="text-lg font-semibold"
            style={{ color: textPrimary }}
          >
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

      {/* Voucher redemption report – date range & DMC filter */}
      {groupedScans.length > 0 && (
        <View
          className="px-4 py-3"
          style={{ backgroundColor: isDark ? "#1D1F24" : "#f1f5f9" }}
        >
          <Text
            className="text-xs font-semibold mb-2"
            style={{ color: textSecondary }}
          >
            Voucher redemption report
          </Text>
          <TouchableOpacity
            onPress={() => {
              setCalendarStart(
                dateFrom ? new Date(dateFrom + "T00:00:00") : null,
              );
              setCalendarEnd(dateTo ? new Date(dateTo + "T00:00:00") : null);
              setCalendarVisible(true);
            }}
            className="rounded-lg px-3 py-2.5 mb-2 flex-row items-center"
            style={{
              backgroundColor: isDark ? "#0E1014" : "#fff",
              borderWidth: 1,
              borderColor: isDark ? "#2A2B30" : "#e2e8f0",
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={textSecondary}
              style={{ marginRight: 8 }}
            />
            <Text
              className="text-sm flex-1"
              style={{
                color: dateFrom && dateTo ? textPrimary : textSecondary,
              }}
            >
              {dateFrom && dateTo
                ? `${dateFrom} – ${dateTo}`
                : "Select date range"}
            </Text>
            {(dateFrom || dateTo) && (
              <TouchableOpacity
                onPress={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={20} color={textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Date range calendar modal */}
          <Modal
            visible={calendarVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setCalendarVisible(false)}
          >
            <View style={styles.calendarModalBackdrop}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setCalendarVisible(false)}
              />
              <View
                style={[
                  styles.calendarModalCard,
                  {
                    backgroundColor: modalBg,
                    borderColor: modalBorder,
                  },
                ]}
              >
                <View
                  className="px-4 py-3 flex-row items-center justify-between border-b"
                  style={{
                    borderBottomColor: isDark ? "#2A2B30" : "#e2e8f0",
                  }}
                >
                  <Text
                    className="text-lg font-semibold"
                    style={{ color: textPrimary }}
                  >
                    Select date range
                  </Text>
                  <TouchableOpacity
                    onPress={() => setCalendarVisible(false)}
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isDark ? "#2A2B30" : "#e2e8f0",
                    }}
                  >
                    <Ionicons name="close" size={22} color={textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={{ maxHeight: 400 }}
                  contentContainerStyle={{ padding: 16 }}
                  showsVerticalScrollIndicator={false}
                >
                  <CalendarPicker
                    allowRangeSelection
                    startFromMonday
                    minDate={subYears(new Date(), 1)}
                    maxDate={new Date()}
                    selectedStartDate={calendarStart}
                    selectedEndDate={calendarEnd}
                    onDateChange={(date: Date | null, type?: string) => {
                      if (type === "END_DATE") {
                        setCalendarEnd(date);
                      } else {
                        setCalendarStart(date);
                        setCalendarEnd(null);
                      }
                    }}
                    todayBackgroundColor="#1A7F3B"
                    selectedDayColor="#1A7F3B"
                    selectedRangeStyle={{
                      backgroundColor: "rgba(26, 127, 59, 0.25)",
                    }}
                    textStyle={{
                      color: textPrimary,
                    }}
                    todayTextStyle={{
                      color: "#fff",
                    }}
                  />
                </ScrollView>
                <View
                  className="flex-row px-4 pt-2"
                  style={{ gap: 12, paddingBottom: bottomSafePadding + 16 }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setCalendarStart(null);
                      setCalendarEnd(null);
                      setDateFrom("");
                      setDateTo("");
                      setCalendarVisible(false);
                    }}
                    className="flex-1 rounded-xl py-3 items-center justify-center"
                    style={{
                      backgroundColor: isDark ? "#2A2B30" : "#e2e8f0",
                    }}
                  >
                    <Text
                      className="text-base font-semibold"
                      style={{ color: textPrimary }}
                    >
                      Clear
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (calendarStart) {
                        setDateFrom(format(calendarStart, "yyyy-MM-dd"));
                        setDateTo(
                          calendarEnd
                            ? format(calendarEnd, "yyyy-MM-dd")
                            : format(calendarStart, "yyyy-MM-dd"),
                        );
                      }
                      setCalendarVisible(false);
                    }}
                    className="flex-1 rounded-xl py-3 items-center justify-center bg-[#1A7F3B]"
                  >
                    <Text className="text-base font-semibold text-white">
                      Apply
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          {dmcNames.length > 0 && (
            <>
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
                    backgroundColor: isDark ? "#0E1014" : "#fff",
                    borderWidth: 1,
                    borderColor: isDark ? "#2A2B30" : "#e2e8f0",
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
                            ? "rgba(26, 127, 59, 0.15)"
                            : "transparent",
                      }}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{
                          color: selectedDmc === null ? "#1A7F3B" : textPrimary,
                        }}
                      >
                        All DMC
                      </Text>
                    </TouchableOpacity>
                    {filteredDmcNames.map((dmc) => (
                      <TouchableOpacity
                        key={dmc}
                        onPress={() => {
                          setSelectedDmc(dmc);
                          setDmcDropdownVisible(false);
                          setDmcSearchQuery("");
                        }}
                        className="px-3 rounded-lg justify-center"
                        style={{
                          height: DMC_ROW_HEIGHT,
                          backgroundColor:
                            selectedDmc === dmc
                              ? "rgba(26, 127, 59, 0.15)"
                              : "transparent",
                        }}
                      >
                        <Text
                          className="text-sm"
                          style={{
                            color:
                              selectedDmc === dmc ? "#1A7F3B" : textPrimary,
                          }}
                          numberOfLines={1}
                        >
                          {dmc}
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
            </>
          )}
          <View
            className="mt-3 rounded-xl px-4 py-3 flex-row items-center justify-between"
            style={{
              backgroundColor: isDark ? "#0E1014" : "#fff",
              borderWidth: 1,
              borderColor: "#1A7F3B",
            }}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: textPrimary }}
            >
              Total amount
            </Text>
            <Text className="text-lg font-bold" style={{ color: "#1A7F3B" }}>
              SGD {totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredGroupedScans.length === 0 ? (
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
              {groupedScans.length === 0
                ? "Scan history"
                : "No redemptions in this range"}
            </Text>
            <Text
              className="text-sm text-center px-6"
              style={{ color: textSecondary }}
            >
              {groupedScans.length === 0
                ? "Your scanned tickets will appear here."
                : "Try a different date range or DMC filter."}
            </Text>
          </View>
        ) : (
          filteredGroupedScans.map((group) => (
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
                          openHistorySwipeRef.current &&
                          openHistorySwipeRef.current !== rowRef
                        ) {
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
                          const { title, subtitle } = formatTicketDisplay(
                            scan.code,
                          );
                          const ticket = parseScannedTicket(scan.code);
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
                                      backgroundColor: "rgba(26, 127, 59, 0.2)",
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
                                  ? `${scan.time} • ${subtitle}`
                                  : scan.time}
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
              {scanToDelete &&
                (() => {
                  const { title, subtitle } = formatTicketDisplay(
                    scanToDelete.code,
                  );
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
              <Text className="text-xs" style={{ color: textSecondary }}>
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
                <Text
                  className="text-sm font-semibold"
                  style={{ color: "#ef4444" }}
                >
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
  calendarModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  calendarModalCard: {
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
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
