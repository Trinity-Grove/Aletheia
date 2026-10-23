# Trivium Path Discovery and Adoption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish the Trivium Grammar, Logic, and Rhetoric paths and let family educators adopt each path for a specific learner and academic year through the curriculum explorer.

**Architecture:** Add the three paths to the existing LearningDomain → LearningPath → Competency catalog using the established boot seeder. Keep existing family-wide selection records/API intact and add learner/year-scoped selection persistence with tenant ownership checks. Extend the current curriculum explorer to consume the published catalog and the learner/year selection endpoints, localizing all display copy in the frontend dictionaries.

**Tech Stack:** NestJS, Prisma/PostgreSQL, Zod contracts, React/Next.js, `@aletheia/ui`, Vitest/Jest, pnpm monorepo.

**Spec:** `docs/superpowers/specs/2026-10-23-trivium-path-discovery-design.md`

## Global Constraints

- Use only `EARLY_YEARS`, `PRIMARY`, `LOWER_SECONDARY`, and `UPPER_SECONDARY` for educational stages; age guidance is advisory.
- Preserve the existing family-wide path selection endpoints and records; do not reinterpret old selections.
- Do not create learner objectives or alter progress as a side effect of adoption.
- Family reads/writes must be tenant-scoped; learner and academic-year ownership must be verified against the route family.
- Add matching user-facing translation keys to pt-BR, en-US, and es-ES; no hardcoded UI strings or Tailwind classes in JSX.
- Seeding must use `DefinitionsService`, stable codes, and idempotent create/publish behavior.

## Review Focus

1. Duplicate or already-published catalog codes: seeder must skip matching published definitions and never create duplicate definitions.
2. Cross-family learner or academic-year IDs: selection API must reject before reading or writing selections.
3. Empty learner/year context: UI must disable adoption and explain what setup is missing.
4. Existing family-wide selections/API consumers: retain their behavior and response contract.
5. Locale/mobile cases: all three locales render translated copy and the explorer remains usable without horizontal overflow on narrow screens.

---

## File map

- `apps/api/src/modules/curriculum/infrastructure/trivium-formation.seed-data.ts`: stable Trivium domain/path/competency catalog data and DTO builders.
- `packages/contracts/src/curriculum-path-skill-definitions.ts`: preserve advisory age guidance on path metadata.
- `apps/api/src/modules/curriculum/infrastructure/trivium-formation.seeder.ts`: idempotent creation/publication through `DefinitionsService`.
- `apps/api/prisma/schema.prisma` and a new timestamped migration: learner/year path selection model and relations.
- `packages/contracts/src/learner-learning-path-selection.ts` and `learning-path-explorer.ts`: request/response schemas for learner/year selection and family-facing published catalog.
- `apps/api/src/modules/curriculum/infrastructure/learner-learning-path-selection.repository.ts`: published catalog query, ownership validation, selection persistence.
- `apps/api/src/modules/curriculum/application/learner-learning-path-selection.service.ts`: contract mapping and not-found behavior.
- `apps/api/src/modules/curriculum/presentation/curriculum.controller.ts`: family-facing catalog and learner/year selection routes guarded by existing family guards.
- `apps/web/src/components/curriculum/curriculum-explore-gallery.tsx`: preserve model-template flow and add a Trivium paths section with selected learner/year state.
- `apps/web/app/globals.css`: responsive styles for the added path section using current tokens/BEM.
- `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/curriculum.ts`: all labels and Trivium catalog display copy.
- Adjacent API and web test files, `apps/api/src/main.ts`, `apps/api/src/modules/curriculum/curriculum.module.ts`, `apps/api/package.json`, and `packages/contracts/src/index.ts`: registration, seeding, exports, and behavior tests.

## Task 1: Add the Trivium catalog seed data

**Files:**
- Create: `apps/api/src/modules/curriculum/infrastructure/trivium-formation.seed-data.ts`
- Test: `apps/api/src/modules/curriculum/infrastructure/trivium-formation.seed-data.spec.ts`
- Modify: `packages/contracts/src/curriculum-path-skill-definitions.ts`
- Test: `packages/contracts/src/educational-taxonomy.test.ts`

