ALTER TABLE "curriculum_packs"
  ADD COLUMN "composition_revision" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "curriculum_pack_items"
  ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

WITH ranked_items AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "pack_id" ORDER BY "created_at", "id") - 1 AS "rank"
  FROM "curriculum_pack_items"
)
UPDATE "curriculum_pack_items" AS items
SET "position" = ranked_items."rank"
FROM ranked_items
WHERE items."id" = ranked_items."id";

CREATE TABLE "curriculum_pack_composition_revisions" (
  "id" UUID NOT NULL,
  "pack_id" UUID NOT NULL,
  "revision" INTEGER NOT NULL,
  "items" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "curriculum_pack_composition_revisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "curriculum_pack_composition_revisions_pack_revision_key"
  ON "curriculum_pack_composition_revisions"("pack_id", "revision");
CREATE INDEX "curriculum_pack_composition_revisions_pack_revision_idx"
  ON "curriculum_pack_composition_revisions"("pack_id", "revision");

ALTER TABLE "curriculum_pack_composition_revisions"
  ADD CONSTRAINT "curriculum_pack_composition_revisions_pack_id_fkey"
  FOREIGN KEY ("pack_id") REFERENCES "curriculum_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
