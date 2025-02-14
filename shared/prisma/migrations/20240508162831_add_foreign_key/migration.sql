/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `AppUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AppUser_email_key" ON "AppUser"("email");

-- AddForeignKey
ALTER TABLE "stored_use_case" ADD CONSTRAINT "stored_use_case_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
