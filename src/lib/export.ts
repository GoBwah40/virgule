// Formatting of the recap exports (pure functions, tested in export.test.ts).

import type { RecapOverview, RecapRound } from "@/lib/room";

export type ExportLabels = {
  /** CSV column separator expected by Excel in the reader's language. */
  csvSeparator: ";" | ",";
  /** Colon after a label: French typography puts a space before it. */
  colon: " : " | ": ";
  title: string;
  generatedOn: string;
  participants: string;
  rules: string;
  rule: string;
  roundTitle: (round: number) => string;
  summary: (qualified: number, total: number) => string;
  empty: string;
  qualified: string;
  notQualified: string;
  /** "Period" and "Range" topics: recap overview (common slot, compatible budget). */
  overview: (overview: RecapOverview) => { summary: string; detail: string };
  /** Status of the overview row in the CSV. */
  overviewStatus: string;
  columns: { round: string; theme: string; idea: string; up: string; down: string; net: string; status: string };
};

export type ExportData = { participants: string[]; rounds: RecapRound[] };

/**
 * Text typed by participants (names, topics, ideas), shown as plain text: Markdown and HTML
 * characters are escaped, so nobody can slip emphasis, a link or a tag into the shared file.
 * Line breaks become spaces, so nothing typed can start a line (a heading, a list…): "#" and
 * "!" stay as they are, French punctuation included.
 */
const mdText = (value: string) => value.replace(/[\\`*_[\]<>|~]/g, "\\$&").replace(/\s*\r?\n\s*/g, " ");

/** Same, in a table cell, where a line break is kept as <br>. */
const mdCell = (value: string) =>
  value
    .split(/\r?\n/)
    .map(mdText)
    .join("<br>");

export function toMarkdown(data: ExportData, l: ExportLabels): string {
  const lines: string[] = [
    `# ${mdText(l.title)}`,
    "",
    `_${l.generatedOn}_`,
    "",
    `- **${l.participants}**${l.colon}${data.participants.map(mdText).join(", ")}`,
    `- **${l.rules}**${l.colon}${l.rule}`,
    "",
  ];

  // Most recent round first: it is the final result.
  for (const round of [...data.rounds].reverse()) {
    lines.push(`## ${l.roundTitle(round.round)}`, "", l.summary(round.qualifiedCount, round.ideaCount), "");
    for (const theme of round.themes) {
      lines.push(`### ${mdText(theme.title)}`, "");
      if (theme.description) lines.push(`> ${mdText(theme.description)}`, "");
      if (theme.overview) {
        const { summary, detail } = l.overview(theme.overview);
        lines.push(`**${mdText(summary)}**. ${mdText(detail)}`, "");
      }
      if (theme.ideas.length === 0) {
        lines.push(`_${l.empty}_`, "");
        continue;
      }
      const c = l.columns;
      lines.push(`| ${c.idea} | ${c.up} | ${c.down} | ${c.net} | ${c.status} |`, "| --- | ---: | ---: | ---: | --- |");
      for (const idea of theme.ideas) {
        const status = idea.qualified ? `✅ ${l.qualified}` : l.notQualified;
        lines.push(`| ${mdCell(idea.content)} | ${idea.score.up} | ${idea.score.down} | ${idea.score.net} | ${status} |`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

/** CSV cell (RFC 4180) + formula neutralisation for Excel. */
function csvCell(value: string | number): string {
  let s = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * CSV with the separator Excel expects in the reader's language (";" in French, "," in English)
 * and a UTF-8 BOM, so that accents display correctly when opened.
 */
export function toCsv(data: ExportData, l: ExportLabels): string {
  const c = l.columns;
  const rows: (string | number)[][] = [[c.round, c.theme, c.idea, c.up, c.down, c.net, c.status]];
  for (const round of data.rounds) {
    for (const theme of round.themes) {
      // Overview at the top of the topic, without a score: one readable row in the spreadsheet.
      if (theme.overview) {
        const { summary, detail } = l.overview(theme.overview);
        rows.push([round.round, theme.title, `${summary}. ${detail}`, "", "", "", l.overviewStatus]);
      }
      for (const idea of theme.ideas) {
        rows.push([
          round.round,
          theme.title,
          idea.content,
          idea.score.up,
          idea.score.down,
          idea.score.net,
          idea.qualified ? l.qualified : l.notQualified,
        ]);
      }
    }
  }
  return "﻿" + rows.map((r) => r.map(csvCell).join(l.csvSeparator)).join("\r\n") + "\r\n";
}

/**
 * Safe file name: "virgule-product-offsite-q4-2026-09-28". The day is taken in `timeZone`, the
 * one of "Generated on" inside the file, so both agree around midnight.
 */
export function exportFileName(roomName: string, date: Date, timeZone: string): string {
  const slug = roomName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  // en-CA writes dates as YYYY-MM-DD.
  const day = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return `virgule-${slug || "recap"}-${day}`;
}
