-- CreateEnum
CREATE TYPE "ai_suggestion_statuses" AS ENUM ('PENDING_REVIEW', 'ACCEPTED', 'MODIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ai_feature_types" AS ENUM ('LESSON_PLAN_DRAFT', 'ACTIVITY_ADAPTATION');

-- CreateTable
CREATE TABLE "ai_suggestions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "learner_id" UUID,
    "actor_user_id" UUID NOT NULL,
    "feature_type" "ai_feature_types" NOT NULL,
    "status" "ai_suggestion_statuses" NOT NULL DEFAULT 'PENDING_REVIEW',
    "sanitized_prompt" TEXT NOT NULL,
    "raw_model_output" JSONB NOT NULL,
    "final_human_output" JSONB,
    "created_entity_id" UUID,
    "provider" VARCHAR(50) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "prompt_tokens" INTEGER NOT NULL,
    "completion_tokens" INTEGER NOT NULL,
    "cost_micros_usd" INTEGER NOT NULL,
    "rejection_reason" VARCHAR(500),
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_family_usages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "tokens_limit" INTEGER NOT NULL DEFAULT 100000,
    "requests_used" INTEGER NOT NULL DEFAULT 0,
    "requests_limit" INTEGER NOT NULL DEFAULT 200,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ai_family_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_suggestions_family_id_created_at_idx" ON "ai_suggestions"("family_id", "created_at");
CREATE INDEX "ai_suggestions_learner_id_created_at_idx" ON "ai_suggestions"("learner_id", "created_at");
CREATE INDEX "ai_suggestions_status_idx" ON "ai_suggestions"("status");

-- CreateIndex
CREATE INDEX "ai_family_usages_family_id_idx" ON "ai_family_usages"("family_id");
CREATE UNIQUE INDEX "ai_family_usages_family_id_period_key" ON "ai_family_usages"("family_id", "period");

-- AddForeignKey
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_family_usages" ADD CONSTRAINT "ai_family_usages_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
