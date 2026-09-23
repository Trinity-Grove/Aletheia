-- CreateTable
CREATE TABLE "definition_tags" (
    "id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "definition_id" UUID NOT NULL,
    "namespace" TEXT NOT NULL DEFAULT 'general',
    "tag" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "definition_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "definition_tags_entity_type_definition_id_idx" ON "definition_tags"("entity_type", "definition_id");

-- CreateIndex
CREATE INDEX "definition_tags_namespace_tag_idx" ON "definition_tags"("namespace", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "definition_tags_entity_type_definition_id_namespace_tag_key" ON "definition_tags"("entity_type", "definition_id", "namespace", "tag");
