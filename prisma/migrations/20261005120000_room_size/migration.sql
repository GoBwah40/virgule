-- Written by hand: additive only (Prisma would rebuild Room, which would cascade-delete
-- everything on Turso, see CLAUDE.md). Null = default size for existing rooms.
ALTER TABLE "Room" ADD COLUMN "maxParticipants" INTEGER;
