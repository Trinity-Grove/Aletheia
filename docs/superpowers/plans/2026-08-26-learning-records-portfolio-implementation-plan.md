# Learning Records, Assessment & Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide families with an immutable log of completed learning (both structured lesson completions and spontaneous real-life discoveries), qualitative assessment with mastery levels, habit/character growth tracking, and a rich evidence portfolio.

**Architecture:** Hexagonal architecture across `@aletheia/contracts`, `apps/api` (NestJS/Fastify with PostgreSQL & Prisma), and `apps/web` (Next.js 15 App Router & Tailwind CSS). Multi-tenant isolation strictly enforced per family at the database, repository, service, controller, and UI levels.

**Tech Stack:** TypeScript, NestJS, Fastify, Prisma ORM, PostgreSQL, Vitest, Jest, Supertest, Next.js 15, React 19, Tailwind CSS.

## Global Constraints
- Node 22 / Fastify adapter in NestJS.
- Strict TypeScript (`exactOptionalPropertyTypes: true`, `noImplicitAny: true`).
- Contract DTOs use Zod schemas and infer TypeScript types.
- REST Controllers use `import type` for contract values and route prefix `/api/v1/families/:familyId/...`.
- Multi-tenant tenant isolation guarded by `JwtAuthGuard` and `FamilyTenantGuard`.
- Sibling ranking and comparative grade shaming are strictly prohibited.

---

### Task 1: Contracts and Database Schema for Learning Records & Evidence Portfolio

**Files:**
- Create: `packages/contracts/src/record.ts`
- Create: `packages/contracts/src/portfolio.ts`
- Create: `packages/contracts/src/record.test.ts`
- Create: `packages/contracts/src/portfolio.test.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/0007_learning_records/migration.sql`

**Interfaces:**
- Produces:
  - Enums: `MasteryLevel` (`"NOT_STARTED" | "EXPOSURE" | "DEVELOPING" | "WITH_ASSISTANCE" | "AUTONOMOUS" | "MASTERED"`), `AssessmentMethod` (`"OBSERVATION" | "NARRATION" | "EXERCISE" | "WRITING" | "PROJECT" | "EXPERIMENT" | "PRESENTATION" | "TEST" | "SELF_ASSESSMENT" | "PRACTICAL_DEMONSTRATION"`), `EvidenceType` (`"IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT" | "LINK" | "TEXT" | "CERTIFICATE"`), `LearningRecordType` (`"PLANNED_LESSON" | "SPONTANEOUS_EXPERIENCE" | "PROJECT_WORK" | "READING_LOG" | "HABIT_PRACTICE"`).
  - Types & Schemas: `CreateLearningRecordDto`, `UpdateLearningRecordDto`, `LearningRecordResponseDto`, `LearningRecordFilterDto`, `CreatePortfolioItemDto`, `UpdatePortfolioItemDto`, `PortfolioItemResponseDto`, `PortfolioItemFilterDto`, `LearnerProgressSummaryDto`.

- [ ] **Step 1: Write contracts and validation test suites**
- [ ] **Step 2: Implement Zod schemas and DTOs in `@aletheia/contracts`**
- [ ] **Step 3: Update Prisma schema with `LearningRecord`, `LearningRecordObjective`, and `PortfolioItem` models and relations**
- [ ] **Step 4: Create migration `0007_learning_records` and run Prisma generate**
- [ ] **Step 5: Run contract tests, build contracts, and typecheck**
- [ ] **Step 6: Commit changes: `feat(contracts): add learning records and portfolio contracts and database schema`**

---

### Task 2: Domain Entities, Repositories & Application Services

**Files:**
- Create: `apps/api/src/modules/records/domain/learning-record.entity.ts`
- Create: `apps/api/src/modules/records/domain/portfolio-item.entity.ts`
- Create: `apps/api/src/modules/records/infrastructure/learning-record.repository.ts`
- Create: `apps/api/src/modules/records/infrastructure/portfolio.repository.ts`
- Create: `apps/api/src/modules/records/application/learning-record.service.ts`
- Create: `apps/api/src/modules/records/application/portfolio.service.ts`
- Create: `apps/api/src/modules/records/application/learning-record.service.spec.ts`
- Create: `apps/api/src/modules/records/application/portfolio.service.spec.ts`

**Interfaces:**
- Consumes: `@aletheia/contracts`, `PrismaService`.
- Produces: `LearningRecordService`, `PortfolioService`.

