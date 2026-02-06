import { useWindowDimensions, StyleSheet } from "react-native";
import React from "react";
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

const Dot = ({ index, x }: { index: number; x: SharedValue<number> }) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const animatedDotStyle = useAnimatedStyle(() => {
    const widthAnimation = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
        (index + 2) * SCREEN_WIDTH,
      ],
      [8, 24, 8, 8],
      Extrapolation.CLAMP
    );

    const opacityAnimation = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [0.5, 1, 0.5, 0.5],
      Extrapolation.CLAMP
    );
    return {
      width: widthAnimation,
      opacity: opacityAnimation,
    };
  });

  return (
    <Animated.View style={[styles.dot, animatedDotStyle]}></Animated.View>
  );
};

export default Dot;

const styles = StyleSheet.create({
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#613BFF",
    marginHorizontal: 6,
  },
});
