-- CreateTable
CREATE TABLE "Contest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "explanation" TEXT NOT NULL,
    "output1Id" INTEGER NOT NULL,
    "output2Id" INTEGER NOT NULL,
    "winningOutputId" INTEGER NOT NULL,
    CONSTRAINT "Contest_output1Id_fkey" FOREIGN KEY ("output1Id") REFERENCES "Output" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contest_output2Id_fkey" FOREIGN KEY ("output2Id") REFERENCES "Output" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contest_winningOutputId_fkey" FOREIGN KEY ("winningOutputId") REFERENCES "Output" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
