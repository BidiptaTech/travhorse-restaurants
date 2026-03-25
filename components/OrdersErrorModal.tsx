import type { OrdersFetchError, OrdersErrorKind } from "@/store/slices/ordersSlice";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const KIND_VISUAL: Record<
  OrdersErrorKind,
  { icon: React.ComponentProps<typeof Ionicons>["name"]; accent: string; tint: string }
> = {
  session: {
    icon: "shield-half-outline",
    accent: "#D62828",
    tint: "rgba(214, 40, 40, 0.15)",
  },
  server: {
    icon: "cloud-offline-outline",
    accent: "#EA580C",
    tint: "rgba(234, 88, 12, 0.15)",
  },
  not_found: {
    icon: "compass-outline",
    accent: "#D97706",
    tint: "rgba(217, 119, 6, 0.15)",
  },
  generic: {
    icon: "alert-circle-outline",
    accent: "#6B7280",
    tint: "rgba(107, 114, 128, 0.15)",
  },
};

type OrdersErrorModalProps = {
  visible: boolean;
  error: OrdersFetchError | null;
  isDark: boolean;
  /** Primary action color (e.g. tab accent) */
  primaryTint: string;
  onDismiss: () => void;
};

export function OrdersErrorModal({
  visible,
  error,
  isDark,
  primaryTint,
  onDismiss,
}: OrdersErrorModalProps) {
  const modalBg = isDark ? "#18191C" : "#ffffff";
  const modalBorder = isDark ? "#2A2B30" : "#e5e7eb";
  const textPrimary = isDark ? "#ffffff" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";

  const visual = useMemo(() => {
    if (!error) return KIND_VISUAL.generic;
    return KIND_VISUAL[error.kind] ?? KIND_VISUAL.generic;
  }, [error]);

  if (!error) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: modalBg,
              borderColor: modalBorder,
            },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: visual.tint }]}>
            <Ionicons name={visual.icon} size={36} color={visual.accent} />
          </View>
          <Text style={[styles.title, { color: textPrimary }]}>{error.title}</Text>
          <Text style={[styles.message, { color: textSecondary }]}>
            {error.message}
          </Text>
          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.85}
            style={[styles.button, { backgroundColor: primaryTint }]}
          >
            <Text style={styles.buttonLabel}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 22,
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
