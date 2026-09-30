-- Écrite à la main : additive uniquement (Prisma aurait reconstruit la table Room,
-- ce qui supprimerait en cascade idées et votes sur Turso).
ALTER TABLE "Room" ADD COLUMN "ideasTimerMinutes" INTEGER;
ALTER TABLE "Room" ADD COLUMN "phaseEndsAt" DATETIME;
ALTER TABLE "Room" ADD COLUMN "tiebreak" BOOLEAN NOT NULL DEFAULT false;
