-- CreateEnum
CREATE TYPE "account_audit_event_types" AS ENUM ('LOGIN_SUCCEEDED', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'EMAIL_CHANGED', 'EMAIL_VERIFIED', 'REFRESH_TOKEN_REUSE_DETECTED');

-- CreateTable
CREATE TABLE "account_audit_log_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_type" "account_audit_event_types" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_audit_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_audit_log_entries_user_id_created_at_idx" ON "account_audit_log_entries"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "account_audit_log_entries" ADD CONSTRAINT "account_audit_log_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
