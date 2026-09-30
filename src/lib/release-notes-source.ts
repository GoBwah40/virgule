import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { cache } from "react";

import { parseReleaseNotes, RELEASE_CATEGORIES, RELEASE_NOTE_FILES, type ReleaseCategory } from "@/lib/release-notes";

import packageJson from "../../package.json";

/** Version de l'app, tenue dans `package.json` (voir VERSIONS.md). */
export const APP_VERSION = packageJson.version;

/** Lit et fusionne les fichiers de `release-notes/` (inclus au déploiement par `next.config.ts`). */
export const getReleaseNotes = cache(async () => {
  const dir = path.join(process.cwd(), "release-notes");
  const entries = await Promise.all(
    RELEASE_CATEGORIES.map(
      async (category) => [category, await readFile(path.join(dir, RELEASE_NOTE_FILES[category]), "utf8")] as const,
    ),
  );
  return parseReleaseNotes(Object.fromEntries(entries) as Record<ReleaseCategory, string>);
});
