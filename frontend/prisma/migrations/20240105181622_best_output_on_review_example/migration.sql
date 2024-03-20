-- AlterTable
ALTER TABLE "ReviewExample" ADD COLUMN     "bestOutputId" INTEGER;

-- AddForeignKey
ALTER TABLE "ReviewExample" ADD CONSTRAINT "ReviewExample_bestOutputId_fkey" FOREIGN KEY ("bestOutputId") REFERENCES "Output"("id") ON DELETE SET NULL ON UPDATE CASCADE;
