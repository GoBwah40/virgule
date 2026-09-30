import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import packageJson from "../../package.json";

import {
  compareVersions,
  parseReleaseNotes,
  RELEASE_CATEGORIES,
  RELEASE_NOTE_FILES,
  type ReleaseCategory,
} from "./release-notes";

const sources = (partial: Partial<Record<ReleaseCategory, string>>) => ({ added: "", improved: "", fixed: "", ...partial });

describe("compareVersions", () => {
  it("compare chaque nombre, pas le texte", () => {
    expect(compareVersions("0.10.0", "0.9.3")).toBeGreaterThan(0);
    expect(compareVersions("1.0.0", "1.0.1")).toBeLessThan(0);
    expect(compareVersions("2.1.0", "2.1.0")).toBe(0);
  });
});

describe("parseReleaseNotes", () => {
  it("fusionne les catégories par version, de la plus récente à la plus ancienne", () => {
    const releases = parseReleaseNotes(
      sources({
        added: "# Ajouts\n\nIntro ignorée.\n\n## 0.2.0 — 2026-10-02\n\n- Minuteur\n- QR code\n\n## 0.1.0 — 2026-09-28\n\n- Première version\n",
        fixed: "# Corrections\n\n## 0.2.0 — 2026-10-02\n\n- Mode sombre\n",
      }),
    );
    expect(releases).toEqual([
      { version: "0.2.0", date: "2026-10-02", changes: { added: ["Minuteur", "QR code"], improved: [], fixed: ["Mode sombre"] } },
      { version: "0.1.0", date: "2026-09-28", changes: { added: ["Première version"], improved: [], fixed: [] } },
    ]);
  });

  it("ignore une version sans changement", () => {
    expect(parseReleaseNotes(sources({ improved: "## 0.1.0 — 2026-09-28\n" }))).toEqual([]);
  });

  it("refuse un titre de version mal formé", () => {
    expect(() => parseReleaseNotes(sources({ added: "## v0.1 du 28 septembre\n- Idée" }))).toThrow(/titre de version invalide/);
  });

  it("refuse une même version datée différemment selon les fichiers", () => {
    expect(() =>
      parseReleaseNotes(sources({ added: "## 0.1.0 — 2026-09-28\n- A", fixed: "## 0.1.0 — 2026-09-29\n- B" })),
    ).toThrow(/datée du 2026-09-29/);
  });

  it("refuse une version présente deux fois dans un fichier", () => {
    expect(() => parseReleaseNotes(sources({ added: "## 0.1.0 — 2026-09-28\n- A\n## 0.1.0 — 2026-09-28\n- B" }))).toThrow(
      /apparaît deux fois/,
    );
  });
});

// Garde-fous sur les vrais fichiers : ils cassent `pnpm check` avant qu'une release mal notée parte.
describe("dossier release-notes", () => {
  const dir = path.join(process.cwd(), "release-notes");
  const releases = parseReleaseNotes(
    Object.fromEntries(
      RELEASE_CATEGORIES.map((category) => [category, readFileSync(path.join(dir, RELEASE_NOTE_FILES[category]), "utf8")]),
    ) as Record<ReleaseCategory, string>,
  );

  it("décrit la version de package.json en premier", () => {
    expect(releases[0]?.version).toBe(packageJson.version);
  });

  it("date les versions dans l'ordre", () => {
    const dates = releases.map((release) => release.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});
