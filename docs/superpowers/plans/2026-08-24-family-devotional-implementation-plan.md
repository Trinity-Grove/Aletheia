# Family Devotional & YouVersion Scripture Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Plan 04: Family Devotional & Prayer Journal in Aletheia, supporting dated family devotionals, scripture lookup via the YouVersion Platform REST API, persistent prayer petitions, praise/gratitudes, and responsive web interfaces.

**Architecture:** A domain-driven `@modules/devotional` module in NestJS with `YouVersionService`, `DevotionalService`, `PrayerService`, and strict modular boundaries (`DEVOTIONAL_PUBLIC_API`). Multi-tenant authorization enforced by `FamilyTenantGuard`. The web frontend provides a `/devotional` page with date navigation, scripture lookup, and prayer journal drawers.

**Tech Stack:** TypeScript 5.9, NestJS 11, Fastify, Prisma 6, PostgreSQL, Zod, YouVersion REST API, Vitest, Jest, Next.js 16, React 19, Playwright.

## Global Constraints
- Domain modular boundaries: external modules only import from `apps/api/src/modules/devotional/application/public-api.js`.
- Security: All devotional/prayer endpoints require `JwtAuthGuard` and `FamilyTenantGuard`.
- Resilient Scripture Provider: YouVersion API integration (`YOUVERSION_APP_KEY`) with automatic local fallback when offline or without API key.
- Soft-delete: Prayers support archiving without losing historical testimonies.
- NodeNext module resolution with `.js` specifiers in imports.

---

### Task 1: Contracts and Database Schema for Family Devotionals and Prayers

**Files:**
- Create: `packages/contracts/src/devotional.ts`
- Create: `packages/contracts/src/prayer.ts`
- Modify: `packages/contracts/src/index.ts`
- Test: `packages/contracts/src/devotional.test.ts`
- Test: `packages/contracts/src/prayer.test.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/0004_family_devotional/migration.sql`

**Interfaces:**
- Produces:
  - `PrayerType` enum: `"PETITION" | "GRATITUDE"`
  - `BibleVersionDto`, `BiblePassageDto`, `UpsertDailyDevotionalDto`, `DailyDevotionalResponseDto`
  - `CreatePrayerDto`, `UpdatePrayerDto`, `AnswerPrayerDto`, `PrayerResponseDto`
  - Prisma models `DailyDevotional` and `PrayerRequest` with migration `0004_family_devotional`.

- [ ] **Step 1: Write the failing tests for devotional and prayer contracts**
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement devotional and prayer schemas and export in contracts**
- [ ] **Step 4: Update Prisma schema and add migration**
- [ ] **Step 5: Run tests and Prisma client generation**
- [ ] **Step 6: Commit**

---

### Task 2: YouVersion Scripture Service, Devotional & Prayer Application Services

**Files:**
- Create: `apps/api/src/modules/devotional/infrastructure/youversion.service.ts`
- Create: `apps/api/src/modules/devotional/domain/daily-devotional.entity.ts`
- Create: `apps/api/src/modules/devotional/domain/prayer-request.entity.ts`
- Create: `apps/api/src/modules/devotional/infrastructure/devotional.repository.ts`
- Create: `apps/api/src/modules/devotional/infrastructure/prayer.repository.ts`
- Create: `apps/api/src/modules/devotional/application/devotional.service.ts`
- Create: `apps/api/src/modules/devotional/application/prayer.service.ts`
- Test: `apps/api/src/modules/devotional/application/devotional.service.spec.ts`
- Test: `apps/api/src/modules/devotional/application/prayer.service.spec.ts`

**Interfaces:**
- Consumes: `@aletheia/contracts`, `PrismaService`, `EnvironmentService`.
- Produces: `YouVersionService`, `DevotionalService`, `PrayerService`.

- [ ] **Step 1: Write failing unit tests for DevotionalService and PrayerService**
- [ ] **Step 2: Run tests to verify failure**
- [ ] **Step 3: Implement domain entities, repositories, YouVersionService, and application services**
- [ ] **Step 4: Run unit tests to verify pass**
- [ ] **Step 5: Commit**

---

### Task 3: Devotional Public API, Presentation Controllers, and Module Registration

**Files:**
- Create: `apps/api/src/modules/devotional/application/public-api.ts`
- Create: `apps/api/src/modules/devotional/presentation/devotional.controller.ts`
- Create: `apps/api/src/modules/devotional/presentation/prayer.controller.ts`
- Create: `apps/api/src/modules/devotional/devotional.module.ts`
- Create: `apps/api/src/modules/devotional/index.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: `DevotionalService`, `PrayerService`, `YouVersionService`, `JwtAuthGuard`, `FamilyTenantGuard`.
- Produces: `DEVOTIONAL_PUBLIC_API`, `DevotionalModule`, REST endpoints under `/api/v1/families/:familyId/devotionals` and `/api/v1/families/:familyId/prayers`.

- [ ] **Step 1: Implement public-api.ts and index.ts**
- [ ] **Step 2: Implement DevotionalController and PrayerController**
- [ ] **Step 3: Implement DevotionalModule and register in AppModule**
- [ ] **Step 4: Check boundaries, lint and typecheck**
- [ ] **Step 5: Commit**

---

### Task 4: Multi-Tenant Isolation and E2E Tests for Devotionals & Prayers

**Files:**
- Create: `apps/api/test/devotional.e2e-spec.ts`

**Interfaces:**
- Tests complete API endpoints, scripture lookup, and multi-tenant security boundary between families.

- [ ] **Step 1: Write comprehensive Devotional & Prayer E2E test suite**
- [ ] **Step 2: Run E2E test suite**
- [ ] **Step 3: Commit**

---

### Task 5: Web Frontend — Devotional Page, Scripture Viewer, and Prayer Journal UI

**Files:**
- Create: `apps/web/src/components/devotional/devotional-view.tsx`
- Create: `apps/web/src/components/devotional/devotional-form-modal.tsx`
- Create: `apps/web/src/components/devotional/prayer-journal.tsx`
- Create: `apps/web/app/(dashboard)/devotional/page.tsx`
- Test: `apps/web/tests/devotional.test.tsx`
- Create: `apps/web/e2e/devotional-flow.spec.ts`

**Interfaces:**
- Produces: `/devotional` page, scripture lookup, prayer drawer, and component test suite.

- [ ] **Step 1: Write component tests for Devotional and Prayer components**
- [ ] **Step 2: Run tests to verify failure**
- [ ] **Step 3: Implement DevotionalView, PrayerJournal, DevotionalFormModal, and page**
- [ ] **Step 4: Run component tests to verify pass**
- [ ] **Step 5: Commit**

---

### Task 6: Full Repository Verification and Quality Suite

**Files:**
- Repository-wide verification across all 5 workspace projects.

- [ ] **Step 1: Run comprehensive quality gate suite**
- [ ] **Step 2: Commit any final polishing touches**
