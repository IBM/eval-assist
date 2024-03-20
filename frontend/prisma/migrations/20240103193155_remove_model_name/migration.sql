/*
  Warnings:

  - You are about to drop the column `name` on the `Model` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Model_name_key";

-- AlterTable
ALTER TABLE "Model" DROP COLUMN "name";
