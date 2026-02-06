import Svg, { Path } from "react-native-svg";

export function PhShieldCheck({ size, color }: { size: string; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      <Path
        fill={color}
        d="M208 40H48a16 16 0 0 0-16 16v58.77c0 89.62 75.82 119.34 91 124.39a15.44 15.44 0 0 0 10 0c15.2-5.05 91-34.77 91-124.39V56a16 16 0 0 0-16-16m-2 74.79c0 78.42-66.34 104.62-80 109.18c-13.53-4.52-80-30.75-80-109.18V58h160Z"
      />
    </Svg>
  );
} 