/*
  Warnings:

  - A unique constraint covering the columns `[evaluationId]` on the table `Run` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Run_evaluationId_key" ON "Run"("evaluationId");
