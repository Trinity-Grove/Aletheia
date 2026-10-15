# ALET-B07 — Vitrine Curricular e Descoberta de Trilhas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expor modelos pedagógicos publicados em `/curriculum/explore`, filtrar por abordagem/faixa etária e adotá-los em um clique sem duplicar objetivos.

**Architecture:** Reutilizar o catálogo e o endpoint de aplicação de templates existentes. Enriquecer o DTO com metadados de descoberta, tornar a aplicação idempotente na transação atual e criar uma galeria frontend dedicada à descoberta, mantendo `/curriculum/packs` separado.

**Tech Stack:** NestJS, Prisma/PostgreSQL, Zod, TypeScript, Next.js App Router, React, Vitest, Testing Library, i18n via `useLocale`.

**Spec:** `docs/superpowers/specs/2026-10-14-alet-b07-curricular-discovery-design.md`

## Global Constraints

- Reutilizar a taxonomia educacional universal `EARLY_YEARS`, `PRIMARY`, `LOWER_SECONDARY`, `UPPER_SECONDARY`.
- Idade é recomendação/calibração; não criar uma nova dimensão curricular por país ou idade.
- Toda cópia nova do frontend deve usar `useLocale`; adicionar pt-BR, en-US e es-ES no mesmo commit.
- O JSX de `@aletheia/web` não deve usar utilitários Tailwind; usar componentes de `@aletheia/ui` e classes BEM/tokens CSS.
- Não criar entidade ou endpoint paralelo de adoção; usar `POST /families/:familyId/curriculum/templates/apply`.
- Não alterar a semântica de `CurriculumPack` ou o fluxo de `/curriculum/packs`.
- Validar fronteiras de família para aluno e ano antes de qualquer escrita.
- Manter `MAIN_NAV_ITEMS` apontando `curriculum` para `/curriculum`; descoberta e planejamento devem ter links explícitos de ida e volta.
- Props com callbacks novos devem usar sintaxe de método nas interfaces para evitar falsos positivos do scanner i18n.

## Review Focus

- Reaplicação da mesma trilha: deve retornar objetivos reutilizados sem duplicar registros — cobrir no teste de aplicação idempotente.
- Objetivo já concluído com o mesmo título: deve manter `status` e `achievedAt` — cobrir no teste de reuso.
- Faixa etária sobreposta: deve incluir trilhas cuja recomendação intersecta a idade filtrada — cobrir no teste da galeria.
- Catálogo com metadados ausentes ou inválidos: deve ser tratado sem derrubar a resposta inteira — cobrir no resolver e no teste de contrato.
- Família, aluno e ano inconsistentes: deve falhar antes da escrita — preservar/cobrir o teste de isolamento do repositório.
- Navegação: `/curriculum` permanece o destino principal e `/curriculum/explore` mantém o item de currículo ativo.
- UI: a galeria não pode criar overflow mobile, strings hardcoded ou classes Tailwind.

---

### Task 1: Contratos de descoberta e taxonomia

**Files:**
- Modify: `packages/contracts/src/pedagogical-model-definition.ts`
- Modify: `packages/contracts/src/pedagogical-model-definition.test.ts`
- Verify: `packages/contracts/src/educational-taxonomy.ts`

**Interfaces:**
- Produces `PedagogicalModelCatalogEntryDto` with `approach`, `recommendedAgeRange` and `educationalStages`.
- Produces schemas for the approach code and recommended age range.

- [ ] **Step 1: Write failing contract tests**

  Add cases for a valid entry with `min <= max` and canonical stages, and rejection of an inverted range, age below 3, age above 25 and unknown stage.

- [ ] **Step 2: Run the focused contract test**

  Run: `pnpm --filter @aletheia/contracts test -- pedagogical-model-definition.test.ts`

  Expected: FAIL because the discovery fields/schemas are not present.

- [ ] **Step 3: Implement the schemas and DTO fields**

  Extend the metadata/catalog schemas without removing `subjects`. Reuse `universalEducationalStageSchema` and keep the approach values aligned with the existing pedagogical model codes.

