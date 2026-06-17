import {
  Text,
  View,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import React, { useEffect } from "react";
import RotateBg from "./RotateBg";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from "react-native-reanimated";

export type ItemProps = {
  id: number;
  img: number | { uri: string };
  title: string;
  description: string;
};

type Props = {
  item: ItemProps;
  idx: number;
};

const OnBoardingSliderItem = ({ item, idx }: Props) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(100, withTiming(0, { duration: 600 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <View style={[styles.container, { width: SCREEN_WIDTH }]}>
      <View style={styles.imageContainer}>
        <RotateBg />
        <Animated.Image
          source={item.img}
          style={[styles.phoneImage, animatedStyle]}
          resizeMode="contain"
        />
      </View>
      <Animated.View style={[styles.textContainer, animatedStyle]}>
        <View style={styles.card}>
          <Text
            style={styles.title}
            className="text-start dark:text-white"
          >
            {item.title}
          </Text>
          <Text
            style={styles.description}
            className="text-start pt-3 text-base text-g50 opacity-80 dark:text-n500"
          >
            {item.description}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
  },
  imageContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    height: 480,
    paddingTop: 70,
  },
  phoneImage: {
    width: "90%",
    height: 480,
    alignSelf: "center",
    zIndex: 10,
    marginTop: 100,
  },
  textContainer: {
    marginTop: -60,
    zIndex: 20,
  },
  card: {
    width: "90%",
    marginHorizontal: "5%",
    backgroundColor: "white",
    padding: 18,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default OnBoardingSliderItem;
