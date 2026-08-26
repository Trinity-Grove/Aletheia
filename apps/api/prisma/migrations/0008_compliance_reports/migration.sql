-- CreateEnum
CREATE TYPE "attendance_statuses" AS ENUM ('PRESENT', 'EXCUSED_ABSENCE', 'UNEXCUSED_ABSENCE', 'HOLIDAY', 'FIELD_TRIP', 'SICK');

-- CreateEnum
CREATE TYPE "grading_scales" AS ENUM ('MASTERY_QUALITATIVE', 'LETTER_A_F', 'NUMERIC_0_10', 'NUMERIC_0_100', 'NARRATIVE');

-- CreateEnum
CREATE TYPE "report_types" AS ENUM ('ATTENDANCE_SUMMARY', 'ACADEMIC_TRANSCRIPT', 'LEARNING_PORTFOLIO_DOSSIER', 'ANNUAL_COMPLIANCE_REPORT');

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "academic_year_id" UUID,
    "date" DATE NOT NULL,
    "status" "attendance_statuses" NOT NULL DEFAULT 'PRESENT',
    "hours_spent" DOUBLE PRECISION,
    "notes" TEXT,
    "is_auto_logged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_requirements" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "learner_id" UUID,
    "jurisdiction" TEXT,
    "min_instructional_days" INTEGER,
    "min_instructional_hours" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "compliance_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_reports" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "academic_year_id" UUID,
    "type" "report_types" NOT NULL,
    "title" TEXT NOT NULL,
    "grading_scale" "grading_scales" NOT NULL DEFAULT 'MASTERY_QUALITATIVE',
    "content" JSONB NOT NULL,
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "official_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_records_family_id_idx" ON "attendance_records"("family_id");

-- CreateIndex
CREATE INDEX "attendance_records_family_id_learner_id_idx" ON "attendance_records"("family_id", "learner_id");

-- CreateIndex
CREATE INDEX "attendance_records_family_id_date_idx" ON "attendance_records"("family_id", "date");

-- CreateIndex
CREATE INDEX "attendance_records_family_id_academic_year_id_idx" ON "attendance_records"("family_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_family_id_learner_id_date_key" ON "attendance_records"("family_id", "learner_id", "date");

-- CreateIndex
CREATE INDEX "compliance_requirements_family_id_idx" ON "compliance_requirements"("family_id");

-- CreateIndex
CREATE INDEX "compliance_requirements_family_id_academic_year_id_idx" ON "compliance_requirements"("family_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_requirements_family_id_academic_year_id_learner_id_key" ON "compliance_requirements"("family_id", "academic_year_id", "learner_id");

-- CreateIndex
CREATE INDEX "official_reports_family_id_idx" ON "official_reports"("family_id");

-- CreateIndex
CREATE INDEX "official_reports_family_id_learner_id_idx" ON "official_reports"("family_id", "learner_id");

-- CreateIndex
CREATE INDEX "official_reports_family_id_academic_year_id_idx" ON "official_reports"("family_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "official_reports_family_id_type_idx" ON "official_reports"("family_id", "type");

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_requirements" ADD CONSTRAINT "compliance_requirements_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_requirements" ADD CONSTRAINT "compliance_requirements_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_requirements" ADD CONSTRAINT "compliance_requirements_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_reports" ADD CONSTRAINT "official_reports_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_reports" ADD CONSTRAINT "official_reports_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_reports" ADD CONSTRAINT "official_reports_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;
