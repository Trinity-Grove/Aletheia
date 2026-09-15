-- CreateEnum
CREATE TYPE "definition_version_operation_types" AS ENUM ('MIGRATE_REFERENCES', 'ROLLBACK');

-- CreateTable
CREATE TABLE "definition_version_operation_logs" (
    "id" UUID NOT NULL,
    "operation_type" "definition_version_operation_types" NOT NULL,
    "definition_code" TEXT NOT NULL,
    "from_version" INTEGER NOT NULL,
    "to_version" INTEGER,
    "affected_entity_type" TEXT,
    "affected_entity_ids" JSONB NOT NULL DEFAULT '[]',
    "performed_by_user_id" UUID NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "definition_version_operation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "definition_version_operation_logs_definition_code_idx" ON "definition_version_operation_logs"("definition_code");

-- CreateIndex
CREATE INDEX "definition_version_operation_logs_operation_type_idx" ON "definition_version_operation_logs"("operation_type");

-- AddForeignKey
ALTER TABLE "definition_version_operation_logs" ADD CONSTRAINT "definition_version_operation_logs_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
