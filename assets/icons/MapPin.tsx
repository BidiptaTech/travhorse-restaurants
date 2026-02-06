import Svg, { Path } from "react-native-svg";

export function PhMapPin({ size, color }: { size: string; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      <Path
        fill={color}
        d="M128 24a88.1 88.1 0 0 0-88 88c0 75.3 80 132.12 83.41 134.55a8 8 0 0 0 9.18 0C136 244.12 216 187.3 216 112a88.1 88.1 0 0 0-88-88m0 160a72 72 0 1 1 72-72a72 72 0 0 1-72 72"
      />
    </Svg>
  );
} 