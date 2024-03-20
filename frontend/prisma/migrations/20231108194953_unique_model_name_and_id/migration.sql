/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Model` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[model_id]` on the table `Model` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `model_id` to the `Model` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "model_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Model_name_key" ON "Model"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Model_model_id_key" ON "Model"("model_id");
