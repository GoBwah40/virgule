-- Additive only (see CLAUDE.md). Comments are off unless the host turns them on.
ALTER TABLE "Room" ADD COLUMN "allowComments" BOOLEAN NOT NULL DEFAULT false;
