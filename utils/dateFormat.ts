/**
 * Format a date string or Date as "Mon, 17 Feb 26".
 */
export function formatDateShort(
  dateInput: string | Date | null | undefined
): string {
  if (dateInput == null || dateInput === "") return "—";
  const d =
    typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

/**
 * Format a time string (e.g. "15:00" or ISO) as "3:00 PM".
 */
export function formatTimeAmPm(
  timeInput: string | Date | null | undefined
): string {
  if (timeInput == null || timeInput === "") return "—";
  let date: Date;
  if (timeInput instanceof Date) {
    date = timeInput;
  } else if (typeof timeInput === "string") {
    const s = timeInput.trim();
    date = /^\d{1,2}:\d{2}/.test(s)
      ? new Date("1970-01-01T" + s)
      : new Date(s);
  } else {
    return "—";
  }
  if (Number.isNaN(date.getTime())) return String(timeInput);
  const t = date.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return t.replace(/\s*(am|pm)\s*$/i, (_, m) => " " + m.toUpperCase());
}
