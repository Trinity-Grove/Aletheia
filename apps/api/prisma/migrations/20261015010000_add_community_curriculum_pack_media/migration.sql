CREATE TYPE "curriculum_pack_media_types" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

CREATE TYPE "curriculum_pack_media_source_types" AS ENUM ('UPLOAD', 'EXTERNAL_URL');

ALTER TABLE "curriculum_packs"
ADD COLUMN "origin_family_curriculum_pack_id" UUID;

CREATE UNIQUE INDEX "curriculum_packs_origin_family_curriculum_pack_id_key"
ON "curriculum_packs"("origin_family_curriculum_pack_id");

CREATE INDEX "curriculum_packs_origin_family_curriculum_pack_id_idx"
ON "curriculum_packs"("origin_family_curriculum_pack_id");

ALTER TABLE "curriculum_packs"
ADD CONSTRAINT "curriculum_packs_origin_family_curriculum_pack_id_fkey"
FOREIGN KEY ("origin_family_curriculum_pack_id")
REFERENCES "family_curriculum_packs"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "curriculum_pack_media" (
  "id" UUID NOT NULL,
  "curriculum_pack_id" UUID NOT NULL,
  "source_family_media_id" UUID,
  "media_type" "curriculum_pack_media_types" NOT NULL,
  "source_type" "curriculum_pack_media_source_types" NOT NULL,
  "provider" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "url" TEXT,
  "storage_key" TEXT,
  "mime_type" TEXT,
  "size_bytes" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "curriculum_pack_media_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "curriculum_pack_media_pack_source_unique"
ON "curriculum_pack_media"("curriculum_pack_id", "source_family_media_id");

CREATE INDEX "curriculum_pack_media_curriculum_pack_id_created_at_idx"
ON "curriculum_pack_media"("curriculum_pack_id", "created_at");

ALTER TABLE "curriculum_pack_media"
ADD CONSTRAINT "curriculum_pack_media_curriculum_pack_id_fkey"
FOREIGN KEY ("curriculum_pack_id")
REFERENCES "curriculum_packs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "curriculum_pack_media"
ADD CONSTRAINT "curriculum_pack_media_source_family_media_id_fkey"
FOREIGN KEY ("source_family_media_id")
REFERENCES "family_curriculum_pack_media"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
