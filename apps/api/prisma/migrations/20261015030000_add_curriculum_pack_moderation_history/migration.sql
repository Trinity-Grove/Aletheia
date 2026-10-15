-- CreateEnum
CREATE TYPE "CurriculumPackModerationHistoryEvent" AS ENUM ('CREATED', 'EDITED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'SUSPENDED', 'RESTORED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "curriculum_pack_moderation_history" (
    "id" UUID NOT NULL,
    "pack_id" UUID NOT NULL,
    "event" "CurriculumPackModerationHistoryEvent" NOT NULL,
    "moderation_status" "CurriculumPackModerationStatus" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_pack_moderation_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "curriculum_pack_moderation_history_pack_id_created_at_idx" ON "curriculum_pack_moderation_history"("pack_id", "created_at");

-- Preserve a useful starting point for packs that already existed before the
-- append-only history was introduced.
INSERT INTO "curriculum_pack_moderation_history" ("id", "pack_id", "event", "moderation_status", "notes", "created_at")
SELECT
    gen_random_uuid(),
    "id",
    CASE "moderation_status"
      WHEN 'DRAFT' THEN 'CREATED'::"CurriculumPackModerationHistoryEvent"
      WHEN 'PENDING_REVIEW' THEN 'SUBMITTED'::"CurriculumPackModerationHistoryEvent"
      WHEN 'APPROVED' THEN 'APPROVED'::"CurriculumPackModerationHistoryEvent"
      WHEN 'REJECTED' THEN 'REJECTED'::"CurriculumPackModerationHistoryEvent"
      WHEN 'SUSPENDED' THEN 'SUSPENDED'::"CurriculumPackModerationHistoryEvent"
    END,
    "moderation_status",
    "moderation_notes",
    COALESCE("moderated_at", "created_at")
FROM "curriculum_packs";

-- AddForeignKey
ALTER TABLE "curriculum_pack_moderation_history" ADD CONSTRAINT "curriculum_pack_moderation_history_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "curriculum_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
