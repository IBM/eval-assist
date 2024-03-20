-- RedefineTables
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "Contest_exampleId_fkey" FOREIGN KEY ("exampleId") REFERENCES "Example" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contest_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Contest" ("exampleId", "explanation", "id", "output1Id", "output2Id", "runId", "winningOutputId") SELECT "exampleId", "explanation", "id", "output1Id", "output2Id", "runId", "winningOutputId" FROM "Contest";
DROP TABLE "Contest";
ALTER TABLE "new_Contest" RENAME TO "Contest";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
