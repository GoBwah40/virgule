-- Additive only (see CLAUDE.md).
ALTER TABLE "Room" ADD COLUMN "autoRecap" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Idea" ADD COLUMN "editedAt" DATETIME;
