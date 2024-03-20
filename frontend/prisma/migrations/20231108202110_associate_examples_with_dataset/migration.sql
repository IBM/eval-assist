/*
  Warnings:

  - You are about to drop the column `runId` on the `Example` table. All the data in the column will be lost.
  - Added the required column `datasetId` to the `Example` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Example" DROP CONSTRAINT "Example_runId_fkey";

-- AlterTable
ALTER TABLE "Example" DROP COLUMN "runId",
ADD COLUMN     "datasetId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Example" ADD CONSTRAINT "Example_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
