-- CreateTable
CREATE TABLE "learner_badge_awards" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "badge_code" VARCHAR(64) NOT NULL,
    "awarded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMPTZ,

    CONSTRAINT "learner_badge_awards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learner_badge_awards_learner_id_badge_code_key" ON "learner_badge_awards"("learner_id", "badge_code");

-- CreateIndex
CREATE INDEX "learner_badge_awards_family_id_learner_id_idx" ON "learner_badge_awards"("family_id", "learner_id");

-- AddForeignKey
ALTER TABLE "learner_badge_awards" ADD CONSTRAINT "learner_badge_awards_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_badge_awards" ADD CONSTRAINT "learner_badge_awards_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
