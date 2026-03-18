import PageTitle from "@/components/ui/PageTitle";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import { PhCaretRight } from "../../assets/icons/CaretRight";
import { PhSignOut } from "../../assets/icons/SignOut";
import { PhEye } from "../../assets/icons/eye";
import logoutModalBgDark from "../../assets/images/logout-modal-bg-dark.png";
import logoutModalBg from "../../assets/images/logout-modal-bg-white.png";
import topBgBackground2 from "../../assets/images/top-bg-shape2.png";
import { AppDispatch } from "../../store";
import { useAppSelector } from "../../store/hooks";
import {
  deleteAccount,
  updateRestaurant,
} from "../../store/slices/accountSlice";
import {
  AUTH_LOGOUT_ENDPOINT,
  signOut,
  updateUser,
} from "../../store/slices/authSlice";
import {
  clearAuth,
  loadAuth,
  setStoredProfileImage,
  updateStoredAuthUser,
} from "../../utils/authStorage";
import { setStoredTheme } from "../../utils/themeStorage";

const Account = () => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [logoutModal, setLogoutModal] = useState(false);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [dmcModalVisible, setDmcModalVisible] = useState(false);
  const [profileImageLoading, setProfileImageLoading] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSuccessModalVisible, setPasswordSuccessModalVisible] =
    useState(false);
  const [profileImageErrorModalMessage, setProfileImageErrorModalMessage] =
    useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);

  const isDark = colorScheme === "dark";
  const textPrimary = isDark ? "#ffffff" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const modalBg = isDark ? "#18191C" : "#ffffff";
  const modalBorder = isDark ? "#2A2B30" : "#e2e7eb";
  const primary = "#613BFF";
  const divider = isDark ? "#2A2B30" : "#e5e7eb";

  const toggleColorScheme = () => {
    setThemeModalVisible(true);
  };

  const setTheme = useCallback(
    (theme: "light" | "dark") => {
      setColorScheme(theme);
      setStoredTheme(theme);
      setThemeModalVisible(false);
    },
    [setColorScheme],
  );

  const handleShareApp = useCallback(() => {
    Share.share({
      message:
        "Check out this restaurant ticket checker app I'm using to scan and validate tickets.",
    }).catch(() => {});
  }, []);

  const onConfirmSignOut = useCallback(async () => {
    setLogoutModal(false);
    setLogoutLoading(true);

    const auth = await loadAuth();
    const authToken = auth?.token ?? token;

    if (authToken) {
      try {
        await fetch(AUTH_LOGOUT_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });
      } catch (error) {
        console.warn("Logout API call failed:", error);
        // Still sign out locally
      }
    }

    dispatch(signOut());
    clearAuth(user?.id).catch(() => {});
    setLogoutLoading(false);
    router.replace("/(auth-pages)/SignIn");
  }, [dispatch, token, user?.id]);

  const handleLogout = async () => {
    onConfirmSignOut();
  };

  const handleDeleteAccount = async () => {
    // Validate password
    if (!deletePassword.trim()) {
      setDeletePasswordError("Please enter your password");
      return;
    }

    // Clear password error
    setDeletePasswordError("");
    setDeleteLoading(true);

    console.log("=== DELETE ACCOUNT DEBUG ===");
    console.log("User object:", user);
    console.log("User email:", user?.email);
    console.log("User guest_id:", user?.guest_id);
    console.log("User token exists:", !!token);
    console.log(
      "User token (first 20 chars):",
      token ? token.substring(0, 20) + "..." : "NO TOKEN",
    );

    try {
      const result = await dispatch(
        deleteAccount({
          password: deletePassword,
          email: user?.email || "",
          guest_id: user?.guest_id || "",
        }),
      );

      console.log("Delete account result:", result);

      if (deleteAccount.fulfilled.match(result)) {
        // Account deleted successfully
        console.log("Account deleted successfully!");
        setDeleteLoading(false);
        setDeleteAccountModal(false);
        setDeletePassword("");
        setDeletePasswordError("");
        // Use router.replace to prevent back navigation
        router.replace("/(auth-pages)/SignIn");
      } else if (deleteAccount.rejected.match(result)) {
        console.error("Delete account rejected:", result.payload);
        setDeleteLoading(false);
      }
    } catch (error) {
      console.error("Delete account error:", error);
      setDeleteLoading(false);
    }
  };

  const restaurantId = user?.id ?? "";

  const pickProfileImage = useCallback(async () => {
    if (!restaurantId) {
      Alert.alert(
        "Restaurant ID missing",
        "Your account is missing a restaurant ID. Please sign out and sign in again.",
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow access to your photos to change profile image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];

    setProfileImageLoading(true);
    try {
      const res = await dispatch(
        updateRestaurant({
          restaurant_id: restaurantId,
          profile_image: {
            uri: asset.uri,
            name: "profile.jpg",
            type: asset.mimeType ?? "image/jpeg",
          },
        }),
      );

      if (updateRestaurant.fulfilled.match(res)) {
        const payload = res.payload as
          | { image_url?: string; profile_image?: string }
          | undefined;
        const returnedImage = payload?.image_url ?? payload?.profile_image;

        if (returnedImage) {
          dispatch(updateUser({ image: returnedImage }));
          // Persist across refresh (per user).
          setStoredProfileImage(restaurantId, returnedImage).catch(() => {});
          updateStoredAuthUser({ image: returnedImage }).catch(() => {});
        } else {
          // Fallback: show immediate preview but do NOT persist local file URI.
          dispatch(updateUser({ image: asset.uri }));
        }
      } else if (updateRestaurant.rejected.match(res)) {
        const message =
          (res.payload as string) ?? "Failed to update profile image.";
        setProfileImageErrorModalMessage(
          message.includes("413") || message.toLowerCase().includes("too large")
            ? "The photo is too large. Please choose a smaller image (under 2 MB) or take a new photo."
            : message,
        );
      }
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to update profile image.";
      setProfileImageErrorModalMessage(
        msg.includes("413") || msg.toLowerCase().includes("too large")
          ? "The photo is too large. Please choose a smaller image (under 2 MB) or take a new photo."
          : msg,
      );
    } finally {
      setProfileImageLoading(false);
    }
  }, [dispatch, restaurantId]);

  const handleChangePassword = useCallback(async () => {
    if (!restaurantId) {
      setPasswordError(
        "Your account is missing a restaurant ID. Please sign out and sign in again.",
      );
      return;
    }

    setPasswordError("");

    if (!currentPassword.trim()) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await dispatch(
        updateRestaurant({
          restaurant_id: restaurantId,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      );

      if (updateRestaurant.fulfilled.match(res)) {
        setChangePasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
        setPasswordSuccessModalVisible(true);
      } else if (updateRestaurant.rejected.match(res)) {
        setPasswordError(
          (res.payload as string) ?? "Failed to update password.",
        );
      }
    } catch (e) {
      setPasswordError("Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  }, [dispatch, restaurantId, currentPassword, newPassword, confirmPassword]);
  return (
    <View className="bg-b50 min-h-full dark:bg-n50 dark:text-white">
      <ScrollView className="">
        <View className="">
          <View className=" absolute top-0 left-0 right-0   ">
            <Image source={topBgBackground2} className="w-full h-[209px]  " />
          </View>
          <PageTitle pageName="Account" hideBackBautton={true} />
        </View>
        <View className="flex items-center justify-center flex-col gap-y-2 pt-4">
          <Pressable
            onPress={profileImageLoading ? undefined : pickProfileImage}
          >
            <View className="relative">
              {user?.image ? (
                <Image
                  source={{ uri: user.image }}
                  alt=""
                  className="w-[140px] h-[140px] rounded-full object-cover"
                />
              ) : (
                <View className="w-[140px] h-[140px] rounded-full bg-gray-200 dark:bg-n100 items-center justify-center">
                  <Ionicons name="person" size={70} color="#a6a6a6" />
                </View>
              )}
              {profileImageLoading && (
                <View className="absolute inset-0 items-center justify-center rounded-full bg-black/40">
                  <ActivityIndicator color="#ffffff" />
                </View>
              )}
              {!profileImageLoading && (
                <View className="absolute -right-2 bottom-4 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-n0 shadow">
                  <Ionicons name="camera-outline" size={18} color={primary} />
                </View>
              )}
            </View>
          </Pressable>
          <View className="text-center">
            <Text className="text-2xl font-semibold dark:text-white">
              {user?.guest_name || user?.name || "Guest User"}
            </Text>
            <Text className="font-semibold text-n400 dark:text-n500">
              {user?.email || "No email available"}
            </Text>
          </View>
        </View>
        <View className="flex flex-col gap-y-2 pt-7 px-6">
          {/* <Pressable
            onPress={() => router.push("/PassengerList" as any)}
            className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
          >
            <View className="flex-row items-center justify-start gap-2">
              <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                <PhUsersThree color="#613bff" size="16px" />
              </View>
              <Text className="font-semibold dark:text-white">
                Passengers List
              </Text>
            </View>
            <PhCaretRight size="20px" color="#a6a6a6" />
          </Pressable>

          <Pressable
            onPress={() => router.push("/DiscountVouchers" as any)}
            className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
          >
            <View className="flex-row items-center justify-start gap-2">
              <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                <PhTag color="#613bff" size="16px" />
              </View>
              <Text className="font-semibold dark:text-white">
                Discounts / Vouchers
              </Text>
            </View>
            <PhCaretRight size="20px" color="#a6a6a6" />
          </Pressable>
          <Pressable
            onPress={() => router.push("/AirbookPoints" as any)}
            className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
          >
            <View className="flex-row items-center justify-start gap-2">
              <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                <PhCoins color="#613bff" size="16px" />
              </View>
              <Text className="font-semibold dark:text-white">
                AirBook Points
              </Text>
            </View>
            <PhCaretRight size="20px" color="#a6a6a6" />
          </Pressable>
          <Pressable
            onPress={() => router.push("/PaymentMethod" as any)}
            className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
          >
            <View className="flex-row items-center justify-start gap-2">
              <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                <PhWalletLight color="#613bff" size="16px" type="light" />
              </View>
              <Text className="font-semibold dark:text-white">
                Payment Methods
              </Text>
            </View>
            <PhCaretRight size="20px" color="#a6a6a6" />
          </Pressable>
          <Pressable
            onPress={() => router.push("/SavedAddress" as any)}
            className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
          >
            <View className="flex-row items-center justify-start gap-2">
              <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                <PhMapPin color="#613bff" size="16px" />
              </View>
              <Text className="font-semibold dark:text-white">
                Saved Address
              </Text>
            </View>
            <PhCaretRight size="20px" color="#a6a6a6" />
          </Pressable>
          <Pressable
            onPress={() => router.push("/LinkedAccounts" as any)}
            className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
          >
            <View className="flex-row items-center justify-start gap-2">
              <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                <PhArrowsDownUp color="#613bff" size="16px" />
              </View>
              <Text className="font-semibold dark:text-white">
                Linked Accounts
              </Text>
            </View>
            <PhCaretRight size="20px" color="#a6a6a6" />
          </Pressable> */}
        </View>
        <View className="pt-7 px-6">
          <Text className="text-xl font-semibold pb-2 dark:text-white">
            General
          </Text>
          <View className="flex flex-col gap-y-2 ">
            {/* Share App */}
            <Pressable
              onPress={handleShareApp}
              className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
            >
              <View className="flex-row items-center justify-start gap-2">
                <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                  <Ionicons
                    name="share-social-outline"
                    size={16}
                    color="#613bff"
                  />
                </View>
                <Text className="font-semibold dark:text-white">Share App</Text>
              </View>
              <PhCaretRight size="20px" color="#a6a6a6" />
            </Pressable>

            <Pressable
              onPress={() => {
                setPasswordError("");
                setChangePasswordModal(true);
              }}
              className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
            >
              <View className="flex-row items-center justify-start gap-2">
                <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color="#613bff"
                  />
                </View>
                <Text className="font-semibold dark:text-white">
                  Change Password
                </Text>
              </View>
              <PhCaretRight size="20px" color="#a6a6a6" />
            </Pressable>

            {/* DMC Accounts (if available) */}
            {user?.dmcUsers && user.dmcUsers.length > 0 && (
              <Pressable
                onPress={() => setDmcModalVisible(true)}
                className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
              >
                <View className="flex-row items-center justify-start gap-2">
                  <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                    <Ionicons name="people-outline" size={16} color="#613bff" />
                  </View>
                  <View>
                    <Text className="font-semibold dark:text-white">
                      DMC Accounts
                    </Text>
                    <Text className="text-xs text-n400 dark:text-n500">
                      {user.dmcUsers.length} linked account
                      {user.dmcUsers.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
                <PhCaretRight size="20px" color="#a6a6a6" />
              </Pressable>
            )}

            {/* <Pressable
              onPress={() => router.push("/YourProfile" as any)}
              className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
            >
              <View className="flex-row items-center justify-start gap-2">
                <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                  <PhUserLight type="light" color="#613bff" size="16px" />
                </View>
                <Text className="font-semibold dark:text-white">
                  Personal Info
                </Text>
              </View>
              <PhCaretRight size="20px" color="#a6a6a6" />
            </Pressable> */}
            {/* <Pressable
              onPress={() => router.push("/NotificationSettings" as any)}
              className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
            >
              <View className="flex-row items-center justify-start gap-2">
                <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                  <PhBell color="#613bff" size="16px" />
                </View>
                <Text className="font-semibold dark:text-white">
                  Notification
                </Text>
              </View>
              <PhCaretRight size="20px" color="#a6a6a6" />
            </Pressable> */}

            {/* <Pressable
              onPress={() => router.push("/SecuritySettings" as any)}
              className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
            >
              <View className="flex-row items-center justify-start gap-2">
                <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                  <PhShieldCheck color="#613bff" size="16px" />
                </View>
                <Text className="font-semibold dark:text-white">Security</Text>
              </View>
              <PhCaretRight size="20px" color="#a6a6a6" />
            </Pressable>
            <Pressable
              onPress={() => router.push("/LanguageSettings" as any)}
              className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
            >
              <View className="flex-row items-center justify-start gap-2">
                <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                  <PhTranslate color="#613bff" size="16px" />
                </View>
                <Text className="font-semibold dark:text-white">Language</Text>
              </View>
              <PhCaretRight size="20px" color="#a6a6a6" />
            </Pressable> */}
            <Pressable
              onPress={toggleColorScheme}
              className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
            >
              <View className="flex-row items-center justify-start gap-2">
                <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                  <PhEye color="#613bff" size="16px" />
                </View>
                <Text className="font-semibold dark:text-white">
                  Appearance
                </Text>
              </View>
              <PhCaretRight size="20px" color="#a6a6a6" />
            </Pressable>
          </View>
        </View>
        <View className="pt-7 px-6 pb-16">
          <Text className="text-xl font-semibold pb-2">About</Text>
          <View className="flex flex-col gap-y-2 ">
            {/* <Pressable
              onPress={() => router.push("/HelpCenter" as any)}
              className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
            >
              <View className="flex-row items-center justify-start gap-2">
                <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                  <PhHeadset color="#613bff" size="16px" />
                </View>
                <Text className="font-semibold dark:text-white">
                  Help Centre
                </Text>
              </View>
              <PhCaretRight size="20px" color="#a6a6a6" />
            </Pressable>
            <Pressable
              onPress={() => router.push("/AboutAirbook" as any)}
              className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
            >
              <View className="flex-row items-center justify-start gap-2">
                <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                  <PhInfo color="#613bff" size="16px" />
                </View>
                <Text className="font-semibold dark:text-white">
                  About Airbook
                </Text>
              </View>
              <PhCaretRight size="20px" color="#a6a6a6" />
            </Pressable> */}
            <Pressable
              onPress={() => setDeleteAccountModal(true)}
              className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0 border border-red-100 dark:border-red-900/30"
            >
              <View className="flex-row items-center justify-start gap-2">
                <View className="flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 p-2">
                  <Ionicons name="trash-outline" size={16} color="#dc2626" />
                </View>
                <Text className="font-bold text-red-600 dark:text-red-500">
                  Delete Account
                </Text>
              </View>
              <View className="bg-red-50 dark:bg-red-900/20 rounded-full px-2 py-1">
                <Text className="text-xs text-red-600 dark:text-red-500 font-semibold">
                  ⚠️
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setLogoutModal(true)}
              className="flex-row items-center justify-between rounded-full bg-white p-3 dark:bg-n0"
            >
              <View className="flex-row items-center justify-start gap-2">
                <View className=" flex items-center justify-center rounded-full bg-b50 p-2 text-p1 dark:bg-n50">
                  <PhSignOut color="#613bff" size="16px" />
                </View>
                <Text className="font-bold text-red-600 dark:text-red-500">
                  Logout
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      {/* Change Password modal */}
      <Modal
        visible={changePasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!passwordLoading) setChangePasswordModal(false);
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.modalBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => {
                if (!passwordLoading) setChangePasswordModal(false);
              }}
            />
            <ScrollView
              contentContainerStyle={styles.changePasswordModalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: modalBg, borderColor: modalBorder },
                ]}
              >
                <View className="items-center pt-4 pb-2 px-4">
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(97, 59, 255, 0.18)" }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={30}
                  color={primary}
                />
              </View>
              <Text
                className="text-lg font-bold mb-1 text-center"
                style={{ color: textPrimary }}
              >
                Change Password
              </Text>
              <Text
                className="text-sm text-center mb-4"
                style={{ color: textSecondary }}
              >
                Update the password for your restaurant account.
              </Text>
            </View>
            <View className="px-4 pb-2">
              <Text
                className="text-sm font-medium mb-1"
                style={{ color: textPrimary }}
              >
                Current password
              </Text>
              <View
                className="flex-row items-center rounded-xl border px-2"
                style={{
                  borderColor: modalBorder,
                  backgroundColor: isDark ? "#18191C" : "#F9FAFB",
                }}
              >
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={textSecondary}
                  secureTextEntry={!showCurrentPassword}
                  editable={!passwordLoading}
                  className="flex-1 py-3 pr-2 pl-2 text-base"
                  style={{
                    color: textPrimary,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword((prev) => !prev)}
                  disabled={passwordLoading}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={
                      showCurrentPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color={textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View className="px-4 pb-2">
              <Text
                className="text-sm font-medium mb-1"
                style={{ color: textPrimary }}
              >
                New password
              </Text>
              <View
                className="flex-row items-center rounded-xl border px-2"
                style={{
                  borderColor: modalBorder,
                  backgroundColor: isDark ? "#18191C" : "#F9FAFB",
                }}
              >
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={textSecondary}
                  secureTextEntry={!showNewPassword}
                  editable={!passwordLoading}
                  className="flex-1 py-3 pr-2 pl-2 text-base"
                  style={{
                    color: textPrimary,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword((prev) => !prev)}
                  disabled={passwordLoading}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View className="px-4 pb-2">
              <Text
                className="text-sm font-medium mb-1"
                style={{ color: textPrimary }}
              >
                Confirm new password
              </Text>
              <View
                className="flex-row items-center rounded-xl border px-2"
                style={{
                  borderColor: modalBorder,
                  backgroundColor: isDark ? "#18191C" : "#F9FAFB",
                }}
              >
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor={textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  editable={!passwordLoading}
                  className="flex-1 py-3 pr-2 pl-2 text-base"
                  style={{
                    color: textPrimary,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={passwordLoading}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color={textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text className="text-sm text-red-500 mt-2">
                  {passwordError}
                </Text>
              ) : null}
            </View>
            <View className="flex-row gap-2 px-4 pb-4">
              <TouchableOpacity
                disabled={passwordLoading}
                onPress={() => {
                  if (!passwordLoading) setChangePasswordModal(false);
                }}
                className="flex-1 rounded-xl py-3.5 items-center justify-center"
                style={{
                  backgroundColor: isDark ? "#2A2B30" : "#E5E7EB",
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
                disabled={passwordLoading}
                onPress={handleChangePassword}
                className="flex-1 rounded-xl py-3.5 flex-row items-center justify-center"
                style={{
                  backgroundColor: primary,
                  opacity: passwordLoading ? 0.8 : 1,
                }}
                activeOpacity={0.8}
              >
                <Text className="text-base font-semibold text-white">
                  Update password
                </Text>
              </TouchableOpacity>
            </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Password changed success modal */}
      <Modal
        visible={passwordSuccessModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordSuccessModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPasswordSuccessModalVisible(false)}
          />
          <View
            style={[
              styles.modalCard,
              styles.passwordSuccessCard,
              { backgroundColor: modalBg, borderColor: modalBorder },
            ]}
          >
            <View style={styles.passwordSuccessIconWrap}>
              <View
                style={[
                  styles.passwordSuccessIconCircle,
                  { backgroundColor: isDark ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.15)" },
                ]}
              >
                <Ionicons name="checkmark-circle" size={56} color="#22c55e" />
              </View>
            </View>
            <Text
              style={[styles.passwordSuccessTitle, { color: textPrimary }]}
            >
              Password changed
            </Text>
            <Text
              style={[styles.passwordSuccessMessage, { color: textSecondary }]}
            >
              Your password has been updated successfully. You can now use your
              new password to sign in.
            </Text>
            <TouchableOpacity
              onPress={() => setPasswordSuccessModalVisible(false)}
              style={[styles.passwordSuccessButton, { backgroundColor: primary }]}
              activeOpacity={0.85}
            >
              <Text style={styles.passwordSuccessButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Profile image error modal (e.g. 413 - image too large) */}
      <Modal
        visible={!!profileImageErrorModalMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileImageErrorModalMessage(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setProfileImageErrorModalMessage(null)}
          />
          <View
            style={[
              styles.modalCard,
              styles.profileImageErrorCard,
              { backgroundColor: modalBg, borderColor: modalBorder },
            ]}
          >
            <View style={styles.profileImageErrorIconWrap}>
              <View
                style={[
                  styles.profileImageErrorIconCircle,
                  {
                    backgroundColor: isDark
                      ? "rgba(239, 68, 68, 0.2)"
                      : "rgba(239, 68, 68, 0.12)",
                  },
                ]}
              >
                <Ionicons
                  name="alert-circle"
                  size={52}
                  color="#dc2626"
                />
              </View>
            </View>
            <Text
              style={[styles.profileImageErrorTitle, { color: textPrimary }]}
            >
              Couldn't update photo
            </Text>
            <Text
              style={[
                styles.profileImageErrorMessage,
                { color: textSecondary },
              ]}
            >
              {profileImageErrorModalMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setProfileImageErrorModalMessage(null)}
              style={[
                styles.profileImageErrorButton,
                { backgroundColor: primary },
              ]}
              activeOpacity={0.85}
            >
              <Text style={styles.profileImageErrorButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={logoutModal} transparent={true}>
        <View
          className="h-full justify-end items-center"
          style={{
            backgroundColor:
              colorScheme === "dark"
                ? "rgba(255, 255, 255, .1)"
                : "rgba(9, 9, 9, .8)",
          }}
        >
          <View className="absolute bottom-0 left-0 right-0 ">
            <Image source={logoutModalBg} className="w-full dark:hidden" />
            <Image
              source={logoutModalBgDark}
              className="w-full hidden dark:flex"
            />
          </View>
          <View className="relative w-full overflow-y-auto rounded-t-3xl">
            <View className="px-6 pt-8">
              <View className="flex flex-col items-center justify-center gap-y-3 pb-4">
                <Text className=" text-center text-3xl font-bold dark:text-white">
                  Logout
                </Text>
                <Text className="text-center0 text-n400 dark:text-n500">
                  Are you sure you want to log out?
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between gap-2 rounded-t-2xl p-6 pb-16">
              <Pressable
                onPress={() => setLogoutModal(false)}
                className="flex-1"
                disabled={logoutLoading}
              >
                <Text
                  className={`rounded-lg border border-p1 py-3 text-center font-semibold dark:text-white ${logoutLoading ? "opacity-50" : ""}`}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleLogout}
                className="flex-1"
                disabled={logoutLoading}
              >
                <View
                  className={`rounded-lg bg-p1 py-3 flex-row items-center justify-center ${logoutLoading ? "opacity-80" : ""}`}
                >
                  {logoutLoading && (
                    <ActivityIndicator
                      color="#ffffff"
                      size="small"
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <Text className="text-center font-semibold text-white">
                    {logoutLoading ? "Logging out..." : "Yes, Logout"}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete account modal - Email based approach */}
      <Modal
        visible={deleteAccountModal}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteAccountModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDeleteAccountModal(false)}
          />
          <View
            style={[
              styles.modalCard,
              { backgroundColor: modalBg, borderColor: modalBorder },
            ]}
          >
            <View className="items-center pt-4 pb-2 px-4">
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(248, 113, 113, 0.2)" }}
              >
                <Ionicons name="trash-outline" size={32} color="#ef4444" />
              </View>
              <Text
                className="text-lg font-bold mb-1 text-center"
                style={{ color: textPrimary }}
              >
                Delete account
              </Text>
              <Text
                className="text-sm text-center mb-4"
                style={{ color: textSecondary }}
              >
                To delete your account, send an email to{" "}
                <Text className="font-semibold" style={{ color: textPrimary }}>
                  travcadmin@travclicks.com
                </Text>
                . Your account will be deleted within 72 hours.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const subject = encodeURIComponent(
                    "Account Deletion Request - Travhorse Restaurants",
                  );
                  const body = encodeURIComponent(
                    "Hello Travhorse Support Team,\n\n" +
                      "I would like to request the permanent deletion of my restaurant account from the Travhorse Restaurants app.\n\n" +
                      "Email: " +
                      (user?.email ?? "") +
                      "\n" +
                      "Restaurant ID: " +
                      (user?.id ?? "") +
                      "\n" +
                      "Restaurant Name: " +
                      (user?.name ?? "") +
                      "\n\n" +
                      "Please confirm once the account has been deleted.\n\n" +
                      "Thank you.",
                  );
                  Linking.openURL(
                    `mailto:travcadmin@travclicks.com?subject=${subject}&body=${body}`,
                  );
                }}
                className="w-full flex-row items-center justify-center rounded-xl py-3.5 px-4 mb-3"
                style={{ backgroundColor: primary }}
                activeOpacity={0.8}
              >
                <Ionicons name="mail" size={20} color="#ffffff" />
                <Text className="text-base font-semibold text-white ml-2">
                  Send email
                </Text>
              </TouchableOpacity>
            </View>
            <View className="px-4 pb-4">
              <TouchableOpacity
                onPress={() => setDeleteAccountModal(false)}
                className="rounded-xl py-3.5 items-center justify-center"
                style={{ backgroundColor: isDark ? "#2A2B30" : "#e2e8f0" }}
                activeOpacity={0.8}
              >
                <Text
                  className="text-base font-semibold"
                  style={{ color: textPrimary }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Appearance/Theme modal */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setThemeModalVisible(false)}
          />
          <View
            style={[
              styles.modalCard,
              { backgroundColor: modalBg, borderColor: modalBorder },
            ]}
          >
            <View
              className="px-4 py-3"
              style={{
                borderBottomWidth: 1,
                borderBottomColor: divider,
              }}
            >
              <Text
                className="text-lg font-semibold"
                style={{ color: textPrimary }}
              >
                Appearance
              </Text>
              <Text className="text-sm mt-0.5" style={{ color: textSecondary }}>
                Choose light or dark mode
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setTheme("light")}
              className="flex-row items-center px-4 py-4"
              style={{
                borderBottomWidth: 1,
                borderBottomColor: divider,
              }}
              activeOpacity={0.7}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: isDark ? "#2A2B30" : "#e5e7eb" }}
              >
                <Ionicons name="sunny-outline" size={22} color={textPrimary} />
              </View>
              <Text
                className="text-base font-medium flex-1"
                style={{ color: textPrimary }}
              >
                Light mode
              </Text>
              {colorScheme === "light" && (
                <Ionicons name="checkmark-circle" size={24} color={primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTheme("dark")}
              className="flex-row items-center px-4 py-4"
              activeOpacity={0.7}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: isDark ? "#2A2B30" : "#e5e7eb" }}
              >
                <Ionicons name="moon-outline" size={22} color={textPrimary} />
              </View>
              <Text
                className="text-base font-medium flex-1"
                style={{ color: textPrimary }}
              >
                Dark mode
              </Text>
              {colorScheme === "dark" && (
                <Ionicons name="checkmark-circle" size={24} color={primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DMC Accounts modal */}
      <Modal
        visible={dmcModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDmcModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDmcModalVisible(false)}
          />
          <View
            style={[
              styles.dmcModalCard,
              { backgroundColor: modalBg, borderColor: modalBorder },
            ]}
          >
            {/* Header */}
            <View
              style={[styles.dmcModalHeader, { borderBottomColor: divider }]}
            >
              <View>
                <Text style={[styles.dmcModalTitle, { color: textPrimary }]}>
                  DMC Accounts
                </Text>
                <Text
                  style={[styles.dmcModalSubtitle, { color: textSecondary }]}
                >
                  {user?.dmcUsers?.length
                    ? `${user.dmcUsers.length} linked account${user.dmcUsers.length !== 1 ? "s" : ""}`
                    : "No accounts linked"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDmcModalVisible(false)}
                style={[
                  styles.dmcModalCloseBtn,
                  { backgroundColor: isDark ? "#2A2B30" : "#e5e7eb" },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={22} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {/* List */}
            <ScrollView
              style={[styles.dmcModalScroll, { maxHeight: 380 }]}
              contentContainerStyle={styles.dmcModalScrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {user?.dmcUsers?.length ? (
                user.dmcUsers.map((dmcUser, index) => (
                  <View
                    key={dmcUser.id}
                    style={[
                      styles.dmcCard,
                      { backgroundColor: isDark ? "#1D1F24" : "#f8fafc" },
                    ]}
                  >
                    <View style={styles.dmcCardHeader}>
                      <View
                        style={[
                          styles.dmcCardNumber,
                          {
                            backgroundColor: isDark
                              ? "rgba(244, 196, 48, 0.2)"
                              : "rgba(244, 196, 48, 0.25)",
                          },
                        ]}
                      >
                        <Text
                          style={styles.dmcCardNumberText}
                          numberOfLines={1}
                        >
                          {index + 1}
                        </Text>
                      </View>
                      <Text
                        style={[styles.dmcCardCompany, { color: textPrimary }]}
                        numberOfLines={2}
                      >
                        {dmcUser.dmc}
                      </Text>
                    </View>
                    <View style={styles.dmcCardUser}>
                      <View
                        style={[
                          styles.dmcCardAvatar,
                          {
                            backgroundColor: isDark ? "#2A2B30" : "#e5e7eb",
                          },
                        ]}
                      >
                        <Ionicons name="person" size={20} color={textPrimary} />
                      </View>
                      <View style={styles.dmcCardUserInfo}>
                        <Text
                          style={[
                            styles.dmcCardUserName,
                            { color: textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {dmcUser.name}
                        </Text>
                        <Text
                          style={[
                            styles.dmcCardUserEmail,
                            { color: textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {dmcUser.email}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.dmcEmptyState}>
                  <View
                    style={[
                      styles.dmcEmptyIconWrap,
                      { backgroundColor: isDark ? "#1D1F24" : "#f8fafc" },
                    ]}
                  >
                    <Ionicons
                      name="people-outline"
                      size={40}
                      color={textSecondary}
                    />
                  </View>
                  <Text style={[styles.dmcEmptyTitle, { color: textPrimary }]}>
                    No DMC accounts
                  </Text>
                  <Text
                    style={[styles.dmcEmptyMessage, { color: textSecondary }]}
                  >
                    Linked DMC accounts will appear here.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.dmcModalFooter, { borderTopColor: divider }]}>
              <TouchableOpacity
                onPress={() => setDmcModalVisible(false)}
                style={[
                  styles.dmcModalCloseButton,
                  { backgroundColor: primary },
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.dmcModalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Account;

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  changePasswordModalScroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  passwordSuccessCard: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: "center",
  },
  passwordSuccessIconWrap: {
    marginBottom: 20,
  },
  passwordSuccessIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  passwordSuccessTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  passwordSuccessMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  passwordSuccessButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  passwordSuccessButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  profileImageErrorCard: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: "center",
  },
  profileImageErrorIconWrap: {
    marginBottom: 20,
  },
  profileImageErrorIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImageErrorTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  profileImageErrorMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  profileImageErrorButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImageErrorButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  // DMC modal styles
  dmcModalCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  dmcModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  dmcModalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  dmcModalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  dmcModalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dmcModalScroll: {
    maxHeight: 380,
  },
  dmcModalScrollContent: {
    padding: 16,
    paddingBottom: 8,
  },
  dmcCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  dmcCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dmcCardNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  dmcCardNumberText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B45309",
  },
  dmcCardCompany: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  dmcCardUser: {
    flexDirection: "row",
    alignItems: "center",
  },
  dmcCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dmcCardUserInfo: {
    flex: 1,
    minWidth: 0,
  },
  dmcCardUserName: {
    fontSize: 15,
    fontWeight: "600",
  },
  dmcCardUserEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  dmcEmptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  dmcEmptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  dmcEmptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  dmcEmptyMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  dmcModalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  dmcModalCloseButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dmcModalCloseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
