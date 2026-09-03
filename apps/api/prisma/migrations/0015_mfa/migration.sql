-- MFA (TOTP) support: adds per-user opt-in state, an encrypted TOTP secret,
-- single-use recovery codes, and expiring setup/login challenges.

-- 1. Add the mfa_enabled flag to users (defaults off for every existing user).
ALTER TABLE "users" ADD COLUMN "mfa_enabled" BOOLEAN NOT NULL DEFAULT false;

-- 2. Encrypted TOTP secret, present only once TOTP is confirmed.
CREATE TABLE "mfa_secrets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "encrypted_secret" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_secrets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mfa_secrets_user_id_key" ON "mfa_secrets"("user_id");

-- 3. Single-use recovery codes (hashed). Never read back; only matched.
CREATE TABLE "mfa_recovery_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_recovery_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mfa_recovery_codes_user_id_idx" ON "mfa_recovery_codes"("user_id");

-- 4. In-flight setup attempts; one per user, overwritten on retry.
CREATE TABLE "mfa_setup_challenges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "encrypted_secret" TEXT NOT NULL,
    "recovery_code_hashes" TEXT[] NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_setup_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mfa_setup_challenges_user_id_key" ON "mfa_setup_challenges"("user_id");

-- 5. Pending login challenges for the two-step flow; the attempt counter
--    is the brute-force bound for the unauthenticated verify endpoint.
CREATE TABLE "mfa_login_challenges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_login_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mfa_login_challenges_token_hash_key" ON "mfa_login_challenges"("token_hash");
CREATE INDEX "mfa_login_challenges_user_id_idx" ON "mfa_login_challenges"("user_id");

-- 6. Foreign keys to users (cascade on delete keeps cleanup automatic).
ALTER TABLE "mfa_secrets"
    ADD CONSTRAINT "mfa_secrets_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mfa_recovery_codes"
    ADD CONSTRAINT "mfa_recovery_codes_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mfa_setup_challenges"
    ADD CONSTRAINT "mfa_setup_challenges_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mfa_login_challenges"
    ADD CONSTRAINT "mfa_login_challenges_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. New audit event types.
ALTER TYPE "account_audit_event_types" ADD VALUE 'MFA_ENABLED';
ALTER TYPE "account_audit_event_types" ADD VALUE 'MFA_DISABLED';
ALTER TYPE "account_audit_event_types" ADD VALUE 'MFA_CHALLENGE_FAILED';
