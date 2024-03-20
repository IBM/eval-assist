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
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
