-- AlterTable: admin-only account disable/reactivate, same nullable-timestamp
-- shape as Learner.archivedAt (null = active, set = disabled since).
ALTER TABLE "users" ADD COLUMN "disabled_at" TIMESTAMPTZ;

-- New audit event types for actions an admin takes on another account.
ALTER TYPE "account_audit_event_types" ADD VALUE 'ACCOUNT_DISABLED_BY_ADMIN';
ALTER TYPE "account_audit_event_types" ADD VALUE 'ACCOUNT_REACTIVATED_BY_ADMIN';
ALTER TYPE "account_audit_event_types" ADD VALUE 'PLATFORM_ADMIN_GRANTED_BY_ADMIN';
ALTER TYPE "account_audit_event_types" ADD VALUE 'PLATFORM_ADMIN_REVOKED_BY_ADMIN';
