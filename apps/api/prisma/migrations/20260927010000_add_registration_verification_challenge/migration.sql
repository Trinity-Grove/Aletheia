-- AlterTable: distinguishes accounts that must confirm a 6-digit code
-- before login() issues a session (new registrations) from pre-existing
-- unverified accounts, which are never retroactively blocked.
ALTER TABLE "users" ADD COLUMN "email_verification_required" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "registration_verification_challenges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "plain_code_debug_only" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_verification_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "registration_verification_challenges_token_hash_key" ON "registration_verification_challenges"("token_hash");
CREATE INDEX "registration_verification_challenges_user_id_idx" ON "registration_verification_challenges"("user_id");

ALTER TABLE "registration_verification_challenges"
    ADD CONSTRAINT "registration_verification_challenges_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- New audit event type.
ALTER TYPE "account_audit_event_types" ADD VALUE 'EMAIL_VERIFICATION_CODE_FAILED';
