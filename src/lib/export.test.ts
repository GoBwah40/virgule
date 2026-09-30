import { describe, expect, it } from "vitest";

import { exportFileName, toCsv, toMarkdown, type ExportData, type ExportLabels } from "@/lib/export";

const labels: ExportLabels = {
  csvSeparator: ";",
  title: "Recap",
  generatedOn: "Exported",
  participants: "Participants",
  rules: "Rule",
  rule: "positive score",
  roundTitle: (r) => `Round ${r}`,
  summary: (q, t) => `${q}/${t}`,
  empty: "No ideas",
  qualified: "Kept",
  notQualified: "Dropped",
  overview: (o) => ({ summary: `Common slot: ${o.best.start} → ${o.best.end}`, detail: `Shared by the ${o.best.total} kept periods.` }),
  overviewStatus: "Overview",
  columns: { round: "Round", theme: "Theme", idea: "Idea", up: "For", down: "Against", net: "Score", status: "Status" },
};

const data: ExportData = {
  participants: ["Camille", "Sacha"],
  rounds: [
    {
      round: 1,
      qualifiedCount: 1,
      ideaCount: 2,
      tiedThemeCount: 0,
      themes: [
        {
          id: "t1",
          title: "Onboarding",
          description: null,
          kind: "TEXT",
          overview: null,
          ideas: [
            { id: "i1", content: "Video | tutorial\nin 2 min", score: { up: 2, down: 0, net: 2 }, qualified: true, tied: false, isMine: false, mapQuery: null },
            { id: "i2", content: '=HYPERLINK("x"); test', score: { up: 0, down: 1, net: -1 }, qualified: false, tied: false, isMine: false, mapQuery: null },
          ],
        },
      ],
    },
  ],
};

describe("toMarkdown", () => {
  it("escapes pipes and line breaks", () => {
    const md = toMarkdown(data, labels);
    expect(md).toContain("| Video \\| tutorial<br>in 2 min | 2 | 0 | 2 | ✅ Kept |");
    expect(md).toContain("## Round 1");
    expect(md).toContain("Camille, Sacha");
  });
});

describe("toCsv", () => {
  it("adds the BOM, uses \";\" and neutralises formulas", () => {
    const csv = toCsv(data, labels);
    expect(csv.startsWith("﻿Round;Theme;Idea")).toBe(true);
    expect(csv).toContain('1;Onboarding;"Video | tutorial\nin 2 min";2;0;2;Kept');
    expect(csv).toContain(`"'=HYPERLINK(""x""); test"`);
  });

  it("uses \",\" in English and quotes cells containing a comma", () => {
    const csv = toCsv(data, { ...labels, csvSeparator: "," });
    expect(csv.startsWith("\uFEFFRound,Theme,Idea")).toBe(true);
    expect(csv).toContain('1,Onboarding,"Video | tutorial\nin 2 min",2,0,2,Kept');
    expect(csv).toContain(`"'=HYPERLINK(""x""); test",0,1,-1,Dropped`);
  });
});

describe("exportFileName", () => {
  it("produces a file name without accents or spaces", () => {
    expect(exportFileName("Café Offsite — Q4 ", new Date("2026-09-28T10:00:00Z"))).toBe(
      "virgule-cafe-offsite-q4-2026-09-28",
    );
  });
});

describe("overview of Period and Range topics", () => {
  const withOverview: ExportData = {
    participants: ["Camille"],
    rounds: [
      {
        ...data.rounds[0],
        themes: [
          {
            ...data.rounds[0].themes[0],
            title: "Dates",
            kind: "DATE_RANGE",
            overview: {
              type: "dates",
              periods: [
                { start: "2027-06-10", end: "2027-06-14" },
                { start: "2027-06-12", end: "2027-06-16" },
              ],
              best: { start: "2027-06-12", end: "2027-06-14", count: 2, total: 2 },
            },
          },
        ],
      },
    ],
  };

  it("adds it under the topic title in Markdown", () => {
    expect(toMarkdown(withOverview, labels)).toContain(
      "### Dates\n\n**Common slot: 2027-06-12 → 2027-06-14**. Shared by the 2 kept periods.\n",
    );
  });

  it("adds it as the topic's first row in the CSV, without a score", () => {
    expect(toCsv(withOverview, labels)).toContain(
      "1;Dates;Common slot: 2027-06-12 → 2027-06-14. Shared by the 2 kept periods.;;;;Overview\r\n1;Dates;",
    );
  });
});
