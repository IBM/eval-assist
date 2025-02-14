-- CreateTable
CREATE TABLE "stored_use_case" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "stored_use_case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppUser" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stored_use_case_name_key" ON "stored_use_case"("name");
