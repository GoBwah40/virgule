import "dotenv/config";
import { defineConfig } from "prisma/config";

// The Prisma CLI (migrate dev, studio) always works on the local SQLite database.
// Production (Turso) is migrated with `pnpm db:migrate:prod` (scripts/migrate-turso.mts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
});
