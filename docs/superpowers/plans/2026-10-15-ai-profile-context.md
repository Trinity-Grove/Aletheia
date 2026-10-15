# Plan: include family profiles in AI lesson generation

## Task 1 — red tests

- Extend `ai-suggestion.service.spec.ts` Prisma fixtures with latest profile queries.
- Add a test with two profile versions and assert the provider receives only the highest-version codes/weights.
- Add a test proving no profile context is added when both queries return `null`.

## Task 2 — minimal implementation

- Query `pedagogicalProfile` and `theologicalProfile` with `familyId` and descending `version`.
- Build a small prompt-context formatter that selects allowlisted fields only.
- Append the context before masking and provider invocation.

## Task 3 — verification

- Run focused AI service tests.
- Run API typecheck/lint, the full API unit suite, contracts tests/lint, and module-boundary checks.
- Rely on CI for PostgreSQL-backed integration and browser checks.

## Commit

`feat(ai): respect family learning profiles`
