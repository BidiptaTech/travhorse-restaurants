import Svg, { Path } from "react-native-svg";

export function PhWalletLight({
  type,
  size,
  color,
}: {
  type: string;
  size: string;
  color: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      <Path
        fill={color}
        d={
          type === "light"
            ? "M216 66H56a10 10 0 0 1 0-20h136a6 6 0 0 0 0-12H56a22 22 0 0 0-22 22v128a22 22 0 0 0 22 22h160a14 14 0 0 0 14-14V80a14 14 0 0 0-14-14m2 126a2 2 0 0 1-2 2H56a10 10 0 0 1-10-10V75.59A21.84 21.84 0 0 0 56 78h160a2 2 0 0 1 2 2Zm-28-60a10 10 0 1 1-10-10a10 10 0 0 1 10 10"
            : "M216 64H56a8 8 0 0 1 0-16h136a8 8 0 0 0 0-16H56a24 24 0 0 0-24 24v128a24 24 0 0 0 24 24h160a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16m-36 80a12 12 0 1 1 12-12a12 12 0 0 1-12 12"
        }
      ></Path>
    </Svg>
  );
} 