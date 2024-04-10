-- CreateTable
CREATE TABLE "evaluation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datum" (
    "id" SERIAL NOT NULL,
    "context" JSONB NOT NULL,
    "evaluation_id" INTEGER NOT NULL,

    CONSTRAINT "datum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_output" (
    "id" SERIAL NOT NULL,
    "evaluation_id" INTEGER NOT NULL,
    "datum_id" INTEGER NOT NULL,
    "config" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "model_output_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "datum" ADD CONSTRAINT "datum_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_output" ADD CONSTRAINT "model_output_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_output" ADD CONSTRAINT "model_output_datum_id_fkey" FOREIGN KEY ("datum_id") REFERENCES "datum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
