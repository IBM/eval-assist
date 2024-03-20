/*
  Warnings:

  - You are about to drop the column `datasetId` on the `Example` table. All the data in the column will be lost.
  - Added the required column `runId` to the `Example` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Example" DROP CONSTRAINT "Example_datasetId_fkey";

-- AlterTable
ALTER TABLE "Example" DROP COLUMN "datasetId",
ADD COLUMN     "runId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Datum" (
    "id" SERIAL NOT NULL,
    "data" JSONB NOT NULL,
    "datasetId" INTEGER NOT NULL,

    CONSTRAINT "Datum_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Datum_data_key" ON "Datum"("data");

-- AddForeignKey
ALTER TABLE "Datum" ADD CONSTRAINT "Datum_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Example" ADD CONSTRAINT "Example_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
