import "dotenv/config";
import { defineConfig } from "prisma/config";

// Le CLI Prisma (migrate dev, studio) travaille toujours sur la base SQLite locale.
// La production (Turso) est migrée via `pnpm db:migrate:prod` (scripts/migrate-turso.mts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
});
