-- CreateEnum
CREATE TYPE "mastery_levels" AS ENUM ('NOT_STARTED', 'EXPOSURE', 'DEVELOPING', 'WITH_ASSISTANCE', 'AUTONOMOUS', 'MASTERED');

-- CreateEnum
CREATE TYPE "assessment_methods" AS ENUM ('OBSERVATION', 'NARRATION', 'EXERCISE', 'WRITING', 'PROJECT', 'EXPERIMENT', 'PRESENTATION', 'TEST', 'SELF_ASSESSMENT', 'PRACTICAL_DEMONSTRATION');

-- CreateEnum
CREATE TYPE "evidence_types" AS ENUM ('IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'LINK', 'TEXT', 'CERTIFICATE');

-- CreateEnum
CREATE TYPE "learning_record_types" AS ENUM ('PLANNED_LESSON', 'SPONTANEOUS_EXPERIENCE', 'PROJECT_WORK', 'READING_LOG', 'HABIT_PRACTICE');

-- CreateTable
CREATE TABLE "learning_records" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "subject_id" UUID,
    "academic_year_id" UUID,
    "lesson_plan_id" UUID,
    "type" "learning_record_types" NOT NULL DEFAULT 'PLANNED_LESSON',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "duration_minutes" INTEGER,
    "mastery_level" "mastery_levels" NOT NULL DEFAULT 'DEVELOPING',
    "assessment_method" "assessment_methods" NOT NULL DEFAULT 'OBSERVATION',
    "strengths" TEXT,
    "areas_for_growth" TEXT,
    "character_habit_growth" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "learning_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_record_objectives" (
    "id" UUID NOT NULL,
    "learning_record_id" UUID NOT NULL,
    "objective_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_record_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_items" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "learning_record_id" UUID,
    "academic_year_id" UUID,
    "subject_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "evidence_types" NOT NULL,
    "file_url" TEXT,
    "text_content" TEXT,
    "mime_type" TEXT,
    "file_size_bytes" INTEGER,
    "captured_at" DATE,
    "is_highlight" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_records_family_id_idx" ON "learning_records"("family_id");

-- CreateIndex
CREATE INDEX "learning_records_family_id_learner_id_idx" ON "learning_records"("family_id", "learner_id");

-- CreateIndex
CREATE INDEX "learning_records_family_id_date_idx" ON "learning_records"("family_id", "date");

-- CreateIndex
CREATE INDEX "learning_records_family_id_subject_id_idx" ON "learning_records"("family_id", "subject_id");

-- CreateIndex
CREATE INDEX "learning_records_family_id_type_idx" ON "learning_records"("family_id", "type");

-- CreateIndex
CREATE INDEX "learning_record_objectives_objective_id_idx" ON "learning_record_objectives"("objective_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_record_objectives_learning_record_id_objective_id_key" ON "learning_record_objectives"("learning_record_id", "objective_id");

-- CreateIndex
CREATE INDEX "portfolio_items_family_id_idx" ON "portfolio_items"("family_id");

-- CreateIndex
CREATE INDEX "portfolio_items_family_id_learner_id_idx" ON "portfolio_items"("family_id", "learner_id");

-- CreateIndex
CREATE INDEX "portfolio_items_family_id_learning_record_id_idx" ON "portfolio_items"("family_id", "learning_record_id");

-- CreateIndex
CREATE INDEX "portfolio_items_family_id_subject_id_idx" ON "portfolio_items"("family_id", "subject_id");

-- CreateIndex
CREATE INDEX "portfolio_items_family_id_is_highlight_idx" ON "portfolio_items"("family_id", "is_highlight");

-- AddForeignKey
ALTER TABLE "learning_records" ADD CONSTRAINT "learning_records_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_records" ADD CONSTRAINT "learning_records_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_records" ADD CONSTRAINT "learning_records_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_records" ADD CONSTRAINT "learning_records_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_records" ADD CONSTRAINT "learning_records_lesson_plan_id_fkey" FOREIGN KEY ("lesson_plan_id") REFERENCES "lesson_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_record_objectives" ADD CONSTRAINT "learning_record_objectives_learning_record_id_fkey" FOREIGN KEY ("learning_record_id") REFERENCES "learning_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_record_objectives" ADD CONSTRAINT "learning_record_objectives_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_learning_record_id_fkey" FOREIGN KEY ("learning_record_id") REFERENCES "learning_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
