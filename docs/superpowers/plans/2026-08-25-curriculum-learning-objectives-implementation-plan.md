# Curriculum, Pedagogical Frameworks & Learning Objectives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Plan 05: Curriculum, Pedagogical Frameworks & Learning Objectives in Aletheia, supporting academic years, subject management, pedagogical approaches (Classical, Charlotte Mason, Traditional, Unit Studies, Custom), customizable learning objectives with progress tracking, and full web management interfaces.

**Architecture:** A domain-driven `@modules/curriculum` module in NestJS with `CurriculumService`, `ObjectiveService`, and strict modular boundaries (`CURRICULUM_PUBLIC_API`). Multi-tenant authorization enforced by `FamilyTenantGuard`. The web frontend provides a `/curriculum` page with academic year filter, subject cards, objective drawers, and template accelerators.

**Tech Stack:** TypeScript 5.9, NestJS 11, Fastify, Prisma 6, PostgreSQL, Zod, Vitest, Jest, Next.js 16, React 19, Playwright.

## Global Constraints
- Modular boundaries: external modules only import from `apps/api/src/modules/curriculum/application/public-api.js`.
- Security: All curriculum endpoints require `JwtAuthGuard` and `FamilyTenantGuard`.
- NodeNext module resolution with `.js` specifiers in imports.
- Non-breaking schema additions with clean migrations.

---

### Task 1: Contracts and Database Schema for Curriculum & Learning Objectives

**Files:**
- Create: `packages/contracts/src/curriculum.ts`
- Modify: `packages/contracts/src/index.ts`
- Test: `packages/contracts/src/curriculum.test.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/0005_curriculum/migration.sql`

**Interfaces:**
- Produces:
  - Enums: `PedagogicalFramework`, `ObjectiveStatus`.
  - DTOs: `CreateAcademicYearDto`, `AcademicYearResponseDto`, `CreateSubjectDto`, `UpdateSubjectDto`, `SubjectResponseDto`, `UpsertLearnerPlanDto`, `LearnerPlanResponseDto`, `CreateObjectiveDto`, `UpdateObjectiveDto`, `ObjectiveResponseDto`, `ApplyCurriculumTemplateDto`.
  - Prisma models: `AcademicYear`, `Subject`, `LearnerCurriculumPlan`, `LearningObjective`.

- [ ] **Step 1: Write failing tests for curriculum contracts**
- [ ] **Step 2: Implement contracts and schemas in packages/contracts**
- [ ] **Step 3: Update Prisma schema and create migration 0005_curriculum**
- [ ] **Step 4: Verify contracts build and prisma generate**
- [ ] **Step 5: Commit**

---

### Task 2: Curriculum Domain, Repositories, Template Engine & Application Services

**Files:**
- Create: `apps/api/src/modules/curriculum/domain/academic-year.entity.ts`
- Create: `apps/api/src/modules/curriculum/domain/subject.entity.ts`
- Create: `apps/api/src/modules/curriculum/domain/learner-plan.entity.ts`
- Create: `apps/api/src/modules/curriculum/domain/learning-objective.entity.ts`
- Create: `apps/api/src/modules/curriculum/infrastructure/curriculum-template.engine.ts`
- Create: `apps/api/src/modules/curriculum/infrastructure/curriculum.repository.ts`
- Create: `apps/api/src/modules/curriculum/infrastructure/objective.repository.ts`
- Create: `apps/api/src/modules/curriculum/application/curriculum.service.ts`
- Create: `apps/api/src/modules/curriculum/application/objective.service.ts`
- Test: `apps/api/src/modules/curriculum/application/curriculum.service.spec.ts`
- Test: `apps/api/src/modules/curriculum/application/objective.service.spec.ts`

**Interfaces:**
- Produces: `CurriculumService`, `ObjectiveService`, `CurriculumTemplateEngine`.

- [ ] **Step 1: Write unit tests for CurriculumService and ObjectiveService**
- [ ] **Step 2: Implement domain entities, repositories, template engine, and application services**
- [ ] **Step 3: Run unit tests and boundary check**
- [ ] **Step 4: Commit**

---

### Task 3: Public API, Presentation Controllers, and Module Registration

**Files:**
- Create: `apps/api/src/modules/curriculum/application/public-api.ts`
- Create: `apps/api/src/modules/curriculum/presentation/curriculum.controller.ts`
- Create: `apps/api/src/modules/curriculum/presentation/objective.controller.ts`
- Create: `apps/api/src/modules/curriculum/curriculum.module.ts`
- Create: `apps/api/src/modules/curriculum/index.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Produces: `CURRICULUM_PUBLIC_API`, `CurriculumModule`, REST endpoints under `/api/v1/families/:familyId/curriculum`.

- [ ] **Step 1: Implement public-api.ts and controllers**
- [ ] **Step 2: Implement CurriculumModule and register in AppModule**
- [ ] **Step 3: Check boundaries, lint and typecheck**
- [ ] **Step 4: Commit**

---

### Task 4: Multi-Tenant Isolation and E2E Tests for Curriculum & Objectives

**Files:**
- Create: `apps/api/test/curriculum.e2e-spec.ts`

**Interfaces:**
- Tests complete API endpoints, template application, and multi-tenant security boundary between families.

- [ ] **Step 1: Write comprehensive Curriculum E2E test suite**
- [ ] **Step 2: Run E2E test suite**
- [ ] **Step 3: Commit**

---

### Task 5: Web Frontend — Curriculum Dashboard, Subject Cards, and Objectives Management

**Files:**
- Create: `apps/web/src/components/curriculum/subject-card.tsx`
- Create: `apps/web/src/components/curriculum/objectives-list.tsx`
- Create: `apps/web/src/components/curriculum/curriculum-template-modal.tsx`
- Create: `apps/web/src/components/curriculum/subject-form-modal.tsx`
- Create: `apps/web/src/components/curriculum/objective-form-modal.tsx`
- Create: `apps/web/app/(dashboard)/curriculum/page.tsx`
- Test: `apps/web/tests/curriculum.test.tsx`
- Create: `apps/web/e2e/curriculum-flow.spec.ts`

**Interfaces:**
- Produces: `/curriculum` page, subject progress bars, objective status toggles, template application modal, and test suites.

- [ ] **Step 1: Write component tests for Curriculum and Objectives components**
- [ ] **Step 2: Implement components and page**
- [ ] **Step 3: Run web tests, lint and typecheck**
- [ ] **Step 4: Commit**

---

### Task 6: Full Repository Verification and Quality Suite

**Files:**
- Repository-wide verification across all 5 workspace projects.

- [ ] **Step 1: Run comprehensive quality gate suite**
- [ ] **Step 2: Commit any final polishing touches**
