# Plan — Definition version diff

1. Add the query/response contracts and contract tests.
2. Extend the existing allowlisted version-operation registry with a read-only
   generic comparison operation.
3. Add the guarded `GET .../version-operations/diff` endpoint.
4. Add unit coverage for changed fields, ignored generated metadata, missing
   versions, and equal versions.
5. Run contracts/API tests, typecheck, lint, boundaries, i18n, and diff checks.

