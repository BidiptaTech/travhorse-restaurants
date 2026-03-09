/**
 * Auth storage: persist login so user stays logged in until they explicitly log out.
 * Uses AsyncStorage when available; falls back silently if not.
 */

export interface StoredAuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface StoredAuth {
  token: string;
  user: StoredAuthUser;
}

const AUTH_KEY = "travhorse_auth";

export async function saveAuth(auth: StoredAuth): Promise<void> {
  try {
    const { default: AsyncStorage } =
      await import("@react-native-async-storage/async-storage");
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  } catch {
    // Ignore storage errors; app will still work without persistence.
  }
}

export async function loadAuth(): Promise<StoredAuth | null> {
  try {
    const { default: AsyncStorage } =
      await import("@react-native-async-storage/async-storage");
    const raw = await AsyncStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.user) return null;
    return parsed as StoredAuth;
  } catch {
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  try {
    const { default: AsyncStorage } =
      await import("@react-native-async-storage/async-storage");
    await AsyncStorage.removeItem(AUTH_KEY);
  } catch {
    // Ignore; nothing critical if it fails.
  }
}
