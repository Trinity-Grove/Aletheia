-- CreateTable
CREATE TABLE "curriculum_packs" (
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

    CONSTRAINT "curriculum_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_pack_items" (
    "id" UUID NOT NULL,
    "pack_id" UUID NOT NULL,
    "definition_type" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_pack_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_pack_dependencies" (
    "id" UUID NOT NULL,
    "pack_id" UUID NOT NULL,
    "depends_on_code" TEXT NOT NULL,
    "depends_on_version" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_pack_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "curriculum_packs_code_idx" ON "curriculum_packs"("code");

-- CreateIndex
CREATE INDEX "curriculum_packs_status_idx" ON "curriculum_packs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_packs_code_version_key" ON "curriculum_packs"("code", "version");

-- CreateIndex
CREATE INDEX "curriculum_pack_items_pack_id_idx" ON "curriculum_pack_items"("pack_id");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_pack_items_pack_id_definition_type_code_version_key" ON "curriculum_pack_items"("pack_id", "definition_type", "code", "version");

-- CreateIndex
CREATE INDEX "curriculum_pack_dependencies_pack_id_idx" ON "curriculum_pack_dependencies"("pack_id");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_pack_dependencies_pack_id_depends_on_code_depen_key" ON "curriculum_pack_dependencies"("pack_id", "depends_on_code", "depends_on_version");

-- AddForeignKey
ALTER TABLE "curriculum_pack_items" ADD CONSTRAINT "curriculum_pack_items_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "curriculum_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_pack_dependencies" ADD CONSTRAINT "curriculum_pack_dependencies_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "curriculum_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