- [ ] **Step 4: Run the focused contract test again**

  Run: `pnpm --filter @aletheia/contracts test -- pedagogical-model-definition.test.ts`

  Expected: PASS.

- [ ] **Step 5: Commit**

  `git add packages/contracts/src/pedagogical-model-definition.ts packages/contracts/src/pedagogical-model-definition.test.ts && git commit -m "feat(contracts): add curriculum discovery metadata"`

### Task 2: Seed and resolve catalog metadata

**Files:**
- Modify: `apps/api/src/modules/curriculum/infrastructure/pedagogical-model-definition.seed-data.ts`
- Modify: `apps/api/src/modules/curriculum/infrastructure/pedagogical-model-definition.seeder.ts`
- Modify: `apps/api/src/modules/curriculum/infrastructure/pedagogical-model-definition.resolver.ts`
- Create: `apps/api/prisma/migrations/20261014120000_add_pedagogical_discovery_metadata/migration.sql`
- Modify/Test: `apps/api/src/modules/curriculum/infrastructure/pedagogical-model-definition.seed-data.spec.ts`
- Modify/Test: resolver-focused API test if the existing resolver suite is added during implementation

**Interfaces:**
- Consumes the schemas from Task 1.
- Produces catalog entries carrying stable approach, age and stage metadata.

- [ ] **Step 1: Add failing seed/resolver assertions**

  Assert that every baseline model has a valid recommended range, at least one canonical stage and an approach, and that the family-facing catalog returns those fields.

- [ ] **Step 2: Run focused API tests**

  Run: `pnpm --filter @aletheia/api test -- pedagogical-model-definition.seed-data.spec.ts`

  Expected: FAIL because the seed rows and resolver do not expose discovery metadata.

- [ ] **Step 3: Add explicit metadata to the seed rows**

  Keep `metadata.subjects` unchanged and add editorial values for all published models. Use the existing universal stages and age calibration; do not add country-specific stages.

- [ ] **Step 4: Add the migration**

  Merge the new JSON keys into `metadata` while preserving each row’s current `subjects`. Published catalog rows are versioned and immutable in this repository; do not use an in-place `UPDATE` of the existing published version. Create a new published version per affected `code`, copying the existing columns and using `metadata || jsonb_build_object(...)` (or the equivalent safe JSONB merge). Preserve the previous version and ensure the migration does not create a second duplicate version if the target version already exists.

  The SQL must be reviewed against `schema.prisma` and existing migration conventions before execution. The seed must continue producing the same metadata shape for fresh installations.

- [ ] **Step 5: Update the resolver**

  Parse the metadata with safe defaults. Return the enriched fields in `listPublishedCatalog()` while keeping malformed optional metadata from crashing the entire catalog response.

- [ ] **Step 6: Run focused API tests**

  Run: `pnpm --filter @aletheia/api test -- pedagogical-model-definition.seed-data.spec.ts`

  Expected: PASS.

- [ ] **Step 7: Commit**

  `git add apps/api/src/modules/curriculum/infrastructure apps/api/prisma/migrations && git commit -m "feat(api): expose curriculum discovery metadata"`

### Task 3: Make template adoption idempotent

**Files:**
- Modify: `apps/api/src/modules/curriculum/infrastructure/curriculum.repository.ts`
- Modify: `apps/api/src/modules/curriculum/application/curriculum.service.ts`
- Modify/Test: `apps/api/src/modules/curriculum/application/curriculum.service.spec.ts`
- Modify/Test: `apps/api/src/modules/curriculum/infrastructure/curriculum.repository.spec.ts`

**Interfaces:**
- Consumes `ApplyCurriculumTemplateDto` unchanged.
- Returns `{ subjectsCount, objectivesCount, reusedObjectivesCount, subjectRelevance? }`.

