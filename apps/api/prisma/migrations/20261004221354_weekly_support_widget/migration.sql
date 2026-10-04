-- CreateEnum
CREATE TYPE "feedback_categories" AS ENUM ('BUG', 'IDEA', 'QUESTION', 'PRAISE');

-- CreateEnum
CREATE TYPE "feedback_statuses" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "notification_types" ADD VALUE 'FEEDBACK_APPROVED';
ALTER TYPE "notification_types" ADD VALUE 'FEEDBACK_REJECTED';

-- AlterEnum
ALTER TYPE "sensitive_data_resource_types" ADD VALUE 'FEEDBACK_SUBMISSION';

-- AlterTable
ALTER TABLE "ai_family_usages" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ai_suggestions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "curriculum_pack_reports" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "family_curriculum_packs" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "family_settings" ADD COLUMN     "support_widget_last_seen_at" TIMESTAMPTZ,
ADD COLUMN     "support_widget_snoozed_until" TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "feedback_submissions" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "submitted_by_user_id" UUID NOT NULL,
    "category" "feedback_categories" NOT NULL,
    "message" TEXT NOT NULL,
    "page_path" TEXT,
    "locale" TEXT,
    "app_version" TEXT,
    "user_agent" TEXT,
    "identify_self" BOOLEAN NOT NULL DEFAULT false,
    "submitter_name" TEXT,
    "submitter_email" TEXT,
    "status" "feedback_statuses" NOT NULL DEFAULT 'PENDING',
    "admin_note" TEXT,
    "last_issue_error" TEXT,
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "github_issue_number" INTEGER,
    "github_issue_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "feedback_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_submissions_status_created_at_idx" ON "feedback_submissions"("status", "created_at");

-- CreateIndex
CREATE INDEX "feedback_submissions_family_id_created_at_idx" ON "feedback_submissions"("family_id", "created_at");

-- RenameForeignKey
ALTER TABLE "curriculum_definition_activities" RENAME CONSTRAINT "curriculum_definition_activities_curriculum_definition_i_fkey" TO "curriculum_definition_activities_curriculum_definition_id_fkey";

-- RenameForeignKey
ALTER TABLE "curriculum_definition_competencies" RENAME CONSTRAINT "curriculum_definition_competencies_curriculum_definition_fkey" TO "curriculum_definition_competencies_curriculum_definition_i_fkey";

-- AddForeignKey
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "activity_definition_competencies_activity_id_competency_i_key" RENAME TO "activity_definition_competencies_activity_id_competency_id_key";

-- RenameIndex
ALTER INDEX "activity_definition_evidence_types_activity_id_evidence_t_key" RENAME TO "activity_definition_evidence_types_activity_id_evidence_typ_key";

-- RenameIndex
ALTER INDEX "compliance_manual_overrides_family_id_academic_year_id_lea_idx" RENAME TO "compliance_manual_overrides_family_id_academic_year_id_lear_idx";

-- RenameIndex
ALTER INDEX "consent_records_family_id_learner_id_consent_definition_id_crea" RENAME TO "consent_records_family_id_learner_id_consent_definition_id__idx";

-- RenameIndex
ALTER INDEX "curriculum_definition_activities_curriculum_definition_id_key" RENAME TO "curriculum_definition_activities_curriculum_definition_id_a_key";

-- RenameIndex
ALTER INDEX "curriculum_definition_competencies_curriculum_definition__idx1" RENAME TO "curriculum_definition_competencies_curriculum_definition_id_idx";

-- RenameIndex
ALTER INDEX "curriculum_definition_competencies_curriculum_definition__key" RENAME TO "curriculum_definition_competencies_curriculum_definition_id_key";

-- RenameIndex
ALTER INDEX "curriculum_definition_domains_curriculum_definition_id_do_key" RENAME TO "curriculum_definition_domains_curriculum_definition_id_doma_key";

-- RenameIndex
ALTER INDEX "curriculum_definition_rubrics_curriculum_definition_id_ru_key" RENAME TO "curriculum_definition_rubrics_curriculum_definition_id_rubr_key";

-- RenameIndex
ALTER INDEX "curriculum_pack_dependencies_pack_id_depends_on_code_depen_key" RENAME TO "curriculum_pack_dependencies_pack_id_depends_on_code_depend_key";

-- RenameIndex
ALTER INDEX "curriculum_pack_reports_pack_family_unique" RENAME TO "curriculum_pack_reports_pack_id_reporter_family_id_key";

-- RenameIndex
ALTER INDEX "family_pack_media_pack_created_idx" RENAME TO "family_curriculum_pack_media_family_curriculum_pack_id_crea_idx";

-- RenameIndex
ALTER INDEX "family_pack_revisions_pack_revision_idx" RENAME TO "family_curriculum_pack_revisions_family_curriculum_pack_id__idx";

-- RenameIndex
ALTER INDEX "family_pack_revisions_pack_revision_key" RENAME TO "family_curriculum_pack_revisions_family_curriculum_pack_id__key";

-- RenameIndex
ALTER INDEX "family_curriculum_packs_source_pack_code_source_pack_version_id" RENAME TO "family_curriculum_packs_source_pack_code_source_pack_versio_idx";

-- RenameIndex
ALTER INDEX "learner_competency_tracking_learner_id_competency_definiti_key" RENAME TO "learner_competency_tracking_learner_id_competency_definitio_key";
