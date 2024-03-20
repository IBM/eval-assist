/*
  Warnings:

  - Added the required column `display_index` to the `Model` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "display_index" INTEGER NOT NULL;