- [ ] **Step 1: Add failing service/repository tests**

  Cover: first application creates objectives; second application returns zero new objectives and a positive reuse count; an existing achieved objective with the same family/learner/year/subject/title keeps its status and timestamp.

- [ ] **Step 2: Run focused API tests**

  Run: `pnpm --filter @aletheia/api test -- curriculum.service.spec.ts curriculum.repository.spec.ts`

  Expected: FAIL because repeated application currently inserts every starter objective.

- [ ] **Step 3: Implement idempotent objective insertion**

  In the existing transaction, query by family, learner, academic year, subject and exact title before creating. Increment `reusedObjectivesCount` when found; never reset an existing objective’s status or achieved timestamp. Preserve the existing subject reuse behavior and plan upsert.

- [ ] **Step 4: Update service typing and response tests**

  Keep `subjectRelevance` behavior unchanged and make `reusedObjectivesCount` available whether or not relevance data exists.

- [ ] **Step 5: Run focused API tests**

  Run: `pnpm --filter @aletheia/api test -- curriculum.service.spec.ts curriculum.repository.spec.ts`

  Expected: PASS.

- [ ] **Step 6: Commit**

  `git add apps/api/src/modules/curriculum/application apps/api/src/modules/curriculum/infrastructure && git commit -m "fix(api): make curriculum trail adoption idempotent"`

### Task 4: Add the discovery page and gallery

**Files:**
- Create: `apps/web/app/(dashboard)/curriculum/explore/page.tsx`
- Create: `apps/web/src/components/curriculum/curriculum-explore-gallery.tsx`
- Create/Test: `apps/web/tests/curriculum-explore.test.tsx`
- Modify: `apps/web/src/components/curriculum/curriculum-view.tsx`
- Modify: `apps/web/src/components/layout/product-shell.tsx`

**Interfaces:**
- `CurriculumExploreGalleryProps` deve usar callbacks em sintaxe de método:
  ```ts
  export interface CurriculumExploreGalleryProps {
    familyId: string;
    learners: LearnerSummaryDto[];
    academicYears: AcademicYearResponseDto[];
    onAdopt?(templateCode: string): Promise<void> | void;
  }
  ```
- Uses the catalog GET and existing template-apply POST.

- [ ] **Step 1: Write failing frontend tests**

  Test catalog rendering, approach filter, age-range intersection, POST payload, success summary, error recovery and missing-selection behavior.

- [ ] **Step 2: Run the focused frontend test**

  Run: `pnpm --filter @aletheia/web test -- curriculum-explore.test.tsx`

  Expected: FAIL because the route and gallery do not exist.

- [ ] **Step 3: Implement the page data boundary**

  Follow the existing curriculum page pattern for family, learners and academic years. Default to the first learner and current academic year, and pass the resolved context to the gallery.

- [ ] **Step 4: Implement the gallery**

  Fetch the family-facing catalog, derive filter options from returned metadata, filter by approach and age overlap, render cards with `@aletheia/ui` and BEM/token CSS (no Tailwind), and call the existing apply endpoint with the selected learner/year/template code. Keep all copy localized and avoid JS-driven breakpoints.

- [ ] **Step 5: Add navigation entry points**

  Keep `MAIN_NAV_ITEMS` item `curriculum` pointing to `/curriculum` so the existing ProductShell contract and planning access remain intact. Add a localized “Currículos & Trilhas” CTA/aba from `/curriculum`, a clear “Meu planejamento” link back from `/curriculum/explore`, and make `/curriculum/explore` keep the curriculum nav item active. Extend `product-shell.test.tsx` for this route-family behavior.

- [ ] **Step 6: Run the focused frontend test**

  Run: `pnpm --filter @aletheia/web test -- curriculum-explore.test.tsx`

  Expected: PASS.

- [ ] **Step 7: Commit**

  `git add "apps/web/app/(dashboard)/curriculum/explore" apps/web/src/components/curriculum apps/web/src/components/layout/product-shell.tsx apps/web/tests/curriculum-explore.test.tsx && git commit -m "feat(web): add curriculum discovery showcase"`

