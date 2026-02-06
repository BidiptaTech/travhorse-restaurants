import Svg, { Path } from "react-native-svg";

export function PhTag({ size, color }: { size: string; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      <Path
        fill={color}
        d="M243.31 136l-52.69 52.69a16 16 0 0 1-22.63 0l-96-96a16 16 0 0 1 0-22.63L120 12.69a16 16 0 0 1 22.63 0l96 96a16 16 0 0 1 0 22.63M139.31 32L32 139.31l52.69 52.69L192 84.69Z"
      />
    </Svg>
  );
} 