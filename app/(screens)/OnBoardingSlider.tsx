import {
  FlatList as RNFlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import React from "react";
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { onbordingSliderData } from "@/constants/data";
import OnBoardingSliderItem, {
  ItemProps,
} from "@/components/ui/OnBoardingSliderItem";
import Pagination from "@/components/ui/Pagination";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useAppSelector } from "@/store/hooks";

const star = require("@/assets/images/star2.png");

const OnBoardingSlider = () => {
  const { colorScheme } = useColorScheme();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const flatListRef = useAnimatedRef<any>();
  const x = useSharedValue(0);
  const flatListIndex = useSharedValue(0);

  const onViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: { index: number | null }[];
  }) => {
    if (
      viewableItems.length > 0 &&
      viewableItems[0].index !== null &&
      viewableItems[0].index !== undefined
    ) {
      flatListIndex.value = viewableItems[0].index;
      setCurrentIndex(viewableItems[0].index);
    }
  };

  const progressWidth = useDerivedValue(() => {
    if (flatListIndex.value === 0) return "0%";
    if (flatListIndex.value === 1) return "33%";
    if (flatListIndex.value === 2) return "66%";
    return "100%";
  });

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: progressWidth.value,
    };
  });

  const isLastItem = useAnimatedStyle(() => {
    return {
      display: progressWidth.value === "100%" ? "none" : "flex",
    };
  });

  const showLinks = useAnimatedStyle(() => {
    return {
      display: progressWidth.value === "100%" ? "flex" : "none",
    };
  });

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event: { contentOffset: { x: number } }) => {
      x.value = event.contentOffset.x;
    },
  });

  const circleStyles = Array(4)
    .fill(0)
    .map((_, index) =>
      useAnimatedStyle(() => ({
        backgroundColor:
          flatListIndex.value >= index
            ? "#613BFF"
            : colorScheme === "dark"
            ? "#242424"
            : "#ffff",
      }))
    );

  // If user is already logged in, skip onboarding entirely.
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  return (
    <SafeAreaView className="h-full bg-b50 dark:bg-n50 flex-1 items-center justify-start relative">
      <Image source={star} className="absolute left-6 top-[12%] z-5" />
      <Image source={star} className="absolute right-6 top-[12%] z-5" />
      <Image source={star} className="absolute right-8 top-[55%] z-5" />

      <View className="z-1 flex-1 w-full items-center justify-center mt-10">
        <Animated.FlatList
          ref={flatListRef}
          data={onbordingSliderData}
          onScroll={onScroll}
          keyExtractor={(item: ItemProps) => `key:${item.id}`}
          renderItem={({ item, index }: { item: ItemProps; index: number }) => (
            <OnBoardingSliderItem item={item} idx={index} />
          )}
          scrollEventThrottle={16}
          horizontal={true}
          bounces={false}
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{
            minimumViewTime: 300,
            viewAreaCoveragePercentThreshold: 10,
          }}
        />
      </View>

      <View className="w-full px-6 absolute bottom-[50px] left-0 right-0 z-10">
        <View className="flex-row justify-between items-center mb-4">
          <Pagination onbordingSliderData={onbordingSliderData} x={x} />
        </View>

        <Pressable
          onPress={() => {
            if (currentIndex < onbordingSliderData.length - 1) {
              flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
              });
            } else {
              router.replace("/(auth-pages)/SignIn");
            }
          }}
          className="bg-p1 w-full rounded-2xl h-14 justify-center"
        >
          <Text className="text-center text-base text-white font-semibold">
            {currentIndex < onbordingSliderData.length - 1
              ? "Next"
              : "Get Started"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default OnBoardingSlider;
