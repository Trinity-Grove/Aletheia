-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN "source" VARCHAR(32) NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "family_settings" ADD COLUMN "onboardingDismissed" BOOLEAN NOT NULL DEFAULT false;
