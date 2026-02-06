import Svg, { Path } from "react-native-svg";

export function PhHeadset({ size, color }: { size: string; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      <Path
        fill={color}
        d="M128 24A104 104 0 0 0 24 128v56a24 24 0 0 0 24 24h16a24 24 0 0 0 24-24v-40a24 24 0 0 0-24-24H48a88 88 0 1 1 176 0h-32a24 24 0 0 0-24 24v40a24 24 0 0 0 24 24h16a24 24 0 0 0 24-24v-56A104 104 0 0 0 128 24"
      />
    </Svg>
  );
} 