# Lesson Planning, Weekly Routine & Daily Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide families with flexible lesson planning, multi-learner group/individual assignment, recurring weekly routine scheduling, daily checklist execution with duration tracking, and transparent rescheduling.

**Architecture:** Hexagonal architecture across `@aletheia/contracts`, `apps/api` (NestJS/Fastify with PostgreSQL & Prisma), and `apps/web` (Next.js 15 App Router & Tailwind CSS). Multi-tenant tenant boundary enforced per family at the database, service, controller, and UI levels.

**Tech Stack:** TypeScript, NestJS, Fastify, Prisma ORM, PostgreSQL, Vitest, Jest, Supertest, Next.js 15, React 19, Tailwind CSS.

## Global Constraints
- Node 22 / Fastify adapter in NestJS.
- Strict TypeScript (`exactOptionalPropertyTypes: true`, `noImplicitAny: true`).
- Contract DTOs use Zod schemas and infer TypeScript types.
- REST Controllers use `import type` for contract values and route prefix `/api/v1/families/:familyId/...`.
- Multi-tenant tenant isolation guarded by `JwtAuthGuard` and `FamilyTenantGuard`.

---

### Task 1: Contracts and Database Schema for Lessons and Weekly Routine

**Files:**
- Create: `packages/contracts/src/lesson.ts`
- Create: `packages/contracts/src/schedule.ts`
- Create: `packages/contracts/src/lesson.test.ts`
- Create: `packages/contracts/src/schedule.test.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/0006_lesson_planning/migration.sql`

**Interfaces:**
- Produces:
  - Enums: `LessonStatus` (`"PLANNED" | "IN_PROGRESS" | "COMPLETED" | "POSTPONED" | "CANCELLED"`), `DayOfWeek` (1-7 / Mon-Sun).
  - Types & Schemas: `CreateLessonPlanDto`, `UpdateLessonPlanDto`, `LessonPlanResponseDto`, `CompleteLessonDto`, `RescheduleLessonDto`, `CreateScheduleSlotDto`, `UpdateScheduleSlotDto`, `ScheduleSlotResponseDto`, `DailyAgendaDto`.

- [ ] **Step 1: Write contracts and validation tests**
- [ ] **Step 2: Implement Zod schemas and DTOs in `@aletheia/contracts`**
- [ ] **Step 3: Update Prisma schema and generate migration `0006_lesson_planning`**
- [ ] **Step 4: Run contracts tests, prisma generate, and workspace typecheck**
- [ ] **Step 5: Commit changes: `feat(contracts): add lesson planning and weekly routine contracts and schema`**

---

### Task 2: Domain Entities, Repositories & Application Services

**Files:**
- Create: `apps/api/src/modules/lessons/domain/lesson-plan.entity.ts`
- Create: `apps/api/src/modules/lessons/domain/schedule-slot.entity.ts`
- Create: `apps/api/src/modules/lessons/infrastructure/lesson-plan.repository.ts`
- Create: `apps/api/src/modules/lessons/infrastructure/schedule.repository.ts`
- Create: `apps/api/src/modules/lessons/application/lesson-plan.service.ts`
- Create: `apps/api/src/modules/lessons/application/schedule.service.ts`
- Create: `apps/api/src/modules/lessons/application/lesson-plan.service.spec.ts`
- Create: `apps/api/src/modules/lessons/application/schedule.service.spec.ts`

**Interfaces:**
- Consumes: `@aletheia/contracts` (lesson & schedule DTOs), `PrismaService`.
- Produces: `LessonPlanService`, `ScheduleService`.

- [ ] **Step 1: Write unit tests for `LessonPlanService` and `ScheduleService`**
- [ ] **Step 2: Implement domain entities and Prisma repositories**
- [ ] **Step 3: Implement `LessonPlanService` (CRUD, multi-learner linkage, completion recording, rescheduling)**
- [ ] **Step 4: Implement `ScheduleService` (weekly routine grid and daily agenda aggregation)**
- [ ] **Step 5: Run unit tests and typecheck**
- [ ] **Step 6: Commit changes: `feat(lessons): implement lesson plan and schedule services with repository persistence`**

---

### Task 3: Public API, Presentation Controllers & Module Registration

**Files:**
- Create: `apps/api/src/modules/lessons/application/public-api.ts`
- Create: `apps/api/src/modules/lessons/presentation/lesson-plan.controller.ts`
- Create: `apps/api/src/modules/lessons/presentation/schedule.controller.ts`
- Create: `apps/api/src/modules/lessons/lessons.module.ts`
- Create: `apps/api/src/modules/lessons/index.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Produces:
  - `POST /api/v1/families/:familyId/lessons`
  - `GET /api/v1/families/:familyId/lessons`
  - `GET /api/v1/families/:familyId/lessons/:id`
  - `PATCH /api/v1/families/:familyId/lessons/:id`
  - `POST /api/v1/families/:familyId/lessons/:id/complete`
  - `POST /api/v1/families/:familyId/lessons/:id/reschedule`
  - `POST /api/v1/families/:familyId/schedule/slots`
  - `GET /api/v1/families/:familyId/schedule/slots`
  - `DELETE /api/v1/families/:familyId/schedule/slots/:id`
  - `GET /api/v1/families/:familyId/schedule/agenda`

- [ ] **Step 1: Define `LESSON_PLAN_PUBLIC_API`**
- [ ] **Step 2: Implement `LessonPlanController` and `ScheduleController` with tenant guards**
- [ ] **Step 3: Register `LessonsModule` in `AppModule`**
- [ ] **Step 4: Run boundary check, lint, and typecheck**
- [ ] **Step 5: Commit changes: `feat(lessons): register lessons module and REST presentation controllers`**

---

### Task 4: Multi-Tenant Isolation & E2E Test Suite

**Files:**
- Create: `apps/api/test/lessons.e2e-spec.ts`

- [ ] **Step 1: Write E2E test suite covering multi-tenant family boundary isolation, auth guards, lesson lifecycle, multi-learner assignments, completions, rescheduling, and weekly routine slots**
- [ ] **Step 2: Run E2E test suite: `corepack pnpm --filter @aletheia/api test:e2e test/lessons.e2e-spec.ts`**
- [ ] **Step 3: Commit changes: `test(lessons): add multi-tenant isolation and lesson planning e2e test suite`**

---

### Task 5: Web Frontend — Daily Schedule Agenda, Routine Planner & Lesson Modals

**Files:**
- Create: `apps/web/src/components/lessons/daily-agenda-view.tsx`
- Create: `apps/web/src/components/lessons/lesson-card.tsx`
- Create: `apps/web/src/components/lessons/lesson-form-modal.tsx`
- Create: `apps/web/src/components/lessons/reschedule-modal.tsx`
- Create: `apps/web/src/components/lessons/weekly-routine-grid.tsx`
- Create: `apps/web/app/(dashboard)/schedule/page.tsx`
- Create: `apps/web/tests/lessons.test.tsx`

- [ ] **Step 1: Write component tests in `apps/web/tests/lessons.test.tsx`**
- [ ] **Step 2: Implement UI components with date navigator, learner filter, completion checkbox, duration recorder, and routine grid**
- [ ] **Step 3: Implement `/schedule` Next.js page**
- [ ] **Step 4: Run web tests, lint, and typecheck**
- [ ] **Step 5: Commit changes: `feat(web): add daily schedule checklist, lesson planning modals, and routine planner`**

---

### Task 6: Full Workspace Verification & PR Submission

- [ ] **Step 1: Run complete workspace quality gate:**
  `corepack pnpm check:boundaries && corepack pnpm lint && corepack pnpm typecheck && corepack pnpm test && corepack pnpm test:e2e`
- [ ] **Step 2: Push branch `build/lesson-planning` to origin**
- [ ] **Step 3: Create PR on `Trinity-Grove/Aletheia` and present results**
