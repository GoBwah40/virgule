-- Additive only (see CLAUDE.md).
ALTER TABLE "Room" ADD COLUMN "shareToken" TEXT;
CREATE UNIQUE INDEX "Room_shareToken_key" ON "Room"("shareToken");
