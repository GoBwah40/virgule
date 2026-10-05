-- Written by hand: additive only (Prisma would rebuild Theme, which would cascade-delete
-- ideas and votes on Turso, see CLAUDE.md). Null = no limit.
ALTER TABLE "Theme" ADD COLUMN "maxVotes" INTEGER;
