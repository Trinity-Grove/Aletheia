-- CreateEnum
CREATE TYPE "pedagogical_frameworks" AS ENUM ('CLASSICAL_TRIVIUM', 'CHARLOTTE_MASON', 'TRADITIONAL', 'UNIT_STUDIES', 'CUSTOM');

-- CreateEnum
CREATE TYPE "objective_statuses" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED');

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "description" TEXT,
    "archived_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_curriculum_plans" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "pedagogical_framework" "pedagogical_frameworks" NOT NULL DEFAULT 'CUSTOM',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "learner_curriculum_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_objectives" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "objective_statuses" NOT NULL DEFAULT 'NOT_STARTED',
    "target_date" DATE,
    "achieved_at" TIMESTAMPTZ,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "learning_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "academic_years_family_id_idx" ON "academic_years"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_family_id_year_key" ON "academic_years"("family_id", "year");

-- CreateIndex
CREATE INDEX "subjects_family_id_idx" ON "subjects"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_family_id_name_key" ON "subjects"("family_id", "name");

-- CreateIndex
CREATE INDEX "learner_curriculum_plans_family_id_idx" ON "learner_curriculum_plans"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "learner_curriculum_plans_family_id_learner_id_academic_year_id_key" ON "learner_curriculum_plans"("family_id", "learner_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "learning_objectives_family_id_learner_id_academic_year_id_idx" ON "learning_objectives"("family_id", "learner_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "learning_objectives_family_id_subject_id_idx" ON "learning_objectives"("family_id", "subject_id");

-- AddForeignKey
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_curriculum_plans" ADD CONSTRAINT "learner_curriculum_plans_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_curriculum_plans" ADD CONSTRAINT "learner_curriculum_plans_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_curriculum_plans" ADD CONSTRAINT "learner_curriculum_plans_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
