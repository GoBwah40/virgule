-- Additive only (see CLAUDE.md). Rooms already past their first round have seen a recap;
-- those that reopened voting in round 1 cannot be told apart and keep the old behavior.
ALTER TABLE "Room" ADD COLUMN "recapSeen" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Room" SET "recapSeen" = true WHERE "round" > 1 OR "phase" IN ('RECAP', 'CLOSED');
