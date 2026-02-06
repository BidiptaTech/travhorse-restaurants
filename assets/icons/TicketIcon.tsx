import Svg, { Path } from "react-native-svg";

export function PhTicketLight({
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
            ? "M232 102a6 6 0 0 0 6-6V64a14 14 0 0 0-14-14H32a14 14 0 0 0-14 14v32a6 6 0 0 0 6 6a26 26 0 0 1 0 52a6 6 0 0 0-6 6v32a14 14 0 0 0 14 14h192a14 14 0 0 0 14-14v-32a6 6 0 0 0-6-6a26 26 0 0 1 0-52M30 192v-26.47a38 38 0 0 0 0-75.06V64a2 2 0 0 1 2-2h58v132H32a2 2 0 0 1-2-2m196-26.47V192a2 2 0 0 1-2 2H102V62h122a2 2 0 0 1 2 2v26.47a38 38 0 0 0 0 75.06"
            : "M232 104a8 8 0 0 0 8-8V64a16 16 0 0 0-16-16H32a16 16 0 0 0-16 16v32a8 8 0 0 0 8 8a24 24 0 0 1 0 48a8 8 0 0 0-8 8v32a16 16 0 0 0 16 16h192a16 16 0 0 0 16-16v-32a8 8 0 0 0-8-8a24 24 0 0 1 0-48M32 167.2a40 40 0 0 0 0-78.4V64h56v128H32Z"
        }
      ></Path>
    </Svg>
  );
} 