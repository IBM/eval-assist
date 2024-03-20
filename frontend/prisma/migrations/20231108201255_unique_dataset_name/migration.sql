/*
  Warnings:

  - You are about to drop the column `examples` on the `Dataset` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Dataset` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `num_examples` to the `Dataset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Dataset" DROP COLUMN "examples",
ADD COLUMN     "num_examples" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Dataset_name_key" ON "Dataset"("name");
