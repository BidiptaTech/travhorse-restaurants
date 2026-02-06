import Svg, { Path } from "react-native-svg";

export function PhTranslate({ size, color }: { size: string; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      <Path
        fill={color}
        d="M231.93 169.37A8 8 0 0 1 224 176h-40v16a8 8 0 0 1-16 0v-16H88v16a8 8 0 0 1-16 0v-16H32a8 8 0 0 1-7.93-6.63a8.07 8.07 0 0 1 2.17-6.78L72 89V56a8 8 0 0 1 16 0v33l45.76-54.17a8 8 0 0 1 12.48 0L192 89v-33a8 8 0 0 1 16 0v33l45.76 54.17a8.07 8.07 0 0 1 2.17 6.78M92.24 144L128 100.47L163.76 144Z"
      />
    </Svg>
  );
} 