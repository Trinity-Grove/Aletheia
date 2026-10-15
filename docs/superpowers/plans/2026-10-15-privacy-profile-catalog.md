# Plan — ALET-248 privacy profile catalog

## Task 1 — Lock the compatibility boundary

- Add tests proving the current regime resolver remains unchanged.
- Add tests for the new profile resolver and fallback behavior.

## Task 2 — Add the profile catalog

- Define stable profile codes and metadata in `packages/contracts`.
- Use lookup tables/sets instead of country conditionals in the resolver.
- Export the new types and resolver from the contracts index.

## Task 3 — Verify and document the boundary

- Run contracts tests and build.
- Run API typecheck because the consent service consumes the existing resolver.
- Run i18n/boundary checks and `git diff --check`.
- Keep the PR scoped to the first ALET-248 slice; do not close the epic.

