-- AlterTable
ALTER TABLE "users" ADD COLUMN "terms_of_use_definition_id" UUID,
ADD COLUMN "terms_of_use_accepted_at" TIMESTAMPTZ,
ADD COLUMN "privacy_policy_definition_id" UUID,
ADD COLUMN "privacy_policy_accepted_at" TIMESTAMPTZ;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_terms_of_use_definition_id_fkey" FOREIGN KEY ("terms_of_use_definition_id") REFERENCES "consent_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_privacy_policy_definition_id_fkey" FOREIGN KEY ("privacy_policy_definition_id") REFERENCES "consent_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
