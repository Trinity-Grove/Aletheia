# Plan: Learning domain activation

1. Add `isActive` and the migration with a safe `DEFAULT true`; extend the shared contract and response mapping.
2. Add repository/service support and an admin activation endpoint using the existing platform-admin guard.
3. Record the change through the existing definition operation audit mechanism.
4. Add contract, service, and real Postgres integration coverage for default state, idempotent toggling, 404, audit metadata, and lifecycle separation.
5. Run typecheck, lint, API tests, contract tests, boundaries, i18n, and CI checks before opening the PR.
