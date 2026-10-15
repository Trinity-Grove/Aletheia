# Plan: apply activity safety policy to AI lesson drafts

## Task 1 — contracts and red tests

- Extend `generateLessonPlanDraftRequestSchema` with optional `activityDefinitionId`.
- Add service tests for published activity context, age rejection, and unpublished activity rejection.
- Assert safety failures happen before provider invocation, quota recording, and persistence.

## Task 2 — implementation

- Resolve the activity by ID and `status: PUBLISHED` when requested.
- Calculate learner age before applying the activity age range.
- Append a small allowlisted safety context to the prompt.

## Task 3 — verification

- Run focused AI and contract tests.
- Run API typecheck/lint, full API unit tests, contracts lint/tests, and module-boundary checks.
- Rely on CI for PostgreSQL-backed and browser checks.

## Commit

`feat(ai): apply activity safety context`
