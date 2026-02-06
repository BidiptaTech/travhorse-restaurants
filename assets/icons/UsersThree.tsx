import Svg, { Path } from "react-native-svg";

export function PhUsersThree({ size, color }: { size: string; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      <Path
        fill={color}
        d="M160 40a32 32 0 1 0 32 32a32 32 0 0 0-32-32m0 48a16 16 0 1 1 16-16a16 16 0 0 1-16 16m96 48c0-27.61-22.39-50-50-50a49.63 49.63 0 0 0-9.07.83a8 8 0 1 1-2.93-15.66c4.28-.8 8.61-1.17 12-1.17c36.5 0 66 29.5 66 66a8 8 0 0 1-16 0M125.07 188a64 64 0 1 0-74.14 0a72.12 72.12 0 0 0-31 25a8 8 0 1 0 13.09 9.24a56 56 0 0 1 91.69 0a8 8 0 0 0 13.09-9.24a72.12 72.12 0 0 0-30.73-25M96 120a32 32 0 1 0 32 32a32 32 0 0 0-32-32m0 48a16 16 0 1 1 16-16a16 16 0 0 1-16 16"
      />
    </Svg>
  );
} 