import { StyleSheet, View, useWindowDimensions } from "react-native";
import React, { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const sliderBg = require("@/assets/images/slider-bg.png");

const RotateBg = () => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const rotate = useSharedValue(0);

  const rotateAnimationStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${rotate.value}deg`,
        },
      ],
      width: SCREEN_WIDTH * 0.95,
      height: SCREEN_WIDTH * 0.95,
      opacity: 0.85,
    };
  });

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, {
        duration: 30000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={sliderBg}
        style={[rotateAnimationStyle, styles.image]}
        resizeMode="contain"
      />
    </View>
  );
};

export default RotateBg;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  image: {
    alignSelf: "center",
  },
});
