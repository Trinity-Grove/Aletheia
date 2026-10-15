# Declarative pedagogical model preferences

## Context

Issue #96 requires pedagogical models to be data rather than code. The catalog already stores subjects, approach, age range, and educational stages in JSON metadata, but it has no typed fields for the model's principles or activity/evaluation preferences.

## Scope

- Extend the validated pedagogical model metadata with optional declarative fields:
  - `principles`: short principle statements;
  - `preferredActivityTypes`: namespaced activity-type codes;
  - `assessmentTypeWeights`: non-negative normalized weights by assessment type;
  - `preferredDurationMinutes`: optional min/max range;
  - `recommendationHints`: short data-only hints for a future recommendation engine.
- Expose these fields in the family-facing published catalog when present.
- Keep the values versioned inside the existing `PedagogicalModelDefinition.metadata` JSONB; no new tables or enums.
- Do not make the current planner or template engine interpret these fields in this slice.

## Acceptance criteria

1. Admin create/seed payloads validate the new metadata shape.
2. Invalid ranges, empty entries, negative weights, and malformed namespaced codes are rejected.
3. Published catalog responses preserve the fields without exposing admin-only version data.
4. Existing metadata remains valid and existing catalog responses remain unchanged when fields are absent.
5. No framework-specific switch or hardcoded recommendation behavior is introduced.
