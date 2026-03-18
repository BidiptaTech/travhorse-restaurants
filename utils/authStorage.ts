/**
 * Auth storage: persist login so user stays logged in until they explicitly log out.
 * Uses AsyncStorage when available; falls back silently if not.
 */

export interface StoredAuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export interface StoredAuth {
  token: string;
  user: StoredAuthUser;
}

const AUTH_KEY = "travhorse_auth";
/** Profile image per user: key = prefix + userId (one image per user; overwritten each time). */
const PROFILE_IMAGE_KEY_PREFIX = "travhorse_profile_image_";

function profileImageKey(userId: string): string {
  return PROFILE_IMAGE_KEY_PREFIX + userId;
}

export async function saveAuth(auth: StoredAuth): Promise<void> {
  try {
    const { default: AsyncStorage } =
      await import("@react-native-async-storage/async-storage");
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  } catch {
    // Ignore storage errors; app will still work without persistence.
  }
}

/** Merge fields into the stored auth user (keeps existing token/user fields). */
export async function updateStoredAuthUser(
  partial: Partial<StoredAuthUser>,
): Promise<void> {
  try {
    const { default: AsyncStorage } =
      await import("@react-native-async-storage/async-storage");
    const raw = await AsyncStorage.getItem(AUTH_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    if (!parsed?.token || !parsed?.user) return;
    const next: StoredAuth = {
      token: parsed.token,
      user: { ...(parsed.user as StoredAuthUser), ...partial },
    };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors.
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

/**
 * Clear auth and, if userId is provided, clear that user's stored profile image.
 * Call with current user id on logout so storage is scoped per account (email/id).
 */
export async function clearAuth(userId?: string): Promise<void> {
  try {
    const { default: AsyncStorage } =
      await import("@react-native-async-storage/async-storage");
    await AsyncStorage.removeItem(AUTH_KEY);
    if (userId) {
      await AsyncStorage.removeItem(profileImageKey(userId));
    }
  } catch {
    // Ignore; nothing critical if it fails.
  }
}

/** Get the stored profile image URI for this user (used when login returns no image). */
export async function getStoredProfileImage(
  userId: string,
): Promise<string | null> {
  if (!userId) return null;
  try {
    const { default: AsyncStorage } =
      await import("@react-native-async-storage/async-storage");
    return await AsyncStorage.getItem(profileImageKey(userId));
  } catch {
    return null;
  }
}

/** Store profile image URI for this user; overwrites previous (one image per user). */
export async function setStoredProfileImage(
  userId: string,
  uri: string,
): Promise<void> {
  if (!userId) return;
  try {
    const { default: AsyncStorage } =
      await import("@react-native-async-storage/async-storage");
    await AsyncStorage.setItem(profileImageKey(userId), uri);
  } catch {
    // Ignore storage errors.
  }
}
