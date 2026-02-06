import Svg, { Path } from "react-native-svg";

export function PhHouseLight({
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
            ? "m217.9 110.1l-80-80a14 14 0 0 0-19.8 0l-80 80A13.92 13.92 0 0 0 34 120v96a6 6 0 0 0 6 6h64a6 6 0 0 0 6-6v-58h36v58a6 6 0 0 0 6 6h64a6 6 0 0 0 6-6v-96a13.92 13.92 0 0 0-4.1-9.9M210 210h-52v-58a6 6 0 0 0-6-6h-48a6 6 0 0 0-6 6v58H46v-90a2 2 0 0 1 .58-1.42l80-80a2 2 0 0 1 2.84 0l80 80A2 2 0 0 1 210 120Z"
            : "M224 120v96a8 8 0 0 1-8 8h-56a8 8 0 0 1-8-8v-52a4 4 0 0 0-4-4h-40a4 4 0 0 0-4 4v52a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8v-96a16 16 0 0 1 4.69-11.31l80-80a16 16 0 0 1 22.62 0l80 80A16 16 0 0 1 224 120"
        }
      ></Path>
    </Svg>
  );
} 