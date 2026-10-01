import "server-only";

import { PrismaLibSql } from "@prisma/adapter-libsql";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Local SQLite file, switched to WAL mode on connection (the mode is stored in the file).
 *
 * In SQLite's default journal mode, a COMMIT fails with SQLITE_BUSY while another connection is
 * reading. The libSQL client then leaves that transaction open on a connection it no longer
 * tracks, holding its lock: from then on, every write fails (Prisma P1008, "SocketTimeout") until
 * the server restarts. In WAL mode, readers never block a COMMIT.
 * No busy timeout: SQLite's busy wait is synchronous, so it would freeze the event loop while the
 * lock holder, in the same process, cannot release it.
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

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
