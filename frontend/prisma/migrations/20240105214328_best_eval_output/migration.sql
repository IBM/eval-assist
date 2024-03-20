/*
  Warnings:

  - A unique constraint covering the columns `[bestOutputId]` on the table `ReviewExample` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bestEvalOutputId]` on the table `ReviewExample` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ReviewExample" ADD COLUMN     "bestEvalOutputId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "ReviewExample_bestOutputId_key" ON "ReviewExample"("bestOutputId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewExample_bestEvalOutputId_key" ON "ReviewExample"("bestEvalOutputId");

-- AddForeignKey
ALTER TABLE "ReviewExample" ADD CONSTRAINT "ReviewExample_bestEvalOutputId_fkey" FOREIGN KEY ("bestEvalOutputId") REFERENCES "Output"("id") ON DELETE SET NULL ON UPDATE CASCADE;
