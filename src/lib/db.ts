import "server-only";

import { PrismaLibSql } from "@prisma/adapter-libsql";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Local SQLite file, switched to WAL mode on connection (the mode is stored in the file).
 *
 * In SQLite's default journal mode, a COMMIT fails with SQLITE_BUSY while another connection is
 * reading. With @libsql/client 0.17, the transaction then stayed open on a connection the client
 * no longer tracked, holding its lock: every later write failed (Prisma P1008, "SocketTimeout")
 * until the server restarted. Since 0.18 (forced for the adapter in pnpm-workspace.yaml), a
 * connection that goes back to the pool mid-transaction is rolled back; WAL mode, where readers
 * never block a COMMIT, keeps that failure from happening at all.
 * No busy timeout: SQLite's busy wait is synchronous, so it would freeze the event loop while the
 * lock holder, in the same process, cannot release it. The single client below makes that case
 * impossible anyway (see `globalForPrisma`).
 */
class LocalLibSql extends PrismaLibSql {
  async connect() {
    const adapter = await super.connect();
    const { rows } = await adapter.queryRaw({ sql: "PRAGMA journal_mode = WAL", args: [], argTypes: [] });
    // Refused while another process holds the file open (Prisma Studio…): retried on next start.
    if (rows[0]?.[0] !== "wal") console.warn(`SQLite: WAL mode refused (${String(rows[0]?.[0])})`);
    return adapter;
  }
}

// Turso in production, local SQLite file otherwise — same libSQL adapter in both cases.
function createClient() {
  // `||` rather than `??`: .env.example declares these variables empty.
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db";
  const config = { url, authToken: process.env.TURSO_AUTH_TOKEN || undefined };
  const adapter = url.startsWith("file:") ? new LocalLibSql(config) : new PrismaLibSql(config);
  return new PrismaClient({ adapter });
}

/**
 * One client per process, in production too. A production build evaluates this module once per
 * route (a dozen times in one server), and each client has its own connections and its own
 * queue: an interactive transaction in one held the write lock while the others' writes failed
 * at once with SQLITE_BUSY. The adapter queues every query of a client behind its open
 * transaction, so a single client never contends with itself.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = (globalForPrisma.prisma ??= createClient());
