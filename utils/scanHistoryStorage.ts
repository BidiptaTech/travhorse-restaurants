/**
 * Scan history: persistent storage of all scans (never auto-deleted).
 * Used for the History screen, grouped by date (Today, Yesterday, then dates).
 */

export interface ScanHistoryItem {
  code: string;
  time: string; // "HH:mm" local
  date: string; // "YYYY-MM-DD"
  timestamp: number; // Unix timestamp for sorting
}

const STORAGE_KEY_PREFIX = "travhorse_scan_history";

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

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getTimeString(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDateLabel(dateStr: string): string {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  // Format as "Mon, Jan 15" or similar
  const d = new Date(dateStr + "T00:00:00");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

export async function getAllHistoryScans(userId: string): Promise<ScanHistoryItem[]> {
  try {
    const { default: AsyncStorage } = await import(
      "@react-native-async-storage/async-storage"
    );
    const key = storageKey(userId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScanHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addHistoryScan(userId: string, code: string): Promise<void> {
  if (!code.trim()) return;
  try {
    const { default: AsyncStorage } = await import(
      "@react-native-async-storage/async-storage"
    );
    const key = storageKey(userId);
    const existing = await getAllHistoryScans(userId);
    const date = getTodayDateString();
    const item: ScanHistoryItem = {
      code: code.trim(),
      time: getTimeString(),
      date,
      timestamp: Date.now(),
    };
    const scans = [...existing, item];
    // Sort by timestamp descending (newest first)
    scans.sort((a, b) => b.timestamp - a.timestamp);
    await AsyncStorage.setItem(key, JSON.stringify(scans));
  } catch {
    // Ignore storage errors
  }
}

export interface GroupedScans {
  label: string; // "Today", "Yesterday", or "Mon, Jan 15"
  date: string; // "YYYY-MM-DD"
  scans: ScanHistoryItem[];
}

export type HistoryDeleteRange = "today" | "7d" | "1m" | "3m" | "all";

export async function deleteHistoryScan(userId: string, timestamp: number): Promise<void> {
  try {
    const { default: AsyncStorage } = await import(
      "@react-native-async-storage/async-storage"
    );
    const key = storageKey(userId);
    const existing = await getAllHistoryScans(userId);
    const filtered = existing.filter((item) => item.timestamp !== timestamp);
    await AsyncStorage.setItem(key, JSON.stringify(filtered));
  } catch {
    // Ignore storage errors
  }
}

export function groupScansByDate(scans: ScanHistoryItem[]): GroupedScans[] {
  const grouped = new Map<string, ScanHistoryItem[]>();
  scans.forEach((scan) => {
    if (!grouped.has(scan.date)) {
      grouped.set(scan.date, []);
    }
    grouped.get(scan.date)!.push(scan);
  });
  const result: GroupedScans[] = [];
  grouped.forEach((items, date) => {
    result.push({
      label: formatDateLabel(date),
      date,
      scans: items.sort((a, b) => {
        // Within same date, sort by time descending (newest first)
        return b.timestamp - a.timestamp;
      }),
    });
  });
  // Sort groups: Today first, Yesterday second, then by date descending
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  result.sort((a, b) => {
    if (a.date === today) return -1;
    if (b.date === today) return 1;
    if (a.date === yesterday) return -1;
    if (b.date === yesterday) return 1;
    return b.date.localeCompare(a.date); // Descending
  });
  return result;
}

export async function deleteHistoryRange(userId: string, range: HistoryDeleteRange): Promise<void> {
  try {
    const { default: AsyncStorage } = await import(
      "@react-native-async-storage/async-storage"
    );
    const key = storageKey(userId);
    if (range === "all") {
      await AsyncStorage.removeItem(key);
      return;
    }
    const scans = await getAllHistoryScans(userId);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const today = getTodayDateString();
    let filtered: ScanHistoryItem[] = [];

    if (range === "today") {
      filtered = scans.filter((s) => s.date !== today);
    } else if (range === "7d") {
      const cutoff = now - 7 * oneDayMs;
      filtered = scans.filter((s) => s.timestamp < cutoff);
    } else if (range === "1m") {
      const cutoff = now - 30 * oneDayMs;
      filtered = scans.filter((s) => s.timestamp < cutoff);
    } else if (range === "3m") {
      const cutoff = now - 90 * oneDayMs;
      filtered = scans.filter((s) => s.timestamp < cutoff);
    }

    await AsyncStorage.setItem(key, JSON.stringify(filtered));
  } catch {
    // ignore errors
  }
}
