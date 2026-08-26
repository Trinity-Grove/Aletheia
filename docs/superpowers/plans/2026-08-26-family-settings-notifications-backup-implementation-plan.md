# Family Settings, Notifications, Reminders & Data Backup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide families with comprehensive settings control (homeschool organization name, pedagogical defaults, timezone, member management), in-app notification center and reminder preferences, and complete family data portability (GDPR/LGPD full JSON backup export).

**Architecture:** Hexagonal architecture across `@aletheia/contracts`, `apps/api` (NestJS/Fastify with PostgreSQL & Prisma), and `apps/web` (Next.js 15 App Router & Tailwind CSS). Multi-tenant isolation strictly enforced per family at the database, repository, service, controller, and UI levels.

**Tech Stack:** TypeScript, NestJS, Fastify, Prisma ORM, PostgreSQL, Vitest, Jest, Supertest, Next.js 15, React 19, Tailwind CSS.

## Global Constraints
- Node 22 / Fastify adapter in NestJS.
- Strict TypeScript (`exactOptionalPropertyTypes: true`, `noImplicitAny: true`).
- Contract DTOs use Zod schemas and infer TypeScript types.
- REST Controllers use `import type` for contract values and route prefix `/api/v1/families/:familyId/...`.
- Multi-tenant isolation guarded by `JwtAuthGuard` and `FamilyTenantGuard`.
- Sibling ranking and comparative grade shaming are strictly prohibited.

---

### Task 1: Contracts and Database Schema for Settings, Notifications & Backup

**Files:**
- Create: `packages/contracts/src/settings.ts`
- Create: `packages/contracts/src/notification.ts`
- Create: `packages/contracts/src/backup.ts`
- Create: `packages/contracts/src/settings.test.ts`
- Create: `packages/contracts/src/notification.test.ts`
- Create: `packages/contracts/src/backup.test.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/0009_family_settings/migration.sql`

**Interfaces:**
- Produces:
  - Enums: `NotificationType` (`"DEVOTIONAL_REMINDER" | "DAILY_SCHEDULE_REMINDER" | "ATTENDANCE_MISSING_REMINDER" | "PRAYER_ANSWERED_ALERT" | "SYSTEM_NOTICE"`), `ExportStatus` (`"PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"`).
  - Types & Schemas: `UpdateFamilySettingsDto`, `FamilySettingsResponseDto`, `NotificationItemResponseDto`, `MarkNotificationReadDto`, `NotificationFilterDto`, `CreateExportJobDto`, `DataExportJobResponseDto`, `FamilyDataExportPackageDto`.

- [ ] **Step 1: Write contracts and validation test suites**
- [ ] **Step 2: Implement Zod schemas and DTOs in `@aletheia/contracts`**
- [ ] **Step 3: Update Prisma schema with `FamilySettings`, `NotificationItem`, and `DataExportJob` models and relations**
- [ ] **Step 4: Create migration `0009_family_settings` and run Prisma generate**
- [ ] **Step 5: Run contract tests, build contracts, and typecheck**
- [ ] **Step 6: Commit changes: `feat(contracts): add family settings, notifications and backup contracts and schema`**

---

### Task 2: Domain Entities, Repositories & Application Services

**Files:**
- Create: `apps/api/src/modules/settings/domain/family-settings.entity.ts`
- Create: `apps/api/src/modules/settings/domain/notification.entity.ts`
- Create: `apps/api/src/modules/settings/domain/data-export-job.entity.ts`
- Create: `apps/api/src/modules/settings/infrastructure/family-settings.repository.ts`
- Create: `apps/api/src/modules/settings/infrastructure/notification.repository.ts`
- Create: `apps/api/src/modules/settings/infrastructure/data-export.repository.ts`
- Create: `apps/api/src/modules/settings/application/family-settings.service.ts`
- Create: `apps/api/src/modules/settings/application/notification.service.ts`
- Create: `apps/api/src/modules/settings/application/data-export.service.ts`
- Create: `apps/api/src/modules/settings/application/family-settings.service.spec.ts`
- Create: `apps/api/src/modules/settings/application/notification.service.spec.ts`
- Create: `apps/api/src/modules/settings/application/data-export.service.spec.ts`

**Interfaces:**
- Consumes: `@aletheia/contracts`, `PrismaService`.
- Produces: `FamilySettingsService`, `NotificationService`, `DataExportService`.

