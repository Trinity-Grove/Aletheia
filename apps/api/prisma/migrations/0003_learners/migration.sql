-- CreateEnum
CREATE TYPE "educational_stages" AS ENUM ('EARLY_YEARS', 'PRIMARY_GRAMMAR', 'MIDDLE_LOGIC', 'HIGH_RHETORIC', 'OTHER');

-- CreateTable
CREATE TABLE "learners" (
    "id" uuid NOT NULL,
    "family_id" uuid NOT NULL,
    "first_name" text NOT NULL,
    "last_name" text,
    "preferred_name" text,
    "birth_date" date NOT NULL,
    "stage" "educational_stages" NOT NULL DEFAULT 'PRIMARY_GRAMMAR',
    "custom_grade" text,
    "avatar_color" text,
    "special_needs" text,
    "notes" text,
    "archived_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learners_family_id_idx" ON "learners"("family_id");

-- CreateIndex
CREATE INDEX "learners_family_id_archived_at_idx" ON "learners"("family_id", "archived_at");

-- AddForeignKey
ALTER TABLE "learners" ADD CONSTRAINT "learners_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

