-- CreateTable
CREATE TABLE "Model" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "examples" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "InputVariable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "datasetId" INTEGER NOT NULL,
    CONSTRAINT "InputVariable_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EvaluationToModel" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_EvaluationToModel_A_fkey" FOREIGN KEY ("A") REFERENCES "Evaluation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EvaluationToModel_B_fkey" FOREIGN KEY ("B") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Evaluation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "content" TEXT,
    "datasetId" INTEGER,
    "prompt" TEXT,
    "evaluator" TEXT,
    "criteria" TEXT,
    CONSTRAINT "Evaluation_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Evaluation" ("content", "id", "name") SELECT "content", "id", "name" FROM "Evaluation";
DROP TABLE "Evaluation";
ALTER TABLE "new_Evaluation" RENAME TO "Evaluation";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "_EvaluationToModel_AB_unique" ON "_EvaluationToModel"("A", "B");

-- CreateIndex
CREATE INDEX "_EvaluationToModel_B_index" ON "_EvaluationToModel"("B");
