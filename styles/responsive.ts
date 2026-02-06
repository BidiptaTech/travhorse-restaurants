import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const rMS = (size: number, factor: number = 1) => {
  const scale = (width / 390) * factor;
  const newSize = size * scale;
  return newSize;
};

export const screenWidth = width;
export const screenHeight = height;
