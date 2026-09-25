-- CreateEnum
CREATE TYPE "sensitive_data_actions" AS ENUM ('READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT');

-- CreateEnum
CREATE TYPE "sensitive_data_resource_types" AS ENUM ('LEARNER', 'PORTFOLIO_ITEM', 'EVIDENCE_SUBMISSION', 'OFFICIAL_REPORT', 'DATA_EXPORT_PACKAGE');

-- CreateTable
CREATE TABLE "sensitive_data_access_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID,
    "action" "sensitive_data_actions" NOT NULL,
    "resource_type" "sensitive_data_resource_types" NOT NULL,
    "resource_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensitive_data_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sensitive_data_access_logs_family_id_created_at_idx" ON "sensitive_data_access_logs"("family_id", "created_at");

-- CreateIndex
CREATE INDEX "sensitive_data_access_logs_actor_user_id_created_at_idx" ON "sensitive_data_access_logs"("actor_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "sensitive_data_access_logs" ADD CONSTRAINT "sensitive_data_access_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensitive_data_access_logs" ADD CONSTRAINT "sensitive_data_access_logs_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
