/*
  Warnings:

  - You are about to drop the `_EvaluationToModel` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `evaluationId` to the `Model` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_EvaluationToModel" DROP CONSTRAINT "_EvaluationToModel_A_fkey";

-- DropForeignKey
ALTER TABLE "_EvaluationToModel" DROP CONSTRAINT "_EvaluationToModel_B_fkey";

-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "evaluationId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_EvaluationToModel";

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
