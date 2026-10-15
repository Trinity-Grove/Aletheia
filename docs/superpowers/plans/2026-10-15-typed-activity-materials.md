# Implementation plan: typed activity materials

## Task 1 — Contract RED/GREEN

Files: `packages/contracts/src/activity-definition.ts`, `packages/contracts/src/activity-definition.test.ts`.

Add a failing response test for populated and absent materials, then add `materials: z.array(z.string()).default([])` to the response schema without changing the create input shape.

## Task 2 — Application mapping RED/GREEN

Files: `apps/api/src/modules/curriculum/application/definitions.service.ts`, `apps/api/src/modules/curriculum/application/definitions.service.spec.ts`.

Add failing tests proving the typed field is copied from valid `metadata.materials` and falls back to `[]` for legacy or malformed metadata. Implement a small pure extractor and use it in `toActivityDefinitionDto`.

## Task 3 — Verification and delivery

Run focused contract/service tests, then i18n audit, boundaries, lint, typecheck, API build, full contracts/web/API suites, and `git diff --check`. Commit as `feat(curriculum): expose typed activity materials`, push branch `feat/alet-354-activity-materials`, open a PR with `Closes #354`, and merge only after all remote gates pass.
