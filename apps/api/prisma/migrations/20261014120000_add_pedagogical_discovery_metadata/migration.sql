-- Add discovery metadata as new published catalog versions.
-- Published definition rows are append-only: keep every existing version and
-- preserve metadata.subjects while enriching the latest version per model.
WITH discovery (code, approach, min_age, max_age, educational_stages) AS (
  VALUES
    ('CLASSICAL_TRIVIUM', 'CLASSICAL_TRIVIUM', 6, 18, '["PRIMARY", "LOWER_SECONDARY", "UPPER_SECONDARY"]'::jsonb),
    ('CHARLOTTE_MASON', 'CHARLOTTE_MASON', 6, 18, '["PRIMARY", "LOWER_SECONDARY", "UPPER_SECONDARY"]'::jsonb),
    ('TRADITIONAL', 'TRADITIONAL', 6, 18, '["PRIMARY", "LOWER_SECONDARY", "UPPER_SECONDARY"]'::jsonb),
    ('UNIT_STUDIES', 'UNIT_STUDIES', 5, 18, '["EARLY_YEARS", "PRIMARY", "LOWER_SECONDARY", "UPPER_SECONDARY"]'::jsonb),
    ('MONTESSORI', 'MONTESSORI', 3, 12, '["EARLY_YEARS", "PRIMARY", "LOWER_SECONDARY"]'::jsonb),
    ('PROJECT_BASED', 'PROJECT_BASED', 8, 18, '["PRIMARY", "LOWER_SECONDARY", "UPPER_SECONDARY"]'::jsonb),
    ('GUIDED_UNSCHOOLING', 'GUIDED_UNSCHOOLING', 4, 18, '["EARLY_YEARS", "PRIMARY", "LOWER_SECONDARY", "UPPER_SECONDARY"]'::jsonb),
    ('ECLECTIC', 'ECLECTIC', 3, 18, '["EARLY_YEARS", "PRIMARY", "LOWER_SECONDARY", "UPPER_SECONDARY"]'::jsonb)
), latest AS (
  SELECT DISTINCT ON (p.code)
    p.code,
    p.version,
    p.schema_version,
    p.name,
    p.description,
    p.metadata,
    d.approach,
    d.min_age,
    d.max_age,
    d.educational_stages
  FROM "pedagogical_model_definitions" p
  JOIN discovery d ON d.code = p.code
  WHERE p.status = 'PUBLISHED'
  ORDER BY p.code, p.version DESC
)
INSERT INTO "pedagogical_model_definitions"
  ("id", "code", "version", "status", "schema_version", "name", "description", "metadata", "published_at")
SELECT
  gen_random_uuid(),
  latest.code,
  latest.version + 1,
  'PUBLISHED',
  latest.schema_version,
  latest.name,
  latest.description,
  latest.metadata || jsonb_build_object(
    'approach', latest.approach,
    'recommendedAgeRange', jsonb_build_object('min', latest.min_age, 'max', latest.max_age),
    'educationalStages', latest.educational_stages
  ),
  CURRENT_TIMESTAMP
FROM latest
WHERE NOT EXISTS (
  SELECT 1
  FROM "pedagogical_model_definitions" existing
  WHERE existing.code = latest.code
    AND existing.version = latest.version + 1
);
