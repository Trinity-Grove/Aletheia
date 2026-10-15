# Plan — ALET-248 jurisdiction profile integration

1. Extend the shared privacy profile schema and jurisdiction metadata contract.
2. Add profile metadata to the existing jurisdiction seeds without changing
   legal thresholds or copy.
3. Expose the optional profile in the family jurisdiction DTO, preserving
   legacy rows and the fallback response.
4. Add service/contract tests and run API typecheck, lint, contracts tests,
   i18n, module boundaries, and diff checks.

