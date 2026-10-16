# Task 4 — Authenticated approval API and mentor capability

## Status

Implemented. No frontend files or pre-existing spec/plan edits were changed for this task.

## RED / GREEN evidence

- RED: the first focused approval-service run failed at TypeScript compilation because `recordForFamily`, the mentor public API, and the authorization dependency did not exist. The failure matched the missing behavior this task adds.
- GREEN: focused API unit suites passed: 3 suites, 24 tests. Coverage includes all three family approver roles, EDUCATOR/non-member denial, mentor identity and exact learner/family scope, denied mentor grants, capability-toggle authorization and wrong grant scope, and the grant query’s active/accepted/capability/expiry filters.
- Added real-Postgres integration coverage for mentor inbox isolation, pending/expired/revoked/disabled grants, actor spoofing, authenticated assessment attribution, capability toggle independent of revocation, and family-scope isolation. These tests could not complete because PostgreSQL is unavailable at `localhost:5432` (Prisma `P1001`). The new integration suite failed during user registration setup before reaching its assertions; the existing mentor integration suite independently confirmed the database connection failure.
- Contract test execution was blocked by Windows `spawn EPERM` inside Vitest/Vite. Contract TypeScript build and typecheck passed.

## Implemented behavior

- Family approval endpoint derives the actor exclusively from the authenticated session and permits only `OWNER_GUARDIAN`, `GUARDIAN`, or `CO_GUARDIAN`.
- Mentor inbox and decision routes use `JwtAuthGuard` only. The inbox is limited to pending trackings under that mentor’s accepted, active, unexpired grants with `canApproveProgression`; its response contains no general family-member or mentor-grant details.
- Mentor approval authorization is checked against the exact tracking’s family and learner, then rechecked and row-locked inside the decision transaction. A concurrent revocation/capability change cannot authorize a later decision.
- Capability update is a separately scoped operation and does not revoke or reactivate the grant. False remains the default; granting/enabling requires one of the three permitted family roles.
- Assessment authorship is derived from the authenticated user. A conflicting client-supplied `assessorUserId` is rejected.
- Idempotent decision semantics and the existing progression repository gate remain intact.

## Verification

- API unit tests: PASS — 3 suites / 24 tests.
- API TypeScript: PASS via direct `tsc --noEmit`. The package `typecheck` lifecycle command could not complete its Prisma generate pre-step because Windows denied a rename of the Prisma query-engine DLL (`EPERM`).
- Contracts build and typecheck: PASS.
- Targeted ESLint: PASS.
- Module-boundary checker: PASS when run directly. The wrapper `pnpm check:boundaries` could not start its Node test worker (`spawn EPERM`).
- `git diff --check`: PASS.
- PostgreSQL integration tests: NOT VERIFIED; local Postgres is unreachable.

## Remaining concern

Before merge, run the added and modified integration suites against CI or a local PostgreSQL instance. The database-backed grant row lock, revocation race behavior, migration-backed approval persistence, and HTTP authorization assertions remain unverified in this environment.
