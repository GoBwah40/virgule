// Notes de version : un fichier Markdown par catégorie dans `release-notes/`, une section
// « ## X.Y.Z — AAAA-MM-JJ » par version, une ligne « - … » par changement (voir VERSIONS.md).

export const RELEASE_CATEGORIES = ["added", "improved", "fixed"] as const;
export type ReleaseCategory = (typeof RELEASE_CATEGORIES)[number];

/** Fichier de `release-notes/` propre à chaque catégorie. */
export const RELEASE_NOTE_FILES: Record<ReleaseCategory, string> = {
  added: "ajouts.md",
  improved: "ameliorations.md",
  fixed: "corrections.md",
};

export type Release = {
  version: string;
  /** Date de mise en production, « AAAA-MM-JJ ». */
  date: string;
  changes: Record<ReleaseCategory, string[]>;
};

const HEADING = /^##\s+(\d+\.\d+\.\d+)\s+[—–-]\s+(\d{4}-\d{2}-\d{2})\s*$/;
const ITEM = /^[-*]\s+(.+)$/;

/** Compare deux versions « X.Y.Z » : négatif si `a` est plus ancienne. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

/** Sections d'un fichier : version, date et changements. Le texte hors section est ignoré. */
function parseFile(source: string, file: string) {
  const sections: { version: string; date: string; items: string[] }[] = [];
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      const heading = HEADING.exec(line);
      if (!heading) throw new Error(`${file} : titre de version invalide « ${line} » (attendu « ## 1.2.3 — 2026-09-30 »)`);
      sections.push({ version: heading[1], date: heading[2], items: [] });
      continue;
    }
    const item = ITEM.exec(line);
    if (item && sections.length > 0) sections.at(-1)!.items.push(item[1]);
  }
  return sections;
}

/**
 * Fusionne les trois fichiers en une liste de versions, de la plus récente à la plus ancienne.
 * Refuse une version dont la date diffère d'un fichier à l'autre, ou présente deux fois.
 */
export function parseReleaseNotes(sources: Record<ReleaseCategory, string>): Release[] {
  const releases = new Map<string, Release>();
  for (const category of RELEASE_CATEGORIES) {
    const file = RELEASE_NOTE_FILES[category];
    const seen = new Set<string>();
    for (const { version, date, items } of parseFile(sources[category], file)) {
      if (seen.has(version)) throw new Error(`${file} : la version ${version} apparaît deux fois`);
      seen.add(version);
      const release = releases.get(version) ?? { version, date, changes: { added: [], improved: [], fixed: [] } };
      if (release.date !== date) {
        throw new Error(`${file} : la version ${version} est datée du ${date}, ailleurs du ${release.date}`);
      }
      release.changes[category].push(...items);
      releases.set(version, release);
    }
  }
  return [...releases.values()]
    .filter((release) => RELEASE_CATEGORIES.some((category) => release.changes[category].length > 0))
    .sort((a, b) => compareVersions(b.version, a.version));
}
