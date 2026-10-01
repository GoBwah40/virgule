/**
 * Switches the end-to-end database (e2e.db, just migrated) to WAL mode, before the app starts.
 *
 * In SQLite's default journal mode, a COMMIT fails with SQLITE_BUSY while another connection is
 * reading. @libsql/client 0.18 then hands the connection back to its pool still inside the
 * transaction, holding its lock: from then on, every write fails (Prisma P1008, "SocketTimeout")
 * until the server restarts. With several sessions polling at once, the tests hit it at random.
 * In WAL mode, readers never block a COMMIT. The mode is stored in the file.
 */
import { createClient } from "@libsql/client";

const db = createClient({ url: "file:./e2e.db" });
const { rows } = await db.execute("PRAGMA journal_mode = WAL");
if (rows[0]?.journal_mode !== "wal") throw new Error(`e2e.db: WAL mode refused (${String(rows[0]?.journal_mode)})`);
db.close();
