/*
  Warnings:

  - You are about to drop the column `reviewId` on the `Example` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Example" DROP CONSTRAINT "Example_reviewId_fkey";

-- AlterTable
ALTER TABLE "Example" DROP COLUMN "reviewId";

-- CreateTable
CREATE TABLE "ReviewExample" (
    "id" SERIAL NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "exampleId" INTEGER NOT NULL,

    CONSTRAINT "ReviewExample_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReviewExample" ADD CONSTRAINT "ReviewExample_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewExample" ADD CONSTRAINT "ReviewExample_exampleId_fkey" FOREIGN KEY ("exampleId") REFERENCES "Example"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
