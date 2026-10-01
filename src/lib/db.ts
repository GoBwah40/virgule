import "server-only";

import { PrismaLibSql } from "@prisma/adapter-libsql";

import { PrismaClient } from "@/generated/prisma/client";

// Turso in production, local SQLite file otherwise — same libSQL adapter in both cases.
function createClient() {
  // `||` rather than `??`: .env.example declares these variables empty.
  const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
