// Release notes: one folder per language in `release-notes/`, one Markdown file per category,
// one "## X.Y.Z — YYYY-MM-DD" section per version, one "- …" line per change (see VERSIONS.md).

export const RELEASE_CATEGORIES = ["added", "improved", "fixed"] as const;
export type ReleaseCategory = (typeof RELEASE_CATEGORIES)[number];

/** File of each category, in `release-notes/<locale>/`. */
export const releaseNoteFile = (category: ReleaseCategory) => `${category}.md`;

export type Release = {
  version: string;
  /** Production release date, "YYYY-MM-DD". */
  date: string;
  changes: Record<ReleaseCategory, string[]>;
};

const HEADING = /^##\s+(\d+\.\d+\.\d+)\s+[—–-]\s+(\d{4}-\d{2}-\d{2})\s*$/;
const ITEM = /^[-*]\s+(.+)$/;

/** Compares two "X.Y.Z" versions: negative if `a` is older. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

/** Sections of a file: version, date and changes. Text outside sections is ignored. */
function parseFile(source: string, file: string) {
  const sections: { version: string; date: string; items: string[] }[] = [];
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      const heading = HEADING.exec(line);
      if (!heading) throw new Error(`${file}: invalid version heading "${line}" (expected "## 1.2.3 — 2026-09-30")`);
      sections.push({ version: heading[1], date: heading[2], items: [] });
      continue;
    }
    const item = ITEM.exec(line);
    if (item && sections.length > 0) sections.at(-1)!.items.push(item[1]);
  }
  return sections;
}

/**
 * Merges the three files of a language into a list of versions, newest first.
 * Rejects a version dated differently from one file to another, or present twice.
 */
export function parseReleaseNotes(sources: Record<ReleaseCategory, string>): Release[] {
  const releases = new Map<string, Release>();
  for (const category of RELEASE_CATEGORIES) {
    const file = releaseNoteFile(category);
    const seen = new Set<string>();
    for (const { version, date, items } of parseFile(sources[category], file)) {
      if (seen.has(version)) throw new Error(`${file}: version ${version} appears twice`);
      seen.add(version);
      const release = releases.get(version) ?? { version, date, changes: { added: [], improved: [], fixed: [] } };
      if (release.date !== date) {
        throw new Error(`${file}: version ${version} is dated ${date}, elsewhere ${release.date}`);
      }
      release.changes[category].push(...items);
      releases.set(version, release);
    }
  }
  return [...releases.values()]
    .filter((release) => RELEASE_CATEGORIES.some((category) => release.changes[category].length > 0))
    .sort((a, b) => compareVersions(b.version, a.version));
}
