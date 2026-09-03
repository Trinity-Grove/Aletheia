-- Store a SHA-256 hash of the family invitation token instead of the
-- plaintext value, matching PasswordResetToken/EmailVerificationToken.
-- Existing pending invitations are rehashed in place from their current
-- plaintext value so they keep working without needing to be reissued.

ALTER TABLE "family_invitations" RENAME COLUMN "token" TO "token_hash";

UPDATE "family_invitations"
SET "token_hash" = encode(sha256("token_hash"::bytea), 'hex');

ALTER INDEX "family_invitations_token_key" RENAME TO "family_invitations_token_hash_key";

DROP INDEX "family_invitations_token_idx";
CREATE INDEX "family_invitations_token_hash_idx" ON "family_invitations"("token_hash");
