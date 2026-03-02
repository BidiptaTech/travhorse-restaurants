/**
 * Parse and format QR ticket payload for display in Recent Tickets, History, and scan modal.
 * Payload shape: tid, bid, r, rd, rt, mt, ms, g, p, ref.
 */

export interface ParsedTicket {
  // Tour ID
  tid?: number;
  // Restaurant ID (optional, newer payloads may send this)
  rid?: number | string;
  // Booking ID
  bid?: number;
  // Restaurant name
  r?: string;
  // Received date
  rd?: string;
  // Received time
  rt?: string;
  // Meal type
  mt?: string;
  // Meal specific
  ms?: string;
  // Guests array
  g?: number[];
  // Price
  p?: number;
  // Reference
  ref?: string;
  // DMC name
  dmc?: string;
}

export function parseScannedTicket(raw: string | null): ParsedTicket | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return typeof parsed === "object" && parsed !== null ? (parsed as ParsedTicket) : null;
  } catch {
    return null;
  }
}

/** One-line title and optional subtitle for list rows (Recent Tickets, History). */
export function formatTicketDisplay(code: string): { title: string; subtitle: string } {
  const ticket = parseScannedTicket(code);
  if (ticket && (ticket.tid != null || ticket.bid != null || ticket.r != null)) {
    const parts: string[] = [];
    if (ticket.r) parts.push(ticket.r);
    if (ticket.mt) parts.push(ticket.mt);
    const title = parts.length > 0 ? parts.join(" • ") : `Booking #${ticket.bid ?? ticket.tid ?? "—"}`;
    const subParts: string[] = [];
    if (ticket.rt) subParts.push(ticket.rt);
    if (ticket.p != null) subParts.push(`SGD ${ticket.p}`);
    const subtitle = subParts.length > 0 ? subParts.join(" • ") : (ticket.rd ?? "");
    return { title, subtitle };
  }
  return { title: code || "—", subtitle: "" };
}