### Task 5: Add localized copy and regression coverage

**Files:**
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/curriculum.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/curriculum.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/curriculum.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/nav.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/nav.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/nav.ts`
- Modify/Test: existing curriculum navigation and page tests as needed

**Interfaces:**
- Provides every label, filter option, state, CTA, error and adoption summary used by Task 4.

- [ ] **Step 1: Add all three locale dictionaries**

  Include page title/subtitle, approach filter, age filter, card labels, adoption states, selection guidance, success/error messages and navigation labels. Do not leave a new user-visible string in JSX.

- [ ] **Step 2: Add translation regression assertions**

  Render the gallery under `pt-BR`, `en-US` and `es-ES`, or extend the existing locale test to ensure the route does not fall back to a missing key. Add every key to all three dictionaries in the same change.

- [ ] **Step 3: Run focused frontend tests**

  Run: `pnpm --filter @aletheia/web test -- curriculum-explore.test.tsx curriculum.test.tsx`

  Expected: PASS.

- [ ] **Step 4: Run the i18n audit**

  Run: `pnpm audit:i18n`

  Expected: 100% coverage with no new hardcoded user-visible strings.

- [ ] **Step 5: Commit**

  `git add apps/web/src/lib/i18n/dictionaries apps/web/tests && git commit -m "feat(web): localize curriculum discovery"`

### Task 6: Full verification and handoff

**Files:**
- No product files; review all changes and generated Prisma artifacts.

- [ ] **Step 1: Inspect the diff and route/file inventory**

  Run: `git diff --check` and `git status --short`.

  Expected: no whitespace errors; only B07 files and its migration/docs are changed.

- [ ] **Step 2: Run focused contract/API/frontend suites**

  Run: `pnpm --workspace-concurrency=1 test -- curriculum-explore.test.tsx curriculum.service.spec.ts curriculum.repository.spec.ts pedagogical-model-definition.test.ts`

  Expected: exit code 0 with no failed tests.

  Also run: `pnpm --filter @aletheia/web test -- product-shell.test.tsx curriculum-explore.test.tsx`

  Expected: `/curriculum` remains the primary navigation href and `/curriculum/explore` marks the curriculum item active.

- [ ] **Step 3: Run repository quality gates**

  Run: `pnpm --workspace-concurrency=1 lint`

  Run: `pnpm --workspace-concurrency=1 typecheck`

  Expected: all packages pass.

  Run: `pnpm audit:i18n`

  Expected: 100% coverage with no hardcoded strings introduced.

  Run: `pnpm check:boundaries`

  Expected: no module-boundary regressions.

- [ ] **Step 4: Review acceptance criteria manually**

  Verify `/curriculum/explore` is reachable from navigation, both filters work, adoption sends the right learner/year/template, repeated adoption does not duplicate objectives, and mobile cards do not overflow.

- [ ] **Step 5: Commit the final verification adjustments**

  Use a focused commit only if tests or docs require a correction; otherwise leave the implementation commits intact for review.

## Self-review checklist

- [x] Spec coverage: route, filters, adoption, no-duplication, taxonomy, i18n, responsive behavior and tests each have an owning task.
- [x] Type consistency: the catalog DTO fields and apply response are named once and reused by the API/frontend tasks.
- [x] Scope: no new marketplace, pack rewrite or separate trail entity.
- [x] Review focus: all five likely failure modes have explicit tests in the owning task.
- [x] Navigation: `/curriculum` remains the primary planning route; discovery is linked without breaking existing ProductShell tests.
- [x] Migration safety: published pedagogical model versions are not mutated in place; JSONB is merged into a new version preserving `subjects`.
- [x] Frontend governance: no Tailwind JSX, callback props use method syntax, and all copy is symmetric across three locales.
- [x] Handoff: implementation must wait for validation of this design/plan and then use `superpowers:executing-plans` or `superpowers:subagent-driven-development`.
