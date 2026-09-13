-- CreateEnum
CREATE TYPE "learner_competency_tracking_statuses" AS ENUM ('ACTIVE', 'RETIRED');

-- CreateTable
CREATE TABLE "learner_competency_tracking" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "competency_definition_id" UUID NOT NULL,
    "competency_version" INTEGER NOT NULL,
    "curriculum_definition_id" UUID,
    "status" "learner_competency_tracking_statuses" NOT NULL DEFAULT 'ACTIVE',
    "activated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retired_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learner_competency_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learner_competency_tracking_family_id_idx" ON "learner_competency_tracking"("family_id");

-- CreateIndex
CREATE INDEX "learner_competency_tracking_family_id_learner_id_idx" ON "learner_competency_tracking"("family_id", "learner_id");

-- CreateIndex
CREATE INDEX "learner_competency_tracking_competency_definition_id_idx" ON "learner_competency_tracking"("competency_definition_id");

-- CreateIndex
CREATE INDEX "learner_competency_tracking_curriculum_definition_id_idx" ON "learner_competency_tracking"("curriculum_definition_id");

-- CreateIndex
CREATE UNIQUE INDEX "learner_competency_tracking_learner_id_competency_definiti_key" ON "learner_competency_tracking"("learner_id", "competency_definition_id", "competency_version");

-- AddForeignKey
ALTER TABLE "learner_competency_tracking" ADD CONSTRAINT "learner_competency_tracking_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_competency_tracking" ADD CONSTRAINT "learner_competency_tracking_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_competency_tracking" ADD CONSTRAINT "learner_competency_tracking_competency_definition_id_fkey" FOREIGN KEY ("competency_definition_id") REFERENCES "competency_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_competency_tracking" ADD CONSTRAINT "learner_competency_tracking_curriculum_definition_id_fkey" FOREIGN KEY ("curriculum_definition_id") REFERENCES "curriculum_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
