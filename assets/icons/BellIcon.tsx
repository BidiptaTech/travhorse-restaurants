import Svg, { Path } from "react-native-svg";

export function PhBell({ size, color }: { size: string; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      <Path
        fill={color}
        d="M224 96v80a8 8 0 0 1-16 0V96a88 88 0 1 0-176 0v80a8 8 0 0 1-16 0V96a104 104 0 1 1 208 0m-96 216a32 32 0 0 1-32-32h64a32 32 0 0 1-32 32"
      />
    </Svg>
  );
} 