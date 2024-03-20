-- AlterTable
ALTER TABLE "ReviewExample" ADD COLUMN     "complete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "index" SERIAL NOT NULL;
