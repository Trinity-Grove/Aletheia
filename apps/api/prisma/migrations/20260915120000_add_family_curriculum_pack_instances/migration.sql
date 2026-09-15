-- CreateTable
CREATE TABLE "family_curriculum_packs" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "source_pack_id" UUID NOT NULL,
    "source_pack_code" TEXT NOT NULL,
    "source_pack_version" INTEGER NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "document" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_curriculum_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_curriculum_pack_revisions" (
    "id" UUID NOT NULL,
    "family_curriculum_pack_id" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "document" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_curriculum_pack_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "family_curriculum_packs_family_id_idx" ON "family_curriculum_packs"("family_id");

-- CreateIndex
CREATE INDEX "family_curriculum_packs_source_pack_code_source_pack_version_idx" ON "family_curriculum_packs"("source_pack_code", "source_pack_version");

-- CreateIndex
CREATE UNIQUE INDEX "family_curriculum_packs_family_id_source_pack_id_key" ON "family_curriculum_packs"("family_id", "source_pack_id");

-- CreateIndex
CREATE INDEX "family_pack_revisions_pack_revision_idx" ON "family_curriculum_pack_revisions"("family_curriculum_pack_id", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "family_pack_revisions_pack_revision_key" ON "family_curriculum_pack_revisions"("family_curriculum_pack_id", "revision");

-- AddForeignKey
ALTER TABLE "family_curriculum_packs" ADD CONSTRAINT "family_curriculum_packs_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_curriculum_packs" ADD CONSTRAINT "family_curriculum_packs_source_pack_id_fkey" FOREIGN KEY ("source_pack_id") REFERENCES "curriculum_packs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_curriculum_pack_revisions" ADD CONSTRAINT "family_curriculum_pack_revisions_family_curriculum_pack_id_fkey" FOREIGN KEY ("family_curriculum_pack_id") REFERENCES "family_curriculum_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
