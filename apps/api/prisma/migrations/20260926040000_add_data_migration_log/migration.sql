-- CreateTable
CREATE TABLE "data_migration_log" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "executed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "data_migration_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_migration_log_code_key" ON "data_migration_log"("code");
