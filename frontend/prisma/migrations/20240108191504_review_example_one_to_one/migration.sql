/*
  Warnings:

  - A unique constraint covering the columns `[exampleId]` on the table `ReviewExample` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ReviewExample_exampleId_key" ON "ReviewExample"("exampleId");
