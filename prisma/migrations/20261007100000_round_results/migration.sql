-- Additive only (see CLAUDE.md): a new table, nothing rebuilt.
CREATE TABLE "RoundResult" (
    "ideaId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "qualified" BOOLEAN NOT NULL,

    PRIMARY KEY ("ideaId", "round"),
    CONSTRAINT "RoundResult_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
