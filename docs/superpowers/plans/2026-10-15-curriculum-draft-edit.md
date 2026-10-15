# Plan: edit curriculum drafts

## Task 1 — contract and audit vocabulary (TDD)

- Add `updateCurriculumDefinitionSchema` as a non-empty partial object containing only editable fields.
- Add `UPDATE` to the operation type contract and Prisma enum.
- Write contract tests for valid partial updates, empty payload rejection, and immutable-field rejection.

## Task 2 — repository/service/controller vertical slice (TDD)

- Add repository persistence for the four editable fields.
- Add service guard requiring `DRAFT`, map not-found and FK/unique errors consistently, and log successful updates.
- Add the guarded PATCH endpoint and controller tests through the existing integration suite.

## Task 3 — verification and handoff

- Run focused contract/API tests first, then Prisma generate, typecheck, lint, boundaries, no-sibling, full contracts/API suites, and i18n coverage.
- Verify the migration is additive and does not alter existing data.
- Commit, open a repository-style PR referencing #96, and merge only after all CI jobs are green.
