-- CreateEnum
CREATE TYPE "lesson_statuses" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED', 'CANCELLED');

-- CreateTable
CREATE TABLE "lesson_plans" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "academic_year_id" UUID,
    "subject_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "duration_minutes" INTEGER,
    "actual_duration_minutes" INTEGER,
    "status" "lesson_statuses" NOT NULL DEFAULT 'PLANNED',
    "materials" TEXT,
    "homework" TEXT,
    "notes" TEXT,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "lesson_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_plan_learners" (
    "id" UUID NOT NULL,
    "lesson_plan_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_plan_learners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_plan_objectives" (
    "id" UUID NOT NULL,
    "lesson_plan_id" UUID NOT NULL,
    "objective_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_plan_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_schedule_slots" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "academic_year_id" UUID,
    "subject_id" UUID,
    "learner_id" UUID,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "color" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "weekly_schedule_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_plans_family_id_idx" ON "lesson_plans"("family_id");

-- CreateIndex
CREATE INDEX "lesson_plans_family_id_date_idx" ON "lesson_plans"("family_id", "date");

-- CreateIndex
CREATE INDEX "lesson_plans_family_id_subject_id_idx" ON "lesson_plans"("family_id", "subject_id");

-- CreateIndex
CREATE INDEX "lesson_plans_family_id_status_idx" ON "lesson_plans"("family_id", "status");

-- CreateIndex
CREATE INDEX "lesson_plan_learners_learner_id_idx" ON "lesson_plan_learners"("learner_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_plan_learners_lesson_plan_id_learner_id_key" ON "lesson_plan_learners"("lesson_plan_id", "learner_id");

-- CreateIndex
CREATE INDEX "lesson_plan_objectives_objective_id_idx" ON "lesson_plan_objectives"("objective_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_plan_objectives_lesson_plan_id_objective_id_key" ON "lesson_plan_objectives"("lesson_plan_id", "objective_id");

-- CreateIndex
CREATE INDEX "weekly_schedule_slots_family_id_idx" ON "weekly_schedule_slots"("family_id");

-- CreateIndex
CREATE INDEX "weekly_schedule_slots_family_id_day_of_week_idx" ON "weekly_schedule_slots"("family_id", "day_of_week");

-- CreateIndex
CREATE INDEX "weekly_schedule_slots_family_id_learner_id_idx" ON "weekly_schedule_slots"("family_id", "learner_id");

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plan_learners" ADD CONSTRAINT "lesson_plan_learners_lesson_plan_id_fkey" FOREIGN KEY ("lesson_plan_id") REFERENCES "lesson_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plan_learners" ADD CONSTRAINT "lesson_plan_learners_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plan_objectives" ADD CONSTRAINT "lesson_plan_objectives_lesson_plan_id_fkey" FOREIGN KEY ("lesson_plan_id") REFERENCES "lesson_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plan_objectives" ADD CONSTRAINT "lesson_plan_objectives_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_schedule_slots" ADD CONSTRAINT "weekly_schedule_slots_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_schedule_slots" ADD CONSTRAINT "weekly_schedule_slots_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_schedule_slots" ADD CONSTRAINT "weekly_schedule_slots_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_schedule_slots" ADD CONSTRAINT "weekly_schedule_slots_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
