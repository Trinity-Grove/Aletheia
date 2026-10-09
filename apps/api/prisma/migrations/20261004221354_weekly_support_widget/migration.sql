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



-- AddForeignKey
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
