import { describe, expect, it } from "vitest";

import { exportFileName, toCsv, toMarkdown, type ExportData, type ExportLabels } from "@/lib/export";

const labels: ExportLabels = {
  title: "Récap",
  generatedOn: "Exporté",
  participants: "Participants",
  rules: "Règle",
  rule: "score positif",
  roundTitle: (r) => `Tour ${r}`,
  summary: (q, t) => `${q}/${t}`,
  empty: "Aucune idée",
  qualified: "Retenue",
  notQualified: "Écartée",
  overview: (o) => ({ summary: `Créneau commun : ${o.best.start} → ${o.best.end}`, detail: `Commun aux ${o.best.total} périodes retenues.` }),
  overviewStatus: "Synthèse",
  columns: { round: "Tour", theme: "Thème", idea: "Idée", up: "Pour", down: "Contre", net: "Score", status: "Statut" },
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
            { id: "i1", content: "Vidéo | tuto\nen 2 min", score: { up: 2, down: 0, net: 2 }, qualified: true, tied: false, isMine: false, mapQuery: null },
            { id: "i2", content: '=HYPERLINK("x"); test', score: { up: 0, down: 1, net: -1 }, qualified: false, tied: false, isMine: false, mapQuery: null },
          ],
        },
      ],
    },
  ],
};

describe("toMarkdown", () => {
  it("échappe les pipes et les retours à la ligne", () => {
    const md = toMarkdown(data, labels);
    expect(md).toContain("| Vidéo \\| tuto<br>en 2 min | 2 | 0 | 2 | ✅ Retenue |");
    expect(md).toContain("## Tour 1");
    expect(md).toContain("Camille, Sacha");
  });
});

describe("toCsv", () => {
  it("ajoute le BOM, utilise « ; » et neutralise les formules", () => {
    const csv = toCsv(data, labels);
    expect(csv.startsWith("﻿Tour;Thème;Idée")).toBe(true);
    expect(csv).toContain('1;Onboarding;"Vidéo | tuto\nen 2 min";2;0;2;Retenue');
    expect(csv).toContain(`"'=HYPERLINK(""x""); test"`);
  });
});

describe("exportFileName", () => {
  it("produit un nom de fichier sans accents ni espaces", () => {
    expect(exportFileName("Offsite Produit — Q4 ", new Date("2026-09-28T10:00:00Z"))).toBe(
      "virgule-offsite-produit-q4-2026-09-28",
    );
  });
});

describe("synthèse des sujets Période et Fourchette", () => {
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

  it("l'ajoute sous le titre du sujet en Markdown", () => {
    expect(toMarkdown(withOverview, labels)).toContain(
      "### Dates\n\n**Créneau commun : 2027-06-12 → 2027-06-14**. Commun aux 2 périodes retenues.\n",
    );
  });

  it("l'ajoute en première ligne du sujet dans le CSV, sans score", () => {
    expect(toCsv(withOverview, labels)).toContain(
      "1;Dates;Créneau commun : 2027-06-12 → 2027-06-14. Commun aux 2 périodes retenues.;;;;Synthèse\r\n1;Dates;",
    );
  });
});
