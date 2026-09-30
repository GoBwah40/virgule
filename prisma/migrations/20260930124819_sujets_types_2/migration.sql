-- Écrite à la main : additive uniquement (Prisma aurait reconstruit Theme et Idea, ce qui
-- supprimerait en cascade idées et votes sur Turso). Les nouvelles valeurs de ThemeKind
-- (PLACE, CHOICE) ne demandent rien : SQLite stocke l'enum en texte.
ALTER TABLE "Theme" ADD COLUMN "options" TEXT;
ALTER TABLE "Theme" ADD COLUMN "allowOtherIdeas" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Idea" ADD COLUMN "isOption" BOOLEAN NOT NULL DEFAULT false;
