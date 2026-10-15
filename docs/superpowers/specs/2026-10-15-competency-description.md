# Competency Definition Description

## Context

Issue #96 lists `CompetencyDefinition` description as a missing data-driven field. A competency currently has a title and extensible metadata, but no first-class description in the catalog contract or relational model.

## Scope

- Add an optional, bounded `description` field to `CompetencyDefinition`.
- Expose it in create and response contracts, API persistence, and the generic version diff.
- Preserve existing rows and payloads: the field is nullable and omitted inputs remain valid.
- Keep the field content-neutral; no domain-specific enum, UI, or seed migration is required.

## Acceptance criteria

1. A competency can be created with a description and the API returns it.
2. A competency without a description remains valid and returns `null`.
3. The database migration is additive and preserves all existing competencies.
4. Version diff reports a changed description when comparing two versions.
5. Contracts, API tests, typecheck, lint, boundaries, and i18n checks remain green.

## Out of scope

- Editing published definitions in place; lifecycle/versioning rules remain unchanged.
- Translated descriptions; localization is a separate catalog concern.
- Content authoring UI or family-owned competency definitions.
