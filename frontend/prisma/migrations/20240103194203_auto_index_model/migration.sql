/*
  Warnings:

  - You are about to drop the column `display_index` on the `Model` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Model" DROP COLUMN "display_index",
ADD COLUMN     "index" SERIAL NOT NULL;
