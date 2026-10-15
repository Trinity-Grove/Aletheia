# Plan: declarative pedagogical preferences

## Task 1 — contract tests first

- Add tests for valid preferences, empty/legacy metadata compatibility, invalid ranges, invalid weights, and malformed activity-type codes.

## Task 2 — metadata and catalog projection

- Extend `pedagogicalModelMetadataSchema` and the lean catalog schema.
- Project the validated fields from the published resolver without changing the template application path.

## Task 3 — verification and handoff

- Run contracts, API typecheck/lint, resolver tests, boundaries, no-sibling, and i18n coverage.
- Commit and open a repository-style PR referencing #96; merge only after all CI gates pass.
