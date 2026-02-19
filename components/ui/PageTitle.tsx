import { Pressable, Text, View } from "react-native";
import React, { ReactNode } from "react";
import { EvilIcons } from "@expo/vector-icons";
import { router } from "expo-router";

const PageTitle = ({
  pageName,
  isRightIcon,
  link,
  children,
  hideBackBautton,
  backTo,
}: {
  pageName: string;
  isRightIcon?: boolean;
  link?: string;
  children?: ReactNode;
  hideBackBautton?: boolean;
  /** When set, back button navigates to this route (e.g. first slide) instead of router.back() */
  backTo?: string;
}) => {
  const handleBackPress = () => {
    try {
      if (backTo) {
        router.replace(backTo as any);
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    } catch (error) {
      router.replace("/(tabs)");
    }
  };

  return (
    <View className=" px-6 pt-14 pb-6 flex-row justify-between items-center z-50 ">
      <View className="flex-row justify-start items-center gap-x-6">
        {!hideBackBautton && (
          <Pressable onPress={handleBackPress}>
            <Text className="bg-white rounded-full flex-row justify-center items-center w-8 h-8">
              <EvilIcons name="chevron-left" size={32} color="black" />
            </Text>
          </Pressable>
        )}
        <View>
          <Text
            className="text-[28px] text-white "
            style={{ fontWeight: "700" }}
          >
            {pageName}
          </Text>
        </View>
      </View>

      {isRightIcon && (
        <Pressable
          onPress={() => link && router.push(link as any)}
          className="flex items-center justify-center rounded-full border border-white p-2 text-white"
        >
          {children}
        </Pressable>
      )}
    </View>
  );
};

export default PageTitle;
