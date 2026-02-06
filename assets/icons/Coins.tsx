import Svg, { Path } from "react-native-svg";

export function PhCoins({ size, color }: { size: string; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      <Path
        fill={color}
        d="M184 88a88 88 0 1 1-88-88a88 88 0 0 1 88 88m-16 0a72 72 0 1 0-72 72a72 72 0 0 0 72-72m-72 56a56 56 0 1 1 56-56a56 56 0 0 1-56 56m0-96a40 40 0 1 0 40 40a40 40 0 0 0-40-40"
      />
    </Svg>
  );
} 