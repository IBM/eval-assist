/*
  Warnings:

  - You are about to drop the column `model_id` on the `Model` table. All the data in the column will be lost.
  - Added the required column `name` to the `Model` table without a default value. This is not possible if the table is not empty.

  - sql statement adapted from https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations#example-rename-a-field
*/
-- AlterTable
ALTER TABLE "Model" 
RENAME COLUMN "model_id" TO "name";
