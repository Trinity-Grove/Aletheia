-- CreateTable
CREATE TABLE "compliance_manual_overrides" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "learner_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "reason" TEXT NOT NULL,
    "overridden_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_manual_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compliance_manual_overrides_family_id_academic_year_id_lea_idx" ON "compliance_manual_overrides"("family_id", "academic_year_id", "learner_id");

-- AddForeignKey
ALTER TABLE "compliance_manual_overrides" ADD CONSTRAINT "compliance_manual_overrides_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_manual_overrides" ADD CONSTRAINT "compliance_manual_overrides_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_manual_overrides" ADD CONSTRAINT "compliance_manual_overrides_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_manual_overrides" ADD CONSTRAINT "compliance_manual_overrides_overridden_by_user_id_fkey" FOREIGN KEY ("overridden_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
