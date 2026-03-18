import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import PageTitle from "@/components/ui/PageTitle";
import topBgBackground from "@/assets/images/top-bg-shape.png";
import FormField from "@/components/inputFields/FormField";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  AUTH_LOGIN_ENDPOINT,
  setCredentials,
  type User,
} from "@/store/slices/authSlice";
import { saveAuth } from "@/utils/authStorage";

const primary = "#613BFF";

const SignIn = () => {
  const dispatch = useAppDispatch();
  const { colorScheme } = useColorScheme();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [loginErrorVisible, setLoginErrorVisible] = useState(false);
  const [loginErrorTitle, setLoginErrorTitle] = useState("Sign In Failed");
  const [loginErrorMessage, setLoginErrorMessage] = useState("");

  const isDark = colorScheme === "dark";
  const modalBg = isDark ? "#18191C" : "#ffffff";
  const modalBorder = isDark ? "#2A2B30" : "#e2e7eb";
  const textPrimary = isDark ? "#ffffff" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";

  // If already logged in (restored from storage), skip Sign In.
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const nextErrors = { email: "", password: "" };

    if (!email.trim()) {
      nextErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(email)) {
      nextErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(nextErrors);
    return isValid;
  };

  const showLoginError = (title: string, message: string) => {
    setLoginErrorTitle(title);
    setLoginErrorMessage(message);
    setLoginErrorVisible(true);
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      showLoginError(
        "Validation Error",
        "Please fix the errors in the form before signing in.",
      );
      return;
    }

    setLoading(true);
    setLoginErrorVisible(false);
    try {
      const res = await fetch(AUTH_LOGIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      console.log("[Login] response", { status: res.status, data });

      if (!res.ok) {
        const message =
          data?.message || data?.error || `Login failed (${res.status})`;
        showLoginError("Sign In Failed", message);
        return;
      }

      const token = data?.token ?? data?.data?.token;
      // For restaurant login, payload is under data.data with fields like
      // { id, restaurant_id, name, email, ... }.
      const userPayload = data?.data ?? data?.user ?? data;

      if (!token) {
        showLoginError(
          "Sign In Failed",
          "No token received from server. Please try again.",
        );
        return;
      }

      // const user: User = {
      //   id: String(
      //     userPayload?.restaurant_id ??
      //       userPayload?.id ??
      //       ""
      //   ),
      //   email: userPayload?.email ?? email.trim(),
      //   name: userPayload?.restaurant_name ?? userPayload?.name ?? undefined,

      // };
      const user: User = {
        id: String(
          userPayload?.restaurant_id ??
          userPayload?.id ??
          ""
        ),
        email: userPayload?.restaurant_email ?? email.trim(),
        name: userPayload?.restaurant_name ?? userPayload?.name ?? undefined,
        image: userPayload?.profile_image ?? undefined,
        dmcUsers: userPayload?.dmcDetails?.map((dmc: any) => ({
          id: String(dmc.userId),
          email: dmc.email,
          name: dmc.name,
          dmc: dmc.dmc || "No DMC",
        })) ?? [],
      };

      dispatch(setCredentials({ user, token }));
      // Persist auth so user stays logged in until they sign out.
      saveAuth({ user, token }).catch(() => {});
      router.replace("/(tabs)");
    } catch (err) {
      showLoginError(
        "Error",
        err instanceof Error ? err.message : "Network error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-b50 dark:bg-n50">
      <ScrollView className="flex-1">
        <View className="pb-16">
          <View className="absolute w-full top-0 left-0 right-0">
            <Image
              source={topBgBackground}
              className="w-full h-[250px] -mt-20"
            />
          </View>
          <PageTitle pageName="Sign In" backTo="/(screens)/OnBoardingSlider" />
        </View>

        <View className="pt-14 px-6">
        <Text className="text-sm text-n400 dark:text-n500">
             Welcome! Scan and redeem restaurant vouchers quickly, verify guests, and keep your check-ins running smoothly.
        </Text>
          <View className="pt-7">
            <FormField
              isTitle={true}
              title="Email"
              placeholder="Enter email"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors({ ...errors, email: "" });
                }
              }}
              error={errors.email}
              compact
            />
          </View>
          <View className="pt-4">
            <FormField
              isTitle={true}
              title="Password"
              placeholder="******"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors({ ...errors, password: "" });
                }
              }}
              error={errors.password}
              compact
            />
          </View>
        </View>

        <View className="pt-12 px-6 pb-8">
          <View className="pb-7">
            <TouchableOpacity
              onPress={handleSignIn}
              disabled={loading}
              className="w-full rounded-xl py-3 bg-p1 items-center justify-center"
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="font-semibold text-white">Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Login error modal – well designed */}
      <Modal
        visible={loginErrorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLoginErrorVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setLoginErrorVisible(false)}
          />
          <View
            style={[
              styles.modalCard,
              { backgroundColor: modalBg, borderColor: modalBorder },
            ]}
          >
            <View style={styles.errorIconWrap}>
              <View
                style={[
                  styles.errorIconCircle,
                  {
                    backgroundColor: isDark
                      ? "rgba(239, 68, 68, 0.2)"
                      : "rgba(239, 68, 68, 0.12)",
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed"
                  size={48}
                  color="#dc2626"
                />
              </View>
            </View>
            <Text style={[styles.errorTitle, { color: textPrimary }]}>
              {loginErrorTitle}
            </Text>
            <Text
              style={[styles.errorMessage, { color: textSecondary }]}
            >
              {loginErrorMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setLoginErrorVisible(false)}
              style={[styles.errorButton, { backgroundColor: primary }]}
              activeOpacity={0.85}
            >
              <Text style={styles.errorButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: "center",
  },
  errorIconWrap: {
    marginBottom: 20,
  },
  errorIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  errorButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});

