-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Output" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "modelId" INTEGER NOT NULL,
    "exampleId" INTEGER NOT NULL,
    CONSTRAINT "Output_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Output_exampleId_fkey" FOREIGN KEY ("exampleId") REFERENCES "Example" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Output" ("exampleId", "id", "modelId", "text") SELECT "exampleId", "id", "modelId", "text" FROM "Output";
DROP TABLE "Output";
ALTER TABLE "new_Output" RENAME TO "Output";
CREATE TABLE "new_Contest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "explanation" TEXT NOT NULL,
    "output1Id" INTEGER NOT NULL,
    "output2Id" INTEGER NOT NULL,
    "winningOutputId" INTEGER NOT NULL,
    "exampleId" INTEGER NOT NULL,
    "runId" INTEGER NOT NULL,
    CONSTRAINT "Contest_output1Id_fkey" FOREIGN KEY ("output1Id") REFERENCES "Output" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contest_output2Id_fkey" FOREIGN KEY ("output2Id") REFERENCES "Output" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contest_winningOutputId_fkey" FOREIGN KEY ("winningOutputId") REFERENCES "Output" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contest_exampleId_fkey" FOREIGN KEY ("exampleId") REFERENCES "Example" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contest_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Contest" ("exampleId", "explanation", "id", "output1Id", "output2Id", "runId", "winningOutputId") SELECT "exampleId", "explanation", "id", "output1Id", "output2Id", "runId", "winningOutputId" FROM "Contest";
DROP TABLE "Contest";
ALTER TABLE "new_Contest" RENAME TO "Contest";
CREATE TABLE "new_Run" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "evaluationId" INTEGER NOT NULL,
    CONSTRAINT "Run_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Run" ("evaluationId", "id", "name", "progress", "state") SELECT "evaluationId", "id", "name", "progress", "state" FROM "Run";
DROP TABLE "Run";
ALTER TABLE "new_Run" RENAME TO "Run";
CREATE UNIQUE INDEX "Run_evaluationId_key" ON "Run"("evaluationId");
CREATE TABLE "new_Example" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prompt" TEXT NOT NULL,
    "runId" INTEGER NOT NULL,
    CONSTRAINT "Example_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Example" ("id", "prompt", "runId") SELECT "id", "prompt", "runId" FROM "Example";
DROP TABLE "Example";
ALTER TABLE "new_Example" RENAME TO "Example";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
