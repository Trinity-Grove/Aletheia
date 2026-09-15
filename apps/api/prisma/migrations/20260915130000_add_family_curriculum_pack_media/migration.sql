-- CreateEnum
CREATE TYPE "family_curriculum_pack_media_types" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "family_curriculum_pack_media_source_types" AS ENUM ('UPLOAD', 'EXTERNAL_URL');

-- CreateTable
CREATE TABLE "family_curriculum_pack_media" (
    "id" UUID NOT NULL,
    "family_curriculum_pack_id" UUID NOT NULL,
    "media_type" "family_curriculum_pack_media_types" NOT NULL,
    "source_type" "family_curriculum_pack_media_source_types" NOT NULL,
    "provider" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "storage_key" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "family_curriculum_pack_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "family_pack_media_pack_created_idx" ON "family_curriculum_pack_media"("family_curriculum_pack_id", "created_at");

-- AddForeignKey
ALTER TABLE "family_curriculum_pack_media" ADD CONSTRAINT "family_curriculum_pack_media_family_curriculum_pack_id_fkey" FOREIGN KEY ("family_curriculum_pack_id") REFERENCES "family_curriculum_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
