import React, { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function TicketScannerHome() {
  const [scanVisible, setScanVisible] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

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
      setScanVisible(false);
      setLastScanned(data);
      Alert.alert("Ticket scanned", data, [{ text: "OK" }]);
    },
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-3 bg-[#18191C] flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity className="mr-3">
              <Ionicons name="menu" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-semibold">
              Ticket Scanner
            </Text>
          </View>
          <View className="relative">
            <TouchableOpacity className="w-9 h-9 rounded-full bg-[#2A2B30] items-center justify-center">
              <Ionicons name="notifications-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
            <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 items-center justify-center">
              <Text className="text-white text-[10px] font-bold">2</Text>
            </View>
          </View>
        </View>

        <View className="px-4 pt-4 bg-[#121317] flex-1">
          {/* Event banner */}
          <View className="rounded-lg bg-[#7A1D23] px-4 py-3 mb-4">
            <Text className="text-xs text-white opacity-80 mb-1">
              Event
            </Text>
            <Text className="text-white text-base font-semibold">
              Wine Tasting Night
            </Text>
          </View>

          {/* Stats row */}
          <View className="flex-row mb-4">
            <View className="flex-1 mr-2 rounded-lg bg-[#1D1F24] px-4 py-3">
              <Text className="text-xs text-gray-300 mb-1">
                Tickets Scanned
              </Text>
              <Text className="text-base text-white font-semibold">
                128 <Text className="text-gray-400 text-sm">/ 200</Text>
              </Text>
            </View>
            <View className="w-20 rounded-lg bg-[#1D1F24] px-3 py-3 items-center justify-center">
              <Text className="text-xs text-gray-300 mb-1">Pending</Text>
              <Text className="text-xl text-white font-semibold">14</Text>
            </View>
          </View>

          {/* QR preview card */}
          <View className="rounded-xl bg-[#15161B] p-4 mb-4">
            <View
              style={styles.qrPlaceholder}
              className="items-center justify-center rounded-lg bg-[#0E1014]"
            >
              <Ionicons name="qr-code" size={96} color="#ffffff" />
              {lastScanned ? (
                <Text
                  className="absolute bottom-3 left-3 right-3 text-center text-green-400 text-xs"
                  numberOfLines={2}
                >
                  Last: {lastScanned}
                </Text>
              ) : null}
            </View>
            <Text className="mt-3 text-center text-gray-300 text-xs">
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

          {/* Action buttons */}
          <View className="flex-row justify-between mb-5">
            <TouchableOpacity className="flex-1 mr-2 bg-[#1D1F24] rounded-lg py-3 items-center">
              <Text className="text-xs text-gray-300 mb-1">Manual</Text>
              <Text className="text-white text-xs font-semibold">
                Check-In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 mx-1 bg-[#1D1F24] rounded-lg py-3 items-center">
              <Text className="text-xs text-gray-300 mb-1">Guest</Text>
              <Text className="text-white text-xs font-semibold">List</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 ml-2 bg-[#1D1F24] rounded-lg py-3 items-center">
              <Text className="text-xs text-gray-300 mb-1">Invalid</Text>
              <Text className="text-white text-xs font-semibold">
                Tickets
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent tickets */}
          <Text className="text-sm text-gray-200 font-semibold mb-2">
            Recent Tickets
          </Text>

          <View className="rounded-lg bg-[#15161B] p-3 mb-2 flex-row items-center">
            <View className="w-7 h-7 rounded-full bg-[#1A7F3B] items-center justify-center mr-3">
              <Ionicons name="checkmark" size={16} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-white font-semibold">
                Checked In: Sarah Johnson · VIP Pass
              </Text>
              <Text className="text-xs text-gray-300">2 Guests</Text>
            </View>
            <Text className="text-xs text-gray-400">04:32 PM</Text>
          </View>

          <View className="rounded-lg bg-[#15161B] p-3 flex-row items-center">
            <View className="w-7 h-7 rounded-full bg-[#962528] items-center justify-center mr-3">
              <Ionicons name="close" size={16} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-red-400 font-semibold">
                Invalid Ticket: Mark Stevens
              </Text>
              <Text className="text-xs text-gray-300">
                Booking Not Found
              </Text>
            </View>
            <Text className="text-xs text-gray-400">04:28 PM</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  qrPlaceholder: {
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2C33",
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: "rgba(214, 40, 40, 0.8)",
    borderRadius: 24,
    margin: 48,
    backgroundColor: "transparent",
  },
});

