import { BRAND_BLUE } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const HEADER_BLUE = BRAND_BLUE;

const WAVE_HEIGHT = 40;

const defaultBack = () => {
  try {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)" as any);
    }
  } catch {
    router.replace("/(tabs)" as any);
  }
};

export type WaveScreenHeaderProps = {
  title?: string;
  showProfile?: boolean;
  userName?: string;
  /** Avatar image (`{ uri }` or `require(...)`). Omit with `showProfile` to show person placeholder. */
  userAvatarSource?: ImageSourcePropType;
  unreadCount?: number;
  onNotificationPress?: () => void;
  /** Default true when `onNotificationPress` is passed. Set false on notification screen, etc. */
  showNotificationButton?: boolean;
  /** History shortcut (e.g. home header). Shown instead of notifications when set. */
  onHistoryPress?: () => void;
  /** Default true when `onHistoryPress` is passed. */
  showHistoryButton?: boolean;
  /** When true, shows back control (ignored when `showProfile`). Defaults true when `title` is set and not profile. */
  showBackButton?: boolean;
  onBackPress?: () => void;
};

export function WaveScreenHeader({
  title,
  showProfile = false,
  userName = "Guest",
  userAvatarSource,
  unreadCount = 0,
  onNotificationPress,
  showNotificationButton,
  onHistoryPress,
  showHistoryButton,
  showBackButton: showBackButtonProp,
  onBackPress,
}: WaveScreenHeaderProps) {
  const [imageLoadError, setImageLoadError] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const w = Math.max(width, 1);
  const wavePath = `M0,0 H${w} V14 C${w * 0.72},${WAVE_HEIGHT} ${w * 0.28},${WAVE_HEIGHT} 0,14 Z`;

  const handleBack = onBackPress ?? defaultBack;
  const showHistory =
    showHistoryButton !== undefined
      ? showHistoryButton
      : Boolean(onHistoryPress);
  const showBell =
    showNotificationButton !== undefined
      ? showNotificationButton
      : Boolean(onNotificationPress);

  const showBackButton =
    showBackButtonProp !== undefined
      ? showBackButtonProp
      : Boolean(title && !showProfile);

  const topPad = Math.max(insets.top, 10);

  useEffect(() => {
    setImageLoadError(false);
  }, [userAvatarSource]);

  return (
    <View className="overflow-hidden" style={{ backgroundColor: "transparent" }}>
      <View
        className="px-6 pb-3"
        style={{
          backgroundColor: BRAND_BLUE,
          minHeight: 88,
          paddingTop: topPad,
        }}
      >
        <View className="w-full flex-row justify-between items-center">
          {showProfile ? (
            <View className="flex-row items-center flex-1 pr-3">
              {userAvatarSource != null && !imageLoadError ? (
                <Image
                  source={userAvatarSource}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    borderWidth: 2,
                    borderColor: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                  }}
                  resizeMode="cover"
                  onError={() => setImageLoadError(true)}
                  onLoad={() => setImageLoadError(false)}
                />
              ) : (
                <View className="w-[44px] h-[44px] rounded-full border-2 border-white bg-white/25 items-center justify-center">
                  <Ionicons name="person" size={24} color="white" />
                </View>
              )}
              <View className="ml-3 flex-1">
                <Text
                  className="text-white font-semibold text-[16px]"
                  numberOfLines={1}
                >
                  {userName}
                </Text>
              </View>
            </View>
          ) : (
            <View className="flex-row items-center flex-1 pr-3 min-h-[44px]">
              {showBackButton ? (
                <Pressable
                  onPress={handleBack}
                  hitSlop={8}
                  className="w-9 h-9 rounded-full bg-white/20 items-center justify-center mr-2"
                >
                  <Ionicons name="chevron-back" size={22} color="white" />
                </Pressable>
              ) : null}
              <Text
                className="text-[21px] font-bold text-white tracking-tight flex-1"
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>
          )}

          {showHistory && onHistoryPress ? (
            <TouchableOpacity
              className="w-[42px] h-[42px] bg-white/20 rounded-full items-center justify-center shrink-0"
              onPress={onHistoryPress}
              activeOpacity={0.75}
            >
              <Ionicons name="time-outline" size={20} color="white" />
            </TouchableOpacity>
          ) : showBell && onNotificationPress ? (
            <View className="relative shrink-0">
              <TouchableOpacity
                className="w-[42px] h-[42px] bg-white/20 rounded-full items-center justify-center"
                onPress={onNotificationPress}
                activeOpacity={0.75}
              >
                <Ionicons name="notifications-outline" size={22} color="white" />
              </TouchableOpacity>

              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-[20px] items-center justify-center px-1 border-2 border-white">
                  <Text className="text-white text-[10px] font-bold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </View>
      </View>

      <Svg
        width={w}
        height={WAVE_HEIGHT}
        viewBox={`0 0 ${w} ${WAVE_HEIGHT}`}
        preserveAspectRatio="none"
        style={{ marginTop: -1 }}
      >
        <Path fill={BRAND_BLUE} d={wavePath} />
      </Svg>
    </View>
  );
}