**Interfaces:**
- Produce `buildTriviumFormationSeedData()` with one domain `CLASSICAL_EDUCATION`, paths `TRIVIUM.GRAMMAR`, `TRIVIUM.LOGIC`, `TRIVIUM.RHETORIC`, and at least three distinct competencies per path.
- Produce DTO builders accepting `domainId` and `pathId`, validated with existing `createLearningDomainSchema`, `createLearningPathSchema`, and `createCompetencyDefinitionSchema`.

- [x] Write tests asserting stable codes, universal stage codes only, advisory age metadata, distinct competencies/objectives for all three paths, and valid schema output.
- [x] Add a contract test that `createLearningPathSchema` retains a path-level `metadata.ageRecommendation` object.
- [x] Run `pnpm --filter @aletheia/api exec jest --runInBand src/modules/curriculum/infrastructure/trivium-formation.seed-data.spec.ts`; confirmed expected missing-module failure.
- [x] Run `pnpm --filter @aletheia/contracts exec vitest run src/educational-taxonomy.test.ts --pool=threads --poolOptions.threads.singleThread`; confirmed the advisory age metadata test failed because the existing schema stripped that field.
- [x] Implement the seed-data module with three unique paths and distinct starter objectives.
- [x] Extend `learningPathMetadataSchema` with the shared competency age-recommendation schema.
- [x] Run the targeted Jest test and confirmed 2 tests pass.
- [x] Build `@aletheia/contracts` and rerun the contract test; confirmed all 5 cases pass.

## Task 2: Add an idempotent published-catalog seeder

