-- CreateTable
CREATE TABLE "bible_translation_definitions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "definition_statuses" NOT NULL DEFAULT 'DRAFT',
    "schema_version" TEXT NOT NULL DEFAULT '1.0.0',
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "you_version_id" TEXT NOT NULL,
    "translation_philosophy" TEXT,
    "publisher" TEXT,
    "licensing_notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ,
    "deprecated_at" TIMESTAMPTZ,

    CONSTRAINT "bible_translation_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bible_translation_definitions_code_idx" ON "bible_translation_definitions"("code");

-- CreateIndex
CREATE INDEX "bible_translation_definitions_status_idx" ON "bible_translation_definitions"("status");

-- CreateIndex
CREATE INDEX "bible_translation_definitions_you_version_id_idx" ON "bible_translation_definitions"("you_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "bible_translation_definitions_code_version_key" ON "bible_translation_definitions"("code", "version");
