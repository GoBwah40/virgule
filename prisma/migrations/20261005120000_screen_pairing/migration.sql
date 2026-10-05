-- Written by hand: additive only (see CLAUDE.md). Room screen pairing: a one-time code shown
-- on the host's phone, then the secret of the paired screen.
ALTER TABLE "Room" ADD COLUMN "screenCodeHash" TEXT;
ALTER TABLE "Room" ADD COLUMN "screenCodeExpiresAt" DATETIME;
ALTER TABLE "Room" ADD COLUMN "screenToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Room_screenCodeHash_key" ON "Room"("screenCodeHash");

-- CreateIndex
CREATE UNIQUE INDEX "Room_screenToken_key" ON "Room"("screenToken");
