-- CreateTable
CREATE TABLE "log_record" (
    "id" SERIAL NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "log_record_pkey" PRIMARY KEY ("id")
);
