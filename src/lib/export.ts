// Mise en forme des exports du récapitulatif (fonctions pures, testées dans export.test.ts).

import type { RecapRound } from "@/lib/room";

export type ExportLabels = {
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
  columns: { round: string; theme: string; idea: string; up: string; down: string; net: string; status: string };
};

export type ExportData = { participants: string[]; rounds: RecapRound[] };

/** Échappe les caractères qui casseraient un tableau Markdown. */
const mdCell = (value: string) => value.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");

export function toMarkdown(data: ExportData, l: ExportLabels): string {
  const lines: string[] = [
    `# ${l.title}`,
    "",
    `_${l.generatedOn}_`,
    "",
    `- **${l.participants}** : ${data.participants.join(", ")}`,
    `- **${l.rules}** : ${l.rule}`,
    "",
  ];

  // Tour le plus récent en premier : c'est le résultat final.
  for (const round of [...data.rounds].reverse()) {
    lines.push(`## ${l.roundTitle(round.round)}`, "", l.summary(round.qualifiedCount, round.ideaCount), "");
    for (const theme of round.themes) {
      lines.push(`### ${theme.title}`, "");
      if (theme.description) lines.push(`> ${theme.description.replace(/\r?\n/g, " ")}`, "");
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

/** Cellule CSV (RFC 4180) + neutralisation des formules pour Excel. */
function csvCell(value: string | number): string {
  let s = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * CSV séparé par « ; » (convention Excel en français) avec BOM UTF-8,
 * pour que les accents s'affichent correctement à l'ouverture.
 */
export function toCsv(data: ExportData, l: ExportLabels): string {
  const c = l.columns;
  const rows: (string | number)[][] = [[c.round, c.theme, c.idea, c.up, c.down, c.net, c.status]];
  for (const round of data.rounds) {
    for (const theme of round.themes) {
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
  return "﻿" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n") + "\r\n";
}

/** Nom de fichier sûr : « virgule-offsite-produit-q4-2026-09-28 ». */
export function exportFileName(roomName: string, date: Date): string {
  const slug = roomName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return `virgule-${slug || "recap"}-${date.toISOString().slice(0, 10)}`;
}
