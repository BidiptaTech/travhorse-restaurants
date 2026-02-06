import Svg, { Path } from "react-native-svg";

export function PhArrowsDownUp({ size, color }: { size: string; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      <Path
        fill={color}
        d="M40 168V88a8 8 0 0 1 16 0v80a8 8 0 0 1-16 0m32-32V88a8 8 0 0 1 16 0v48a8 8 0 0 1-16 0m32-32V88a8 8 0 0 1 16 0v16a8 8 0 0 1-16 0m32-32V88a8 8 0 0 1 16 0v48a8 8 0 0 1-16 0m32-32V88a8 8 0 0 1 16 0v80a8 8 0 0 1-16 0"
      />
    </Svg>
  );
} 