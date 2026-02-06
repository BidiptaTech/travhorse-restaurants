declare module "nativewind" {
  export function useColorScheme(): {
    colorScheme: "light" | "dark";
    setColorScheme: (scheme: "light" | "dark") => void;
  };
}
