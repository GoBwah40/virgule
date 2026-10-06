import { describe, expect, it } from "vitest";

import { decidedDates, toIcs } from "@/lib/calendar";

const idea = (net: number, dateStart: string | null, dateEnd: string | null, qualified = true) => ({
  score: { up: Math.max(net, 0), down: Math.max(-net, 0), net },
  qualified,
  dateStart,
  dateEnd,
});

describe("decidedDates", () => {
  it("takes the common slot of the kept periods when there is one", () => {
    const common = { start: "2027-06-04", end: "2027-06-06", count: 2, total: 3 };
    expect(decidedDates("DATE_RANGE", common, [idea(2, "2027-06-01", "2027-06-10")])).toEqual({
      start: "2027-06-04",
      end: "2027-06-06",
    });
  });

  it("otherwise takes the kept idea in the lead, a single date lasting one day", () => {
    expect(decidedDates("DATE", null, [idea(1, "2027-06-12", null), idea(3, "2027-06-19", null)])).toEqual({
      start: "2027-06-19",
      end: "2027-06-19",
    });
  });

  it("gives nothing for a tie, nothing kept, or another kind of topic", () => {
    expect(decidedDates("DATE", null, [idea(2, "2027-06-12", null), idea(2, "2027-06-19", null)])).toBeNull();
    expect(decidedDates("DATE", null, [idea(-1, "2027-06-12", null, false)])).toBeNull();
    expect(decidedDates("TEXT", null, [idea(2, null, null)])).toBeNull();
  });
});

describe("toIcs", () => {
  const ics = toIcs({
    uid: "t1@virgule",
    title: "Weekend away, Annecy; summer",
    description: "“When?”\nDecided together",
    dates: { start: "2027-06-30", end: "2027-07-02" },
    stamp: new Date("2026-10-06T12:34:56.789Z"),
  });

  it("is an all-day event ending the day after the last day, in CRLF lines", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20270630\r\n");
    expect(ics).toContain("DTEND;VALUE=DATE:20270703\r\n");
    expect(ics).toContain("DTSTAMP:20261006T123456Z\r\n");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("escapes text values", () => {
    expect(ics).toContain("SUMMARY:Weekend away\\, Annecy\; summer\r\n");
    expect(ics).toContain("DESCRIPTION:“When?”\\nDecided together\r\n");
  });

  it("folds long lines at 75 octets without cutting a character", () => {
    const long = toIcs({ uid: "u", title: "é".repeat(60), description: "", dates: { start: "2027-06-01", end: "2027-06-01" }, stamp: new Date(0) });
    const lines = long.split("\r\n").filter((line) => line.startsWith("SUMMARY") || line.startsWith(" "));
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(lines.map((line, i) => (i === 0 ? line : line.slice(1))).join("")).toBe(`SUMMARY:${"é".repeat(60)}`);
  });
});
