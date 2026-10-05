-- Written by hand: additive only (Prisma would rebuild Theme, which would cascade-delete
-- ideas and votes on Turso, see CLAUDE.md).
ALTER TABLE "Theme" ADD COLUMN "singleChoice" BOOLEAN NOT NULL DEFAULT false;
