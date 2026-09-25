-- CreateEnum
CREATE TYPE "CurriculumPackModerationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuthorTrustTier" AS ENUM ('NOVICE', 'VERIFIED', 'TRUSTED');

-- CreateEnum
CREATE TYPE "PackReportReason" AS ENUM ('SPAM_COMMERCIAL', 'HARMFUL_INAPPROPRIATE', 'COPYRIGHT_PLAGIARISM', 'MALFORMED_QUALITY', 'OTHER');

-- CreateEnum
CREATE TYPE "PackReportStatus" AS ENUM ('OPEN', 'UPHELD', 'DISMISSED');

-- AlterTable
ALTER TABLE "curriculum_packs" 
ADD COLUMN "author_user_id" UUID,
ADD COLUMN "moderation_status" "CurriculumPackModerationStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "moderation_notes" TEXT,
ADD COLUMN "moderated_at" TIMESTAMPTZ,
ADD COLUMN "moderated_by_user_id" UUID;

-- CreateTable
CREATE TABLE "author_trust_profiles" (
    "user_id" UUID NOT NULL,
    "trust_score" INTEGER NOT NULL DEFAULT 10,
    "tier" "AuthorTrustTier" NOT NULL DEFAULT 'NOVICE',
    "approved_packs_count" INTEGER NOT NULL DEFAULT 0,
    "rejected_packs_count" INTEGER NOT NULL DEFAULT 0,
    "upheld_reports_count" INTEGER NOT NULL DEFAULT 0,
    "last_evaluated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "author_trust_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "curriculum_pack_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pack_id" UUID NOT NULL,
    "reporter_user_id" UUID NOT NULL,
    "reporter_family_id" UUID NOT NULL,
    "reason" "PackReportReason" NOT NULL,
    "details" TEXT,
    "status" "PackReportStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,
    "resolved_by_user_id" UUID,

    CONSTRAINT "curriculum_pack_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "curriculum_packs_moderation_status_idx" ON "curriculum_packs"("moderation_status");
CREATE INDEX "curriculum_packs_author_user_id_idx" ON "curriculum_packs"("author_user_id");

-- CreateIndex
CREATE INDEX "author_trust_profiles_tier_idx" ON "author_trust_profiles"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_pack_reports_pack_family_unique" ON "curriculum_pack_reports"("pack_id", "reporter_family_id");
CREATE INDEX "curriculum_pack_reports_pack_id_status_idx" ON "curriculum_pack_reports"("pack_id", "status");
CREATE INDEX "curriculum_pack_reports_reporter_family_id_idx" ON "curriculum_pack_reports"("reporter_family_id");

-- AddForeignKey
ALTER TABLE "curriculum_packs" ADD CONSTRAINT "curriculum_packs_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "curriculum_packs" ADD CONSTRAINT "curriculum_packs_moderated_by_user_id_fkey" FOREIGN KEY ("moderated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author_trust_profiles" ADD CONSTRAINT "author_trust_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_pack_reports" ADD CONSTRAINT "curriculum_pack_reports_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "curriculum_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "curriculum_pack_reports" ADD CONSTRAINT "curriculum_pack_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "curriculum_pack_reports" ADD CONSTRAINT "curriculum_pack_reports_reporter_family_id_fkey" FOREIGN KEY ("reporter_family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "curriculum_pack_reports" ADD CONSTRAINT "curriculum_pack_reports_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
