/**
 * Applies Prisma migrations (prisma/migrations/<timestamp>_<name>/migration.sql)
 * to the production Turso database. Each migration is applied only once:
 * the history is kept in the `_virgule_migrations` table.
 *
 * Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... pnpm db:migrate:prod
 */
import "dotenv/config";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("TURSO_DATABASE_URL is missing.");
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
  console.log("✔ Database up to date, no migration to apply.");
  process.exit(0);
}

/**
 * Safeguard: a migration that rebuilds a table (DROP TABLE, or disabling foreign keys
 * as Prisma does for "RedefineTables") would delete data.
 * Inside a transaction, SQLite ignores `PRAGMA foreign_keys=OFF`: the DROP TABLE then
 * triggers the cascading deletes (votes, ideas…). We refuse before applying anything.
 */
const DANGEROUS = [/\bDROP\s+TABLE\b/i, /PRAGMA\s+foreign_keys\s*=\s*OFF/i];
for (const name of pending) {
  const sql = await readFile(path.join(migrationsDir, name, "migration.sql"), "utf8");
  if (DANGEROUS.some((re) => re.test(sql))) {
    console.error(
      `✘ ${name} rebuilds a table (DROP TABLE / foreign_keys=OFF): it would erase data in production.\n` +
        "  Rewrite it as an additive migration (ALTER TABLE … ADD COLUMN), see DEPLOYMENT.md.",
    );
    process.exit(1);
  }
}

for (const name of pending) {
  const sql = await readFile(path.join(migrationsDir, name, "migration.sql"), "utf8");
  console.log(`→ ${name}`);
  // The migration and its record are applied together or not at all.
  await client.executeMultiple(
    `BEGIN;\n${sql}\nINSERT INTO _virgule_migrations (name, applied_at) VALUES ('${name}', datetime('now'));\nCOMMIT;`,
  );
}

console.log(`✔ ${pending.length} migration(s) applied.`);
