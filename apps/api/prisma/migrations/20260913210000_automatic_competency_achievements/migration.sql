-- AlterTable
ALTER TABLE "learner_competency_tracking" ADD COLUMN     "policy_version" INTEGER,
ADD COLUMN     "progression_policy_id" UUID;

ALTER TABLE "learner_competency_tracking" ADD CONSTRAINT "tracking_policy_snapshot_pair"
CHECK (("progression_policy_id" IS NULL AND "policy_version" IS NULL) OR
       ("progression_policy_id" IS NOT NULL AND "policy_version" IS NOT NULL AND "policy_version" > 0));

-- CreateTable
CREATE TABLE "learner_competency_achievements" (
    "id" UUID NOT NULL,
    "tracking_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "competency_definition_id" UUID NOT NULL,
    "competency_version" INTEGER NOT NULL,
    "curriculum_definition_id" UUID,
    "curriculum_version" INTEGER,
    "progression_policy_id" UUID NOT NULL,
    "policy_version" INTEGER NOT NULL,
    "validated_evidence_count" INTEGER NOT NULL,
    "minimum_evidence_count" INTEGER NOT NULL,
    "evidence_snapshot" JSONB NOT NULL,
    "awarded_by_user_id" UUID NOT NULL,
    "achieved_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learner_competency_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_competency_achievement_reviews" (
    "id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "evidence_submission_id" UUID NOT NULL,
    "reviewed_by_user_id" UUID NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'EVIDENCE_REJECTED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learner_competency_achievement_reviews_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "learner_competency_achievements" ADD CONSTRAINT "achievement_valid_snapshot"
CHECK ("competency_version" > 0 AND "policy_version" > 0 AND "minimum_evidence_count" > 0
       AND "validated_evidence_count" >= "minimum_evidence_count"
       AND (("curriculum_definition_id" IS NULL AND "curriculum_version" IS NULL) OR
            ("curriculum_definition_id" IS NOT NULL AND "curriculum_version" IS NOT NULL AND "curriculum_version" > 0)));

ALTER TABLE "learner_competency_achievement_reviews" ADD CONSTRAINT "achievement_review_reason"
CHECK ("reason" = 'EVIDENCE_REJECTED');

-- CreateIndex
CREATE UNIQUE INDEX "learner_competency_achievements_tracking_id_key" ON "learner_competency_achievements"("tracking_id");

-- CreateIndex
CREATE INDEX "learner_competency_achievements_family_id_learner_id_idx" ON "learner_competency_achievements"("family_id", "learner_id");

-- CreateIndex
CREATE INDEX "learner_competency_achievement_reviews_family_id_learner_id_idx" ON "learner_competency_achievement_reviews"("family_id", "learner_id");

-- CreateIndex
CREATE UNIQUE INDEX "learner_competency_achievement_reviews_achievement_id_evide_key" ON "learner_competency_achievement_reviews"("achievement_id", "evidence_submission_id");



-- AddForeignKey
ALTER TABLE "learner_competency_tracking" ADD CONSTRAINT "learner_competency_tracking_progression_policy_id_fkey" FOREIGN KEY ("progression_policy_id") REFERENCES "progression_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_competency_achievements" ADD CONSTRAINT "learner_competency_achievements_tracking_id_fkey" FOREIGN KEY ("tracking_id") REFERENCES "learner_competency_tracking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_competency_achievements" ADD CONSTRAINT "learner_competency_achievements_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_competency_achievements" ADD CONSTRAINT "learner_competency_achievements_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_competency_achievements" ADD CONSTRAINT "learner_competency_achievements_competency_definition_id_fkey" FOREIGN KEY ("competency_definition_id") REFERENCES "competency_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_competency_achievements" ADD CONSTRAINT "learner_competency_achievements_curriculum_definition_id_fkey" FOREIGN KEY ("curriculum_definition_id") REFERENCES "curriculum_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_competency_achievements" ADD CONSTRAINT "learner_competency_achievements_progression_policy_id_fkey" FOREIGN KEY ("progression_policy_id") REFERENCES "progression_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_competency_achievements" ADD CONSTRAINT "learner_competency_achievements_awarded_by_user_id_fkey" FOREIGN KEY ("awarded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_competency_achievement_reviews" ADD CONSTRAINT "learner_competency_achievement_reviews_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "learner_competency_achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_competency_achievement_reviews" ADD CONSTRAINT "learner_competency_achievement_reviews_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_competency_achievement_reviews" ADD CONSTRAINT "learner_competency_achievement_reviews_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_competency_achievement_reviews" ADD CONSTRAINT "learner_competency_achievement_reviews_evidence_submission_fkey" FOREIGN KEY ("evidence_submission_id") REFERENCES "evidence_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_competency_achievement_reviews" ADD CONSTRAINT "learner_competency_achievement_reviews_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;








