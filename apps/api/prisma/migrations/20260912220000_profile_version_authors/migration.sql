-- Existing history has no known actor. Do not backfill invented attribution.
ALTER TABLE "pedagogical_profiles" ADD COLUMN "created_by_user_id" UUID;
ALTER TABLE "theological_profiles" ADD COLUMN "created_by_user_id" UUID;

ALTER TABLE "pedagogical_profiles" ADD CONSTRAINT "pedagogical_profiles_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "theological_profiles" ADD CONSTRAINT "theological_profiles_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
