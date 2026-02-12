/**
 * Today's scans: stored in AsyncStorage, cleared automatically after the day changes.
 * Used for "Recent Tickets" on the scanner home (today only).
 */

export interface TodayScanItem {
  id: number;
  code: string;
  time: string; // "HH:mm" local
}

const STORAGE_KEY_PREFIX = "travhorse_today_scans";

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}_${userId || "default"}`;
}

function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getTimeString(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export async function getTodayScans(userId: string): Promise<TodayScanItem[]> {
  try {
    const { default: AsyncStorage } = await import(
      "@react-native-async-storage/async-storage"
    );
    const key = storageKey(userId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { date?: string; scans?: TodayScanItem[] };
    const storedDate = parsed?.date;
    const today = getTodayDateString();
    if (storedDate !== today) {
      await AsyncStorage.removeItem(key);
      return [];
    }
    return Array.isArray(parsed.scans) ? parsed.scans : [];
  } catch {
    return [];
  }
}

export async function addTodayScan(userId: string, code: string): Promise<void> {
  if (!code.trim()) return;
  try {
    const { default: AsyncStorage } = await import(
      "@react-native-async-storage/async-storage"
    );
    const key = storageKey(userId);
    const today = getTodayDateString();
    const existing = await getTodayScans(userId);
    const item: TodayScanItem = {
      id: Date.now(),
      code: code.trim(),
      time: getTimeString(),
    };
    const scans = [...existing, item];
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ date: today, scans })
    );
  } catch {
    // Ignore storage errors
  }
}

export async function deleteTodayScan(userId: string, target: TodayScanItem): Promise<void> {
  try {
    const { default: AsyncStorage } = await import(
      "@react-native-async-storage/async-storage"
    );
    const key = storageKey(userId);
    const today = getTodayDateString();
    const existing = await getTodayScans(userId);
    const filtered = existing.filter((item) => {
      // Prefer deleting by unique id when available.
      if (target.id != null && item.id != null) {
        return item.id !== target.id;
      }
      // Fallback for any legacy items without id.
      return !(item.code === target.code && item.time === target.time);
    });
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ date: today, scans: filtered })
    );
  } catch {
    // Ignore storage errors
  }
}
