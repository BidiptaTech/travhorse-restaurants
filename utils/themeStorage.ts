/**
 * Safe theme storage. Uses AsyncStorage when the native module is available,
 * otherwise falls back to in-memory so the app doesn't crash (e.g. in Expo Go
 * or dev builds that weren't rebuilt after adding AsyncStorage).
 */

export const THEME_KEY = "app_theme";
export type Theme = "light" | "dark";

let memoryTheme: Theme | null = null;

export async function getStoredTheme(): Promise<Theme> {
  try {
    const { default: AsyncStorage } = await import(
      "@react-native-async-storage/async-storage"
    );
    const stored = await AsyncStorage.getItem(THEME_KEY);
    const theme =
      stored === "dark" || stored === "light" ? stored : "light";
    memoryTheme = theme;
    return theme;
  } catch {
    return memoryTheme ?? "light";
  }
}

export async function setStoredTheme(theme: Theme): Promise<void> {
  memoryTheme = theme;
  try {
    const { default: AsyncStorage } = await import(
      "@react-native-async-storage/async-storage"
    );
    await AsyncStorage.setItem(THEME_KEY, theme);
  } catch {
    // NativeModule may be null; in-memory is already set
  }
}
