-- Corrects drift between migration history and schema.prisma (issue #49).
--
-- 1. Early hand-written migrations gave `@updatedAt` columns a DB-level
--    `DEFAULT CURRENT_TIMESTAMP`. Prisma's `@updatedAt` is managed at the
--    query layer, not via a database default, so the default was never
--    part of the schema and only ever applied on row creation (redundant
--    with the app already setting `updated_at` on insert). No data or
--    behavior depends on it.
ALTER TABLE "daily_devotionals" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "families" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "family_members" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "learners" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "prayer_requests" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;

-- 2. Two composite unique-index names exceeded Postgres's 63-byte
--    identifier limit at creation time, so Postgres silently truncated
--    them. Renaming to the 63-byte name Prisma computes today keeps the
--    index (same columns, same uniqueness constraint) — this is a pure
--    rename, not a rebuild.
ALTER INDEX "compliance_requirements_family_id_academic_year_id_learner_id_k" RENAME TO "compliance_requirements_family_id_academic_year_id_learner__key";
ALTER INDEX "learner_curriculum_plans_family_id_learner_id_academic_year_id_" RENAME TO "learner_curriculum_plans_family_id_learner_id_academic_year_key";