**Files:**
- Create: `apps/api/src/modules/curriculum/infrastructure/trivium-formation.seeder.ts`
- Test: `apps/api/src/modules/curriculum/infrastructure/trivium-formation.seeder.spec.ts`
- Modify: `apps/api/src/modules/curriculum/curriculum.module.ts`
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/package.json`
- Create: `apps/api/src/scripts/seed-trivium-formation.ts`

**Interfaces:**
- `TriviumFormationSeeder.seed(): Promise<void>` uses `DefinitionsService` and the seed data from Task 1.
- Register the seeder under the stable boot migration code `trivium-formation` and manual command `seed:trivium-formation`.

- [x] Write seeder tests for first insert/publish, rerun with already published records, partial existing catalog without duplicate codes, and existing drafts.
- [x] Run the targeted seeder spec and confirm the missing seeder fails as expected.
- [x] Implement idempotent domain→paths→competencies creation and publication; existing published records remain untouched.
- [x] Register the provider and boot/manual seed entry points.
- [x] Run the seeder spec and confirm all 4 tests pass.

## Task 3: Add learner/year selection contracts and persistence

**Files:**
- Create: `packages/contracts/src/learner-learning-path-selection.ts`
- Create: `packages/contracts/src/learning-path-explorer.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_add_learner_learning_path_selections/migration.sql`
- Create: `apps/api/src/modules/curriculum/infrastructure/learner-learning-path-selection.repository.ts`
- Create: `apps/api/src/modules/curriculum/infrastructure/learner-learning-path-selection.repository.spec.ts`

**Interfaces:**
- `UpsertLearnerLearningPathSelectionDto`: `{ enabled: boolean }`.
- `LearnerLearningPathSelectionResponseDto`: selection id, familyId, learnerId, academicYearId, pathId, enabled, timestamps, and path code/name/version/status.
- `LearningPathExplorerCatalogEntryDto`: published path id/code/version/name/description/metadata, ordered competency code/title/metadata, and `selected` boolean.
- Prisma model `LearnerLearningPathSelection` has a unique key `(familyId, learnerId, academicYearId, pathId)` and relations to family, learner, academic year, and path.
- Repository methods: `listPublishedCatalog(familyId, learnerId, academicYearId)` and `upsert(familyId, learnerId, academicYearId, pathId, enabled)`.

- [ ] Write contract tests for valid enabled/disabled payloads, response shape, and catalog entries with selected state.
- [ ] Write repository tests for published catalog ordering/latest versions, independent state per learner/year, idempotent upsert, unknown/unpublished path rejection, and learner/year ownership mismatch.
- [ ] Run contract and repository specs; confirm failures match missing schema/model/repository behavior.
- [ ] Add Zod schemas and exports; add Prisma model, relations, and additive migration; implement repository queries scoped by family, learner, and year.
- [ ] Generate Prisma client with the repository's established command, then run targeted contract/repository tests.

## Task 4: Add family-protected API routes

**Files:**
- Create: `apps/api/src/modules/curriculum/application/learner-learning-path-selection.service.ts`
- Create: `apps/api/src/modules/curriculum/application/learner-learning-path-selection.service.spec.ts`
- Modify: `apps/api/src/modules/curriculum/presentation/curriculum.controller.ts`
- Modify: `apps/api/src/modules/curriculum/curriculum.module.ts`
- Test: `apps/api/src/modules/curriculum/presentation/curriculum.controller.spec.ts` (or the existing adjacent controller test)

**Interfaces:**
- `GET /families/:familyId/curriculum/paths/catalog?learnerId=:id&academicYearId=:id` returns published paths plus selected state for that learner/year.
- `PUT /families/:familyId/curriculum/paths/:pathId/learners/:learnerId/academic-years/:academicYearId/selection` accepts `{ enabled: boolean }` and returns the selection response.
- `LearnerLearningPathSelectionService.listCatalog(familyId, learnerId, academicYearId)` and `.upsert(familyId, learnerId, academicYearId, pathId, dto)`.

- [ ] Write service/controller tests for route mapping, missing/unpublished path behavior, family ownership errors, and that legacy `/paths/selections` and `/paths/:pathId/selection` remain available unchanged.
- [ ] Run targeted specs and confirm expected failures.
- [ ] Implement DTO mapping, ownership checks, route decorators, Zod validation, provider registration, and permission metadata (`manage_curriculum` on mutation).
- [ ] Run targeted API specs and confirm they pass.

## Task 5: Extend the curriculum explorer UI

**Files:**
- Modify: `apps/web/src/components/curriculum/curriculum-explore-gallery.tsx`
- Modify: `apps/web/app/(dashboard)/curriculum/explore/page.tsx` only if loading context needs adjustment
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/tests/curriculum-explore-gallery.test.tsx`

**Interfaces:**
- Keep current pedagogical template adoption and filters intact.
- Add a visible section/tab for Trivium paths, fetching the new API catalog whenever `familyId`, learner, or academic year changes.
- Adopt/unadopt via the new learner/year API; selected state is scoped to the chosen context and is refreshed after mutation.

- [ ] Write UI tests for showing all three API paths, changing learner/year refreshes state, adopting one path updates only that context, no-learner/no-year disabled states, loading/error/empty states, and preserving template flow.
- [ ] Run the targeted Vitest file and confirm expected failures.
- [ ] Implement the section with existing `@aletheia/ui` components, semantic labels, visible selected state, and accessible status feedback.
- [ ] Add mobile-first BEM CSS; ensure selector/card stacking and no horizontal overflow at 320px.
- [ ] Run targeted UI tests and confirm they pass.

## Task 6: Localize catalog copy and finish integration checks

**Files:**
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/curriculum.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/curriculum.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/curriculum.ts`
- Relevant: `apps/api/prisma/schema.prisma`, API/controller tests, web explorer tests, and package scripts

- [ ] Add matching translation keys for headings, path names/descriptions, competencies/objectives shown in UI, learner/year context, advisory age/stage copy, mutation feedback, and all loading/empty/error states.
- [ ] Add or update locale parity test assertions for all three dictionaries.
- [ ] Run API focused specs, contracts tests, web focused tests, i18n audit, Prisma validation, and relevant typechecks using repository commands.
- [ ] Review the diff against every acceptance criterion in the spec; confirm existing family-wide selections and template adoption remain unchanged.
- [ ] Commit in coherent slices after each independently passing task.
