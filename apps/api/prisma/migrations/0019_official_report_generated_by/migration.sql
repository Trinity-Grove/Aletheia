-- Records who generated an official report (issue #28: "Registro de quem
-- gerou e quais dados compuseram o arquivo"). Nullable since existing rows
-- predate this attribution and there is no way to backfill it accurately.
ALTER TABLE "official_reports" ADD COLUMN "generated_by_user_id" UUID;

ALTER TABLE "official_reports" ADD CONSTRAINT "official_reports_generated_by_user_id_fkey" FOREIGN KEY ("generated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
