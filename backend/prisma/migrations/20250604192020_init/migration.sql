-- CreateTable
CREATE TABLE "custom_model" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    CONSTRAINT "custom_model_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_model_user_id_name_provider_key" ON "custom_model"("user_id", "name", "provider");
