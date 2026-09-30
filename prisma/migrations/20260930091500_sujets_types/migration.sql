-- Sujets typés : colonnes ajoutées uniquement (aucune reconstruction de table).
-- Les données existantes restent intactes : les sujets actuels deviennent « TEXT ».

-- AlterTable
ALTER TABLE "Theme" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE "Idea" ADD COLUMN "dateStart" TEXT;
ALTER TABLE "Idea" ADD COLUMN "dateEnd" TEXT;
ALTER TABLE "Idea" ADD COLUMN "amountMin" INTEGER;
ALTER TABLE "Idea" ADD COLUMN "amountMax" INTEGER;
