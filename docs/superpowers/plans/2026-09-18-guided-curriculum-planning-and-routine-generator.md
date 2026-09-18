# Guided Curriculum Planning & Smart Routine Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Aletheia from an open-ended database CRUD into a guided pedagogical companion with a 3-step planning wizard, sequenced learning blocks with "how-to-teach" practical guides, and 1-click intelligent weekly routine generation.

**Architecture:** Add domain schemas in `@aletheia/contracts` for learning blocks, pedagogical guides, and routine suggestion. Implement deterministic pedagogical scheduling engine (`RoutineGeneratorService`) in `apps/api/src/modules/lessons`. Build interactive 3-step `CurriculumPlanningWizardModal`, `CurriculumPackDetailModal`, and smart routine generation UI in `apps/web`.

**Tech Stack:** TypeScript, NestJS, Prisma, Next.js (App Router), React, Tailwind CSS, Vitest, Jest.

**Spec:** [`docs/superpowers/specs/2026-09-18-guided-curriculum-planning-and-routine-generator-design.md`](file:///C:/Users/wende/Projects/Covenant-Grove/Aletheia/docs/superpowers/specs/2026-09-18-guided-curriculum-planning-and-routine-generator-design.md)

## Global Constraints
- Zero AI-attribution trailers (`Co-Authored-By`, `Generated-By`, etc.) in commits, PRs, or comments.
- Multi-tenant strict isolation: every routine slot and curriculum plan is scoped to `familyId`.
- Strictly follow TDD: write failing test, verify failure, implement minimal code, verify pass.
- 100% test pass rate before pull request and squash merge.

---

### Task 1: Contratos e Schemas Zod (`@aletheia/contracts`)

**Files:**
- Create: `packages/contracts/src/routine-generator.ts`
- Create: `packages/contracts/src/routine-generator.test.ts`
- Modify: `packages/contracts/src/pedagogical-model-definition.ts`
- Modify: `packages/contracts/src/index.ts`

**Interfaces:**
- Produces:
  - `pedagogicalGuideSchema`, `learningBlockSchema`, `LearningBlockDto`
  - `suggestRoutineInputSchema`, `SuggestRoutineInputDto`
  - `suggestedRoutineSlotSchema`, `SuggestedRoutineSlotDto`
  - `suggestedRoutineResponseSchema`, `SuggestedRoutineResponseDto`
  - `applySuggestedRoutineSchema`, `ApplySuggestedRoutineDto`
  - Updated `pedagogicalModelCatalogEntrySchema` with optional `subjects?: TemplateSubjectDefinition[]`

- [ ] **Step 1: Write failing unit tests for new schemas in `routine-generator.test.ts`**
- [ ] **Step 2: Implement schemas in `routine-generator.ts` and export from `index.ts`**
- [ ] **Step 3: Update `pedagogicalModelCatalogEntrySchema` to include optional subjects array**
- [ ] **Step 4: Run tests: `pnpm --filter @aletheia/contracts test`**
- [ ] **Step 5: Commit changes: `feat(contracts): add schemas for routine generator and learning blocks`**

---

### Task 2: Motor de Sugestão de Rotina Semanal (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/lessons/application/routine-generator.service.ts`
- Create: `apps/api/src/modules/lessons/application/routine-generator.service.spec.ts`
- Modify: `apps/api/src/modules/lessons/presentation/schedule.controller.ts`
- Create: `apps/api/src/modules/lessons/presentation/schedule.controller.spec.ts`
- Modify: `apps/api/src/modules/lessons/lessons.module.ts`
- Modify: `apps/api/src/modules/curriculum/infrastructure/pedagogical-model-definition.resolver.ts`

**Interfaces:**
- Consumes:
  - `SuggestRoutineInputDto`, `ApplySuggestedRoutineDto`
  - `SubjectRepository`, `ScheduleRepository`
- Produces:
  - `POST /api/v1/families/:familyId/schedule/suggest-routine` -> `SuggestedRoutineResponseDto`
  - `POST /api/v1/families/:familyId/schedule/apply-suggested-routine` -> `ScheduleSlotResponseDto[]`
  - Catalog entries with `subjects` in `templates/catalog`

- [ ] **Step 1: Write failing unit tests for `RoutineGeneratorService`**
- [ ] **Step 2: Implement `RoutineGeneratorService` with cognitive pacing, devotional slot, and pedagogical model adjustments**
- [ ] **Step 3: Implement endpoints in `ScheduleController` with `FamilyTenantGuard`**
- [ ] **Step 4: Update `PedagogicalModelDefinitionResolver` to return subjects in template catalog**
- [ ] **Step 5: Run tests: `pnpm --filter @aletheia/api test src/modules/lessons`**
- [ ] **Step 6: Commit changes: `feat(api): implement routine generator service and schedule endpoints`**

---

### Task 3: Transparência em Pacotes Curriculares & Modelos Pedagógicos (`apps/web`)

**Files:**
- Create: `apps/web/src/components/curriculum/curriculum-pack-detail-modal.tsx`
- Modify: `apps/web/src/components/curriculum/curriculum-packs-gallery.tsx`
- Modify: `apps/web/src/components/curriculum/template-modal.tsx`
- Create: `apps/web/tests/curriculum-pack-detail.test.tsx`

**Interfaces:**
- Consumes:
  - `CurriculumPackResponseDto`, `PedagogicalModelCatalogEntryDto`
- Produces:
  - `CurriculumPackDetailModal` showing full description, pillars, estimated lessons, and target stages
  - "Conhecer Pacote 🔍" button on gallery cards
  - Expandable subject and starter objective preview inside `TemplateModal`

- [ ] **Step 1: Write failing tests in `apps/web/tests/curriculum-pack-detail.test.tsx`**
- [ ] **Step 2: Implement `CurriculumPackDetailModal` and integrate into `CurriculumPacksGallery`**
- [ ] **Step 3: Update `TemplateModal` to show expandable subjects and starter objectives**
- [ ] **Step 4: Run tests: `pnpm --filter @aletheia/web test tests/curriculum-pack-detail.test.tsx tests/curriculum-packs.test.tsx`**
- [ ] **Step 5: Commit changes: `feat(web): add pack detail modal and expandable subjects preview in template modal`**

---

### Task 4: Assistente de Planejamento Familiar Guiado (Setup 3 Passos) (`apps/web`)

**Files:**
- Create: `apps/web/src/components/curriculum/curriculum-planning-wizard-modal.tsx`
- Modify: `apps/web/app/(dashboard)/curriculum/page.tsx`
- Modify: `apps/web/src/components/lessons/weekly-routine-grid.tsx`
- Create: `apps/web/tests/curriculum-planning-wizard.test.tsx`

**Interfaces:**
- Consumes:
  - `suggest-routine` and `apply-suggested-routine` endpoints
  - `curriculum/templates/apply`
- Produces:
  - 3-step interactive setup wizard (Filosofia -> Blocos & Método -> Rotina Inteligente 1-clique)
  - Banner on empty routine grid to generate weekly schedule with 1 click

- [ ] **Step 1: Write failing tests in `apps/web/tests/curriculum-planning-wizard.test.tsx`**
- [ ] **Step 2: Implement `CurriculumPlanningWizardModal`**
- [ ] **Step 3: Integrate wizard trigger into `/curriculum` header and `/schedule` routine grid**
- [ ] **Step 4: Run tests: `pnpm --filter @aletheia/web test tests/curriculum-planning-wizard.test.tsx`**
- [ ] **Step 5: Commit changes: `feat(web): add 3-step guided curriculum planning wizard and routine generation`**

---

### Task 5: Validação Completa, Regressão, PR e Merge

- [ ] **Step 1: Run full test suite: contracts, api, web**
- [ ] **Step 2: Push branch to remote origin**
- [ ] **Step 3: Open PR using `gh pr create`**
- [ ] **Step 4: Squash merge PR using `gh pr merge --squash --delete-branch`**
- [ ] **Step 5: Clean up worktree, prune, update `main`**
