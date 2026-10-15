# Implementation plan: AI lesson draft grounding explainability

## Task 1 — Contract-first grounding value objects

Files:

- `packages/contracts/src/ai.ts`
- `packages/contracts/src/ai.test.ts`

RED: add tests for the four source types, positive versions, required safe labels, deterministic array shape, and response compatibility when `groundingContext` is absent/present.

GREEN: add `aiGroundingSourceSchema`, `aiGroundingContextSchema`, DTO types, and the optional response property. Keep source type values closed and do not accept arbitrary provider text.

Verify with the focused contracts test.

## Task 2 — Persist the server-generated snapshot

Files:

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20261015130000_add_ai_grounding_context/migration.sql`
- `apps/api/src/modules/ai/infrastructure/ai-suggestion.repository.ts`
- `apps/api/src/modules/ai/infrastructure/ai-suggestion.repository.spec.ts` (or the existing repository test location)

RED: assert repository creation writes `groundingContext` and legacy/null input maps to Prisma JSON null.

GREEN: add nullable `groundingContext Json? @map("grounding_context")`, additive migration, repository input field, and persistence mapping. Do not rewrite existing catalog context.

Verify Prisma generation and focused repository tests.

## Task 3 — Assemble provenance in the application service

Files:

- `apps/api/src/modules/ai/application/ai-suggestion.service.ts`
- `apps/api/src/modules/ai/application/ai-suggestion.service.spec.ts`

RED: add tests proving sources are emitted only for records actually loaded, are ordered deterministically, contain no profile metadata/PII, and are passed unchanged to the repository and response. Add a legacy-path test with an empty source list.

GREEN: create a local server-side source builder from the already loaded domain/profile/activity rows. Use definition code/version/name and profile stable code/version only. Persist and return the same snapshot; never derive it from LLM output.

Verify focused AI tests and existing output-validation tests.

## Task 4 — Explain grounding in the web review step

Files:

- `apps/web/src/components/lessons/ai-lesson-draft-modal.tsx`
- `apps/web/src/lib/i18n/dictionaries/pt-BR/lessons.ts`
- `apps/web/src/lib/i18n/dictionaries/en-US/lessons.ts`
- `apps/web/src/lib/i18n/dictionaries/es-ES/lessons.ts`
- `apps/web/tests/ai-lesson-draft-modal.test.tsx`

RED: add a UI test for multiple sources and for a response without grounding.

GREEN: store the response context, render a compact translated list in review, and show a neutral fallback when no grounding sources exist. Preserve existing catalog context display and all data-testid selectors.

Verify focused web tests and i18n coverage.

## Task 5 — Full validation and delivery

- Run `git diff --check`, contracts/API/web suites, typecheck, lint, boundaries, i18n audit, and API build.
- Commit as `feat(ai): explain lesson draft grounding`.
- Push `feat/alet-352-ai-grounding`.
- Open a PR with `Closes #352` in plain text.
- Monitor all CI gates; correct failures before merge.
- Merge only when every check is green and verify the issue closes.
