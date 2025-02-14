-- CreateTable
CREATE TABLE "stored_use_case" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "stored_use_case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_user" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_record" (
    "id" SERIAL NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "log_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stored_use_case_user_id_name_key" ON "stored_use_case"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");

-- AddForeignKey
ALTER TABLE "stored_use_case" ADD CONSTRAINT "stored_use_case_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