- [ ] **Step 1: Write unit tests for `LearningRecordService` and `PortfolioService`**
- [ ] **Step 2: Implement domain entities and Prisma repositories with multi-tenant boundaries**
- [ ] **Step 3: Implement `LearningRecordService` (CRUD, spontaneous record logging, mastery level updates, objective linkages, and progress aggregation)**
- [ ] **Step 4: Implement `PortfolioService` (evidence management, tag filtering, linking to learning records)**
- [ ] **Step 5: Run unit tests and typecheck**
- [ ] **Step 6: Commit changes: `feat(records): implement learning record and portfolio domain services and repositories`**

---

### Task 3: Public API, Presentation Controllers & Module Registration

**Files:**
- Create: `apps/api/src/modules/records/application/public-api.ts`
- Create: `apps/api/src/modules/records/presentation/learning-record.controller.ts`
- Create: `apps/api/src/modules/records/presentation/portfolio.controller.ts`
- Create: `apps/api/src/modules/records/records.module.ts`
- Create: `apps/api/src/modules/records/index.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Produces:
  - `POST /api/v1/families/:familyId/records`
  - `GET /api/v1/families/:familyId/records`
  - `GET /api/v1/families/:familyId/records/summary`
  - `GET /api/v1/families/:familyId/records/:id`
  - `PATCH /api/v1/families/:familyId/records/:id`
  - `DELETE /api/v1/families/:familyId/records/:id`
  - `POST /api/v1/families/:familyId/portfolio`
  - `GET /api/v1/families/:familyId/portfolio`
  - `GET /api/v1/families/:familyId/portfolio/:id`
  - `PATCH /api/v1/families/:familyId/portfolio/:id`
  - `DELETE /api/v1/families/:familyId/portfolio/:id`

- [ ] **Step 1: Define `LEARNING_RECORDS_PUBLIC_API`**
- [ ] **Step 2: Implement `LearningRecordController` and `PortfolioController` with tenant guards**
- [ ] **Step 3: Register `RecordsModule` in `AppModule`**
- [ ] **Step 4: Run boundary check, lint, and typecheck**
- [ ] **Step 5: Commit changes: `feat(records): register records module and REST presentation controllers`**

---

### Task 4: Multi-Tenant Isolation & E2E Test Suite

**Files:**
- Create: `apps/api/test/records.e2e-spec.ts`

- [ ] **Step 1: Write E2E test suite covering multi-tenant family boundary isolation, auth guards, spontaneous learning logs, mastery tracking, and portfolio evidence tagging**
- [ ] **Step 2: Run E2E test suite: `corepack pnpm --filter @aletheia/api test:e2e test/records.e2e-spec.ts`**
- [ ] **Step 3: Commit changes: `test(records): add multi-tenant isolation and learning records e2e test suite`**

---

### Task 5: Web Frontend — Learning Journal, Mastery Insights & Evidence Portfolio

**Files:**
- Create: `apps/web/src/components/records/record-card.tsx`
- Create: `apps/web/src/components/records/record-form-modal.tsx`
- Create: `apps/web/src/components/records/records-journal-view.tsx`
- Create: `apps/web/src/components/records/portfolio-gallery-view.tsx`
- Create: `apps/web/src/components/records/portfolio-item-modal.tsx`
- Create: `apps/web/app/(dashboard)/records/page.tsx`
- Create: `apps/web/app/(dashboard)/portfolio/page.tsx`
- Create: `apps/web/tests/records.test.tsx`

- [ ] **Step 1: Write component tests in `apps/web/tests/records.test.tsx`**
- [ ] **Step 2: Implement UI components with mastery badges, assessment method pills, evidence attachments, and filter chips**
- [ ] **Step 3: Implement `/records` and `/portfolio` Next.js pages**
- [ ] **Step 4: Run web tests, lint, and typecheck**
- [ ] **Step 5: Commit changes: `feat(web): add learning journal feed, mastery tracking, and evidence portfolio gallery`**

---

### Task 6: Full Workspace Verification & PR Submission

- [ ] **Step 1: Run complete workspace quality gate:**
  `corepack pnpm check:boundaries && corepack pnpm lint && corepack pnpm typecheck && corepack pnpm test && corepack pnpm test:e2e`
- [ ] **Step 2: Push branch `build/learning-records` to origin**
- [ ] **Step 3: Create PR on `Trinity-Grove/Aletheia` and present results**
