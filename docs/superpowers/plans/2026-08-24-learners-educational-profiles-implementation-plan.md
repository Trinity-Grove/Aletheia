# Learners & Educational Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Plan 03: Learners & Educational Profiles in Aletheia, providing multi-tenant learner profile management, educational stage modeling, soft-delete archiving, public API boundaries, and frontend management interfaces with contextual learner focus switching.

**Architecture:** A domain-driven `@modules/learners` module in NestJS adhering to strict modular boundaries (`scripts/check-module-boundaries.mjs`) and multi-tenant authorization (`FamilyTenantGuard`), backed by PostgreSQL via Prisma. The frontend `@aletheia/web` provides a dedicated `/learners` management UI and a `LearnerFocusSwitcher` in the application shell.

**Tech Stack:** TypeScript 5.9, NestJS 11, Fastify, Prisma 6, PostgreSQL, Zod, Vitest, Jest, Next.js 16, React 19, Playwright.

## Global Constraints
- Strictly maintain modular monolith domain boundaries: external modules only import from `apps/api/src/modules/learners/application/public-api.js`.
- Security: All learner endpoints require `JwtAuthGuard` and `FamilyTenantGuard`. Minor learners have no user credentials/passwords.
- Data integrity: Soft-delete via `archivedAt` timestamp; hard deletion is prohibited to preserve educational records.
- Cross-platform: NodeNext module resolution with `.js` specifiers in imports.

---

### Task 1: Contracts and Database Schema for Learners

**Files:**
- Create: `packages/contracts/src/learner.ts`
- Modify: `packages/contracts/src/index.ts`
- Test: `packages/contracts/src/learner.test.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/0003_learners/migration.sql`

**Interfaces:**
- Produces:
  - `EducationalStage` enum: `"EARLY_YEARS" | "PRIMARY_GRAMMAR" | "MIDDLE_LOGIC" | "HIGH_RHETORIC" | "OTHER"`
  - `CreateLearnerDto`, `UpdateLearnerDto`, `LearnerResponseDto`, `LearnerSummaryDto` schemas and TypeScript types.
  - Prisma model `Learner` and migration `0003_learners`.

- [ ] **Step 1: Write the failing test for learner contracts**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement learner schemas and export in contracts**
- [ ] **Step 4: Update Prisma schema and add migration**
- [ ] **Step 5: Run tests and Prisma client generation**
- [ ] **Step 6: Commit**

---

### Task 2: Learners Domain Entity, Repository, and Service

**Files:**
- Create: `apps/api/src/modules/learners/domain/educational-stage.ts`
- Create: `apps/api/src/modules/learners/domain/learner.entity.ts`
- Create: `apps/api/src/modules/learners/infrastructure/learner.repository.ts`
- Create: `apps/api/src/modules/learners/application/learner.service.ts`
- Test: `apps/api/src/modules/learners/application/learner.service.spec.ts`

**Interfaces:**
- Consumes: `@aletheia/contracts`, `PrismaService`.
- Produces: `LearnerEntity`, `LearnerRepository`, `LearnerService`.

- [ ] **Step 1: Write the failing test for LearnerService**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement LearnerEntity, LearnerRepository, and LearnerService**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 3: Learners Public API, Presentation Controller, and Module Registration

**Files:**
- Create: `apps/api/src/modules/learners/application/public-api.ts`
- Create: `apps/api/src/modules/learners/presentation/learner.controller.ts`
- Create: `apps/api/src/modules/learners/learners.module.ts`
- Create: `apps/api/src/modules/learners/index.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: `LearnerService`, `JwtAuthGuard`, `FamilyTenantGuard`.
- Produces: `LEARNERS_PUBLIC_API`, `LearnersModule`, REST endpoints under `/api/v1/families/:familyId/learners`.

- [ ] **Step 1: Implement public-api.ts and index.ts**
- [ ] **Step 2: Implement LearnerController**
- [ ] **Step 3: Implement LearnersModule and register in AppModule**
- [ ] **Step 4: Check boundaries, lint and typecheck**
- [ ] **Step 5: Commit**

---

### Task 4: Multi-Tenant Isolation and E2E Tests for Learners

**Files:**
- Create: `apps/api/test/learners.e2e-spec.ts`

**Interfaces:**
- Tests complete API endpoints and multi-tenant security boundary between families.

- [ ] **Step 1: Write comprehensive Learners E2E test suite**
- [ ] **Step 2: Run E2E test suite**
- [ ] **Step 3: Commit**

---

### Task 5: Web Frontend — Learner Management Page and Components

**Files:**
- Create: `apps/web/src/components/learners/learner-card.tsx`
- Create: `apps/web/src/components/learners/learner-form-modal.tsx`
- Create: `apps/web/src/components/learners/learners-list.tsx`
- Create: `apps/web/app/(dashboard)/learners/page.tsx`
- Test: `apps/web/tests/learners.test.tsx`

**Interfaces:**
- Produces: Responsive Learner Card, Modal creation/edit form, and `/learners` page.

- [ ] **Step 1: Write component tests for Learner components**
- [ ] **Step 2: Run component tests to verify failure**
- [ ] **Step 3: Implement LearnerCard, LearnerFormModal, LearnersList, and page**
- [ ] **Step 4: Run component tests to verify pass**
- [ ] **Step 5: Commit**

---

### Task 6: Web Frontend — Learner Focus Switcher in Product Shell

**Files:**
- Create: `apps/web/src/components/layout/learner-focus-switcher.tsx`
- Modify: `apps/web/src/components/layout/product-shell.tsx`
- Test: `apps/web/tests/learner-focus-switcher.test.tsx`
- Create: `apps/web/e2e/learners-flow.spec.ts`

**Interfaces:**
- Produces: Header `LearnerFocusSwitcher` component allowing selection of "Toda a Família" or a specific learner.

- [ ] **Step 1: Write test for LearnerFocusSwitcher**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement LearnerFocusSwitcher and update product shell**
- [ ] **Step 4: Run component tests to verify pass**
- [ ] **Step 5: Commit**

---

### Task 7: Full Repository Verification and Quality Suite

**Files:**
- Repository-wide verification across all 5 workspace projects.

- [ ] **Step 1: Run comprehensive quality gate suite**
- [ ] **Step 2: Commit any final polishing touches**
