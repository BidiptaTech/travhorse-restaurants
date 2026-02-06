import Svg, { Path } from "react-native-svg";

export function PhInfo({ size, color }: { size: string; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      <Path
        fill={color}
        d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 192a88 88 0 1 1 88-88a88.11 88.11 0 0 1-88 88m16-40a8 8 0 0 1-8-8V128a8 8 0 0 1 16 0v40a8 8 0 0 1-8 8m0-80a8 8 0 0 1-8-8V96a8 8 0 0 1 16 0v8a8 8 0 0 1-8 8"
      />
    </Svg>
  );
} 