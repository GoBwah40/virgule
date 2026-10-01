/**
 * Empties a Turso database: every session, with its participants, topics, ideas and votes.
 * The schema and the migration history are kept, so the app keeps working right away.
 *
 * Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... RESET_CONFIRM=yes pnpm db:reset:remote
 * In CI: the "Reset database" workflow (.github/workflows/reset-db.yml).
 */
import "dotenv/config";

import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("TURSO_DATABASE_URL is missing.");
  process.exit(1);
}
if (process.env.RESET_CONFIRM !== "yes") {
  console.error(`✘ This deletes every session on ${new URL(url).host}. Set RESET_CONFIRM=yes to go ahead.`);
  process.exit(1);
}

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

// Children first: does not depend on foreign keys being enforced.
const TABLES = ["Vote", "Idea", "Theme", "Participant", "Room"];

const before = await client.execute('SELECT COUNT(*) AS n FROM "Room"');
await client.batch(
  TABLES.map((table) => `DELETE FROM "${table}"`),
  "write",
);
console.log(`✔ ${new URL(url).host}: ${Number(before.rows[0].n)} session(s) deleted.`);
