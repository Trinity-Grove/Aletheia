-- CreateEnum
CREATE TYPE "family_content_visibilities" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateTable
CREATE TABLE "family_activities" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "age_min" INTEGER,
    "age_max" INTEGER,
    "estimated_duration_minutes" INTEGER,
    "supervision_required" BOOLEAN NOT NULL DEFAULT false,
    "risk_level" TEXT,
    "evidence_requirement_mode" TEXT NOT NULL DEFAULT 'ANY',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "visibility" "family_content_visibilities" NOT NULL DEFAULT 'PRIVATE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "family_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "family_activities_family_id_idx" ON "family_activities"("family_id");

-- AddForeignKey
ALTER TABLE "family_activities" ADD CONSTRAINT "family_activities_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
