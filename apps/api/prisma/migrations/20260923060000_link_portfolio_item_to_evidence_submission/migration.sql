-- AlterTable
ALTER TABLE "portfolio_items" ADD COLUMN "evidence_submission_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_items_evidence_submission_id_key" ON "portfolio_items"("evidence_submission_id");

-- AddForeignKey
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_evidence_submission_id_fkey" FOREIGN KEY ("evidence_submission_id") REFERENCES "evidence_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
