// Calendar file for a decided date or period (pure functions, tested in calendar.test.ts).

import type { Overlap } from "@/lib/overview";
import type { Score } from "@/lib/results";
import { topQualified } from "@/lib/results";

export type CalendarDates = { start: string; end: string };

/**
 * What the group settled on in a "Date" or "Period" topic: the common slot of the kept periods
 * when there is one, otherwise the kept idea in the lead, if it leads alone. Nothing for a tie,
 * nothing kept, or another kind of topic.
 */
export function decidedDates(
  kind: string,
  common: Overlap<string> | null,
  ideas: { score: Score; qualified: boolean; dateStart: string | null; dateEnd: string | null }[],
): CalendarDates | null {
  if (kind !== "DATE" && kind !== "DATE_RANGE") return null;
  if (common) return { start: common.start, end: common.end };
  const top = topQualified(ideas);
  if (top.length !== 1 || !top[0].dateStart) return null;
  return { start: top[0].dateStart, end: top[0].dateEnd ?? top[0].dateStart };
}

/** "2027-06-01" → "20270601"; `days` later for the exclusive end of an all-day event. */
function icsDate(date: string, days = 0) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

/** Text value (RFC 5545 §3.3.11): backslash, semicolon, comma and line breaks escaped. */
const icsText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Lines of 75 octets at most, continued after a space (§3.1), never cutting a character. */
function fold(line: string) {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    // Continuation lines start with a space, which counts.
    if (size + bytes > (parts.length === 0 ? 75 : 74)) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** A single all-day event, readable by every calendar app (Apple, Google, Outlook). */
export function toIcs(event: { uid: string; title: string; description: string; dates: CalendarDates; stamp: Date }) {
  const stamp = event.stamp.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Virgule//Recap//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(event.dates.start)}`,
    // The end of an all-day event is the day after the last one.
    `DTEND;VALUE=DATE:${icsDate(event.dates.end, 1)}`,
    `SUMMARY:${icsText(event.title)}`,
    `DESCRIPTION:${icsText(event.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
