-- CreateEnum
CREATE TYPE "prayer_types" AS ENUM ('PETITION', 'GRATITUDE');

-- CreateTable
CREATE TABLE "daily_devotionals" (
    "id" uuid NOT NULL,
    "family_id" uuid NOT NULL,
    "date" date NOT NULL,
    "bible_reference" text NOT NULL,
    "bible_version_id" text,
    "passage_text" text,
    "reflection" text,
    "memory_verse" text,
    "hymn_or_song" text,
    "discussion_questions" text,
    "practical_application" text,
    "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_devotionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prayer_requests" (
    "id" uuid NOT NULL,
    "family_id" uuid NOT NULL,
    "learner_id" uuid,
    "type" "prayer_types" NOT NULL DEFAULT 'PETITION',
    "title" text NOT NULL,
    "description" text,
    "is_answered" boolean NOT NULL DEFAULT false,
    "answered_at" timestamptz,
    "answered_note" text,
    "archived_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prayer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_devotionals_family_id_date_key" ON "daily_devotionals"("family_id", "date");

-- CreateIndex
CREATE INDEX "daily_devotionals_family_id_idx" ON "daily_devotionals"("family_id");

-- CreateIndex
CREATE INDEX "prayer_requests_family_id_idx" ON "prayer_requests"("family_id");

-- CreateIndex
CREATE INDEX "prayer_requests_family_id_is_answered_idx" ON "prayer_requests"("family_id", "is_answered");

-- AddForeignKey
ALTER TABLE "daily_devotionals" ADD CONSTRAINT "daily_devotionals_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
