-- Migrate the learner profile to the universal, country-neutral stage codes.
-- The old enum labels are accepted at the API boundary during the rollout,
-- but are not retained in the database after this migration.

CREATE TYPE "educational_stages_new" AS ENUM (
  'EARLY_YEARS',
  'PRIMARY',
  'LOWER_SECONDARY',
  'UPPER_SECONDARY',
  'OTHER'
);

ALTER TABLE "learners"
  ALTER COLUMN "stage" DROP DEFAULT,
  ALTER COLUMN "stage" TYPE "educational_stages_new"
  USING (
    CASE "stage"::text
      WHEN 'PRIMARY_GRAMMAR' THEN 'PRIMARY'
      WHEN 'MIDDLE_LOGIC' THEN 'LOWER_SECONDARY'
      WHEN 'HIGH_RHETORIC' THEN 'UPPER_SECONDARY'
      ELSE "stage"::text
    END
  )::"educational_stages_new";

DROP TYPE "educational_stages";
ALTER TYPE "educational_stages_new" RENAME TO "educational_stages";

ALTER TABLE "learners"
  ALTER COLUMN "stage" SET DEFAULT 'PRIMARY';
