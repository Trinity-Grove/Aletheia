-- CreateTable
CREATE TABLE "jurisdiction_definitions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "definition_statuses" NOT NULL DEFAULT 'DRAFT',
    "schema_version" TEXT NOT NULL DEFAULT '1.0.0',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ,
    "deprecated_at" TIMESTAMPTZ,

    CONSTRAINT "jurisdiction_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jurisdiction_definitions_code_idx" ON "jurisdiction_definitions"("code");

-- CreateIndex
CREATE INDEX "jurisdiction_definitions_status_idx" ON "jurisdiction_definitions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "jurisdiction_definitions_code_version_key" ON "jurisdiction_definitions"("code", "version");

-- AlterTable: additive, nullable FK -- every existing compliance_requirements
-- row keeps NULL here and keeps reading exactly as before (issue #26
-- strangler-fig requirement: old free-text jurisdiction path unaffected for
-- families not explicitly migrated).
ALTER TABLE "compliance_requirements" ADD COLUMN "jurisdiction_definition_id" UUID;

-- CreateIndex
CREATE INDEX "compliance_requirements_jurisdiction_definition_id_idx" ON "compliance_requirements"("jurisdiction_definition_id");

-- AddForeignKey
ALTER TABLE "compliance_requirements" ADD CONSTRAINT "compliance_requirements_jurisdiction_definition_id_fkey" FOREIGN KEY ("jurisdiction_definition_id") REFERENCES "jurisdiction_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
