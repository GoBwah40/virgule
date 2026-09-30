import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { cache } from "react";

import type { Locale } from "@/i18n/config";
import { parseReleaseNotes, RELEASE_CATEGORIES, releaseNoteFile, type ReleaseCategory } from "@/lib/release-notes";

import packageJson from "../../package.json";

/** App version, kept in `package.json` (see VERSIONS.md). */
export const APP_VERSION = packageJson.version;

/** Reads and merges `release-notes/<locale>/` (bundled into the deployment by `next.config.ts`). */
export const getReleaseNotes = cache(async (locale: Locale) => {
  const dir = path.join(process.cwd(), "release-notes", locale);
  const entries = await Promise.all(
    RELEASE_CATEGORIES.map(
      async (category) => [category, await readFile(path.join(dir, releaseNoteFile(category)), "utf8")] as const,
    ),
  );
  return parseReleaseNotes(Object.fromEntries(entries) as Record<ReleaseCategory, string>);
});
