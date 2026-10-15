# Curriculum Definition Path Links

## Context

Issue #96 requires a `CurriculumDefinition` to reference learning paths explicitly. The current catalog can attach domains, competencies, activities, projects, and rubrics, but a curriculum cannot preserve which reusable paths compose it.

## Scope

- Add a normalized `CurriculumDefinitionPath` join with `required` and `order`, matching the existing domain/competency/activity joins.
- Expose admin create/list endpoints and typed contracts.
- Include path links in curriculum pack export/import and pack composition validation.
- Keep existing curricula valid; the relation is additive and optional.

## Acceptance criteria

1. An admin can link a `LearningPath` to a curriculum and list links in order.
2. Duplicate links and invalid foreign keys are rejected consistently with existing joins.
3. Export/import preserves path references and ordering.
4. Existing curriculum creation and activation flows remain unchanged when no paths are linked.
5. The relationship is covered by contracts, API integration tests, and CI quality gates.

## Out of scope

- Family-specific enable/disable of paths; that is a separate override/activation concern.
- Automatically inferring paths from competency links; explicit composition is safer and preserves author intent.
