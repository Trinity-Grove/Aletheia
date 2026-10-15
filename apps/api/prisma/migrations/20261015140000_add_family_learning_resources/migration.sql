-- B09: family-owned community materials, lesson plans and chronograms.
CREATE TYPE "family_learning_resource_types" AS ENUM ('MATERIAL', 'LESSON_PLAN', 'CHRONOGRAM');

CREATE TABLE "family_learning_resources" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "resource_type" "family_learning_resource_types" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT,
    "age_min" INTEGER,
    "age_max" INTEGER,
    "content" JSONB NOT NULL,
    "visibility" "family_content_visibilities" NOT NULL DEFAULT 'PRIVATE',
    "origin_resource_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "family_learning_resources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "family_learning_resources_family_id_idx"
  ON "family_learning_resources"("family_id");
CREATE INDEX "family_learning_resources_visibility_resource_type_updated_at_idx"
  ON "family_learning_resources"("visibility", "resource_type", "updated_at");
CREATE INDEX "family_learning_resources_origin_resource_id_idx"
  ON "family_learning_resources"("origin_resource_id");

ALTER TABLE "family_learning_resources"
  ADD CONSTRAINT "family_learning_resources_family_id_fkey"
  FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "family_learning_resources"
  ADD CONSTRAINT "family_learning_resources_origin_resource_id_fkey"
  FOREIGN KEY ("origin_resource_id") REFERENCES "family_learning_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
