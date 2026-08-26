-- CreateEnum
CREATE TYPE "notification_types" AS ENUM ('DEVOTIONAL_REMINDER', 'DAILY_SCHEDULE_REMINDER', 'ATTENDANCE_MISSING_REMINDER', 'PRAYER_ANSWERED_ALERT', 'SYSTEM_NOTICE');

-- CreateEnum
CREATE TYPE "export_statuses" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "family_settings" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "homeschool_name" TEXT,
    "default_grading_scale" "grading_scales" NOT NULL DEFAULT 'MASTERY_QUALITATIVE',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "devotional_reminder_time" TEXT,
    "daily_schedule_reminder_time" TEXT,
    "attendance_reminder_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "in_app_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "family_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_items" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "notification_types" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notification_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_export_jobs" (
    "id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "requested_by_id" UUID NOT NULL,
    "status" "export_statuses" NOT NULL DEFAULT 'PENDING',
    "download_url" TEXT,
    "file_size_bytes" INTEGER,
    "completed_at" TIMESTAMPTZ,
    "error_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "data_export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "family_settings_family_id_key" ON "family_settings"("family_id");

-- CreateIndex
CREATE INDEX "notification_items_family_id_idx" ON "notification_items"("family_id");

-- CreateIndex
CREATE INDEX "notification_items_family_id_user_id_idx" ON "notification_items"("family_id", "user_id");

-- CreateIndex
CREATE INDEX "notification_items_family_id_user_id_is_read_idx" ON "notification_items"("family_id", "user_id", "is_read");

-- CreateIndex
CREATE INDEX "data_export_jobs_family_id_idx" ON "data_export_jobs"("family_id");

-- CreateIndex
CREATE INDEX "data_export_jobs_family_id_status_idx" ON "data_export_jobs"("family_id", "status");

-- AddForeignKey
ALTER TABLE "family_settings" ADD CONSTRAINT "family_settings_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_items" ADD CONSTRAINT "notification_items_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_items" ADD CONSTRAINT "notification_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_export_jobs" ADD CONSTRAINT "data_export_jobs_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_export_jobs" ADD CONSTRAINT "data_export_jobs_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
