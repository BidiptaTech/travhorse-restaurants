import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import PageTitle from "@/components/ui/PageTitle";
import topBgBackground from "@/assets/images/top-bg-shape.png";
import FormField from "@/components/inputFields/FormField";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setCredentials,
  AUTH_LOGIN_ENDPOINT,
  type User,
} from "@/store/slices/authSlice";
import { saveAuth } from "@/utils/authStorage";

const SignIn = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

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

  const handleSignIn = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors in the form");
      return;
    }

    setLoading(true);
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
        Alert.alert("Sign In Failed", message);
        return;
      }

      const token = data?.token ?? data?.data?.token;
      // For restaurant login, payload is under data.data with fields like
      // { id, restaurant_id, name, email, ... }.
      const userPayload = data?.data ?? data?.user ?? data;

      if (!token) {
        Alert.alert("Sign In Failed", "No token received from server.");
        return;
      }

      const user: User = {
        id: String(
          userPayload?.restaurant_id ??
            userPayload?.id ??
            ""
        ),
        email: userPayload?.email ?? email.trim(),
        name: userPayload?.restaurant_name ?? userPayload?.name ?? undefined,
      };

      dispatch(setCredentials({ user, token }));
      // Persist auth so user stays logged in until they sign out.
      saveAuth({ user, token }).catch(() => {});
      router.replace("/(tabs)");
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Network error. Please try again."
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
    </SafeAreaView>
  );
};

export default SignIn;

const styles = StyleSheet.create({});

