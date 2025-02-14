/*
  Warnings:

  - A unique constraint covering the columns `[user_id,name]` on the table `stored_use_case` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "stored_use_case_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "stored_use_case_user_id_name_key" ON "stored_use_case"("user_id", "name");
