# Plan: family learning-path selections

## Task 1 — contract and schema RED/GREEN

- Add request/response contracts and tests.
- Add the normalized Prisma model and additive migration.

## Task 2 — repository/service/controller RED/GREEN

- Add repository upsert/list operations with a published-path guard.
- Add family-scoped service and routes using the existing tenant guard.
- Add API integration coverage for enable, idempotent disable, list, and invalid path behavior.

## Task 3 — verification and handoff

- Run contracts, Prisma generate, API typecheck/lint/unit tests, integration target where PostgreSQL is available, boundaries, no-sibling, and i18n coverage.
- Commit, publish a repository-style PR, and merge only after all CI jobs pass.
