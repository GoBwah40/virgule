-- Written by hand: additive only (Prisma would rebuild Theme and Vote, which would
-- cascade-delete ideas and votes on Turso, see CLAUDE.md).
-- Theme: points budget per participant (null = for / against votes).
ALTER TABLE "Theme" ADD COLUMN "pointsBudget" INTEGER;
-- Vote: points given to an idea in a points topic (null = for / against vote).
ALTER TABLE "Vote" ADD COLUMN "points" INTEGER;
