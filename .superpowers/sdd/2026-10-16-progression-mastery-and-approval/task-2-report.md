# Task 2 report: deterministic rubric gate evaluation

## Status

Implemented and committed only Task 2 production code and tests. Existing uncommitted spec/plan edits were left untouched and excluded from the commit.

## TDD evidence

- RED: `pnpm --filter @aletheia/api test -- --runInBand apps/api/src/modules/curriculum/application/progression.service.spec.ts` — 9 new rubric cases failed with the expected `Unsupported progression policy type`; existing `EVIDENCE_COUNT` cases passed.
- GREEN: same command — 23/23 unit tests passed, including evidence + rubric AND gates, exact rubric version, criteria completeness, duplicate/extra/missing/out-of-range/below-threshold scores, unmet prerequisite blocking, approval waiting, and legacy `EVIDENCE_COUNT` behavior.
- Integration coverage added to `progression.integration-spec.ts` and `automatic-achievement.integration-spec.ts` for exact-version/latest assessment behavior and achievement reconciliation only after objective gates pass.

## Verification

- `pnpm --filter @aletheia/api typecheck` — passed.
- Targeted ESLint for the six changed TypeScript files — passed.
- `git diff --check` — passed.
- Integration command: `pnpm --filter @aletheia/api test:integration --runTestsByPath test/progression.integration-spec.ts test/automatic-achievement.integration-spec.ts` — blocked by unavailable PostgreSQL. `Test-NetConnection localhost -Port 5432` returned `TcpTestSucceeded: False`; test registration receives HTTP 500 before reaching the changed code. The integration tests therefore remain unverified locally.

## Implementation notes / self-review

- `ProgressionReader` now reads the exact rubric definition and latest assessment for the exact family, learner, rubric ID, and rubric version. The repository orders by `createdAt DESC, id DESC` inside the existing transaction snapshot.
- Every rubric criterion must occur exactly once and meet its own threshold on its native scale. Invalid rule coverage or rubric metadata fails closed; absent/invalid assessment does not pass the objective gate.
- Prerequisites remain AND gates. Approval-required policy returns `AWAITING_APPROVAL`; only the evaluator's optional internal `approvalGranted` input can advance it, and the public query contract remains unchanged. Task 3 must supply that value only from trusted persisted approval events.
- Achievement reconciliation calls the same evaluator and now understands prerequisites in either supported policy type. `EVIDENCE_COUNT` rules and behavior remain unchanged.

## Concerns / follow-up

- Real-Postgres integration verification is outstanding until a test database is available.
- As specified, recording a new assessment does not itself invoke achievement reconciliation; this task preserves the existing validation-triggered reconciliation path. A later task should ensure newly recorded assessment results trigger reconciliation when all evidence is already validated.
- Approval-event persistence/authorization and authenticated assessor attribution remain explicitly out of scope for Task 2.
