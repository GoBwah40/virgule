/**
 * Applique les migrations Prisma (prisma/migrations/<horodatage>_<nom>/migration.sql)
 * sur la base Turso de production. Chaque migration n'est appliquée qu'une fois :
 * l'historique est conservé dans la table `_virgule_migrations`.
 *
 * Usage : TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... pnpm db:migrate:prod
 */
import "dotenv/config";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("TURSO_DATABASE_URL manquant.");
  process.exit(1);
}

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const migrationsDir = path.join(process.cwd(), "prisma", "migrations");

await client.execute(
  "CREATE TABLE IF NOT EXISTS _virgule_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
);
const applied = new Set(
  (await client.execute("SELECT name FROM _virgule_migrations")).rows.map((r) => String(r.name)),
);

const entries = await readdir(migrationsDir, { withFileTypes: true });
const pending = entries
  .filter((e) => e.isDirectory() && !applied.has(e.name))
  .map((e) => e.name)
  .sort();

if (pending.length === 0) {
  console.log("✔ Base à jour, aucune migration à appliquer.");
  process.exit(0);
}

for (const name of pending) {
  const sql = await readFile(path.join(migrationsDir, name, "migration.sql"), "utf8");
  console.log(`→ ${name}`);
  // La migration et son enregistrement sont appliqués ensemble ou pas du tout.
  await client.executeMultiple(
    `BEGIN;\n${sql}\nINSERT INTO _virgule_migrations (name, applied_at) VALUES ('${name}', datetime('now'));\nCOMMIT;`,
  );
}

console.log(`✔ ${pending.length} migration(s) appliquée(s).`);