- [ ] **Step 1: Write unit tests for services**
- [ ] **Step 2: Implement domain entities and Prisma repositories with multi-tenant boundaries**
- [ ] **Step 3: Implement `FamilySettingsService` (get or create default settings, update settings)**
- [ ] **Step 4: Implement `NotificationService` (send notifications, list user notifications, unread count, mark read, mark all read)**
- [ ] **Step 5: Implement `DataExportService` (consolidate all family aggregates into structured JSON backup)**
- [ ] **Step 6: Run unit tests and typecheck**
- [ ] **Step 7: Commit changes: `feat(settings): implement settings, notification and backup domain services and repositories`**

---

### Task 3: Public API, Presentation Controllers & Module Registration

**Files:**
- Create: `apps/api/src/modules/settings/application/public-api.ts`
- Create: `apps/api/src/modules/settings/presentation/family-settings.controller.ts`
- Create: `apps/api/src/modules/settings/presentation/notification.controller.ts`
- Create: `apps/api/src/modules/settings/presentation/data-export.controller.ts`
- Create: `apps/api/src/modules/settings/settings.module.ts`
- Create: `apps/api/src/modules/settings/index.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Produces:
  - `GET /api/v1/families/:familyId/settings`
  - `PATCH /api/v1/families/:familyId/settings`
  - `GET /api/v1/families/:familyId/notifications`
  - `GET /api/v1/families/:familyId/notifications/unread-count`
  - `POST /api/v1/families/:familyId/notifications/:id/read`
  - `POST /api/v1/families/:familyId/notifications/read-all`
  - `POST /api/v1/families/:familyId/export`
  - `GET /api/v1/families/:familyId/export`
  - `GET /api/v1/families/:familyId/export/:id/download`

- [ ] **Step 1: Define `FAMILY_SETTINGS_PUBLIC_API`**
- [ ] **Step 2: Implement `FamilySettingsController`, `NotificationController`, and `DataExportController` with tenant guards**
- [ ] **Step 3: Register `SettingsModule` in `AppModule`**
- [ ] **Step 4: Run boundary check, lint, and typecheck**
- [ ] **Step 5: Commit changes: `feat(settings): register settings module and REST presentation controllers`**

---

### Task 4: Multi-Tenant Isolation & E2E Test Suite

**Files:**
- Create: `apps/api/test/settings.e2e-spec.ts`

- [ ] **Step 1: Write E2E test suite covering multi-tenant family boundary isolation, auth guards, settings updates, notification center, and complete data export package**
- [ ] **Step 2: Run E2E test suite: `corepack pnpm --filter @aletheia/api test:e2e test/settings.e2e-spec.ts`**
- [ ] **Step 3: Commit changes: `test(settings): add multi-tenant isolation and settings e2e test suite`**

---

### Task 5: Web Frontend — Settings Hub, Notification Center & Data Backup

**Files:**
- Create: `apps/web/src/components/settings/family-general-settings.tsx`
- Create: `apps/web/src/components/settings/notification-preferences.tsx`
- Create: `apps/web/src/components/settings/data-backup-card.tsx`
- Create: `apps/web/src/components/layout/notification-bell.tsx`
- Modify: `apps/web/src/components/layout/product-shell.tsx`
- Create: `apps/web/app/(dashboard)/settings/page.tsx`
- Create: `apps/web/tests/settings.test.tsx`

- [ ] **Step 1: Write component tests in `apps/web/tests/settings.test.tsx`**
- [ ] **Step 2: Implement UI components with settings form, reminder switches, backup export button, and notification bell popover**
- [ ] **Step 3: Update `ProductShell` with `NotificationBell`**
- [ ] **Step 4: Implement `/settings` Next.js page**
- [ ] **Step 5: Run web tests, lint, and typecheck**
- [ ] **Step 6: Commit changes: `feat(web): add settings dashboard, notification bell, and full data backup export`**

---

### Task 6: Full Workspace Verification & PR Submission

- [ ] **Step 1: Run complete workspace quality gate:**
  `corepack pnpm check:boundaries && corepack pnpm lint && corepack pnpm typecheck && corepack pnpm test && corepack pnpm test:e2e`
- [ ] **Step 2: Push branch `build/family-settings` to origin**
- [ ] **Step 3: Create PR on `Trinity-Grove/Aletheia` and present results**
