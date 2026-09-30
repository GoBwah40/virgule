import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { locales } from "@/i18n/config";

import packageJson from "../../package.json";

import { compareVersions, parseReleaseNotes, RELEASE_CATEGORIES, releaseNoteFile, type ReleaseCategory } from "./release-notes";

const sources = (partial: Partial<Record<ReleaseCategory, string>>) => ({ added: "", improved: "", fixed: "", ...partial });

describe("compareVersions", () => {
  it("compares each number, not the text", () => {
    expect(compareVersions("0.10.0", "0.9.3")).toBeGreaterThan(0);
    expect(compareVersions("1.0.0", "1.0.1")).toBeLessThan(0);
    expect(compareVersions("2.1.0", "2.1.0")).toBe(0);
  });
});

describe("parseReleaseNotes", () => {
  it("merges categories per version, newest first", () => {
    const releases = parseReleaseNotes(
      sources({
        added: "# Added\n\nIgnored intro.\n\n## 0.2.0 — 2026-10-02\n\n- Timer\n- QR code\n\n## 0.1.0 — 2026-09-28\n\n- First version\n",
        fixed: "# Fixed\n\n## 0.2.0 — 2026-10-02\n\n- Dark mode\n",
      }),
    );
    expect(releases).toEqual([
      { version: "0.2.0", date: "2026-10-02", changes: { added: ["Timer", "QR code"], improved: [], fixed: ["Dark mode"] } },
      { version: "0.1.0", date: "2026-09-28", changes: { added: ["First version"], improved: [], fixed: [] } },
    ]);
  });

  it("skips a version without changes", () => {
    expect(parseReleaseNotes(sources({ improved: "## 0.1.0 — 2026-09-28\n" }))).toEqual([]);
  });

  it("rejects a malformed version heading", () => {
    expect(() => parseReleaseNotes(sources({ added: "## v0.1 on September 28\n- Idea" }))).toThrow(/invalid version heading/);
  });

  it("rejects a version dated differently across files", () => {
    expect(() =>
      parseReleaseNotes(sources({ added: "## 0.1.0 — 2026-09-28\n- A", fixed: "## 0.1.0 — 2026-09-29\n- B" })),
    ).toThrow(/is dated 2026-09-29/);
  });

  it("rejects a version present twice in a file", () => {
    expect(() => parseReleaseNotes(sources({ added: "## 0.1.0 — 2026-09-28\n- A\n## 0.1.0 — 2026-09-28\n- B" }))).toThrow(
      /appears twice/,
    );
  });
});

// Guards on the real files: they break `pnpm check` before a badly noted release ships.
describe("release-notes folder", () => {
  const read = (locale: string) =>
    parseReleaseNotes(
      Object.fromEntries(
        RELEASE_CATEGORIES.map((category) => [
          category,
          readFileSync(path.join(process.cwd(), "release-notes", locale, releaseNoteFile(category)), "utf8"),
        ]),
      ) as Record<ReleaseCategory, string>,
    );
  const [reference, ...others] = locales.map((locale) => ({ locale, releases: read(locale) }));

  it("describes the package.json version first", () => {
    expect(reference.releases[0]?.version).toBe(packageJson.version);
  });

  it("dates versions in order", () => {
    const dates = reference.releases.map((release) => release.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it.each(others)("has the same versions, dates and number of changes in $locale", ({ releases }) => {
    const shape = (list: typeof releases) =>
      list.map(({ version, date, changes }) => ({
        version,
        date,
        counts: RELEASE_CATEGORIES.map((category) => changes[category].length),
      }));
    expect(shape(releases)).toEqual(shape(reference.releases));
  });
});
