-- CreateEnum
CREATE TYPE "consent_scopes" AS ENUM ('FAMILY', 'LEARNER');

-- CreateEnum
CREATE TYPE "consent_actions" AS ENUM ('GRANTED', 'REVOKED');

-- CreateTable
CREATE TABLE "consent_definitions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "definition_statuses" NOT NULL DEFAULT 'DRAFT',
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "scope" "consent_scopes" NOT NULL DEFAULT 'FAMILY',
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "purposes" TEXT[],
    "metadata" JSONB,
    "published_at" TIMESTAMPTZ,
    "deprecated_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "consent_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID,
    "consent_definition_id" UUID NOT NULL,
    "action" "consent_actions" NOT NULL DEFAULT 'GRANTED',
    "consented_by_user_id" UUID NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consent_definitions_code_version_key" ON "consent_definitions"("code", "version");

-- CreateIndex
CREATE INDEX "consent_definitions_status_code_idx" ON "consent_definitions"("status", "code");

-- CreateIndex
CREATE INDEX "consent_records_family_id_learner_id_consent_definition_id_crea_idx" ON "consent_records"("family_id", "learner_id", "consent_definition_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "consent_records_consented_by_user_id_created_at_idx" ON "consent_records"("consented_by_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_consent_definition_id_fkey" FOREIGN KEY ("consent_definition_id") REFERENCES "consent_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_consented_by_user_id_fkey" FOREIGN KEY ("consented_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
