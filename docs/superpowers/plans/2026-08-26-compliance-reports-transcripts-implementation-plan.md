# Compliance, Attendance, Academic Transcripts & Official Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Equip homeschooling families with automated attendance logging, regulatory compliance tracking (instructional days/hours against jurisdiction targets), academic transcripts with multi-grading scale conversions, and formal report generation with printable/exportable views (PDF & CSV).

**Architecture:** Hexagonal architecture across `@aletheia/contracts`, `apps/api` (NestJS/Fastify with PostgreSQL & Prisma), and `apps/web` (Next.js 15 App Router & Tailwind CSS). Multi-tenant isolation strictly enforced per family at the database, repository, service, controller, and UI levels.

**Tech Stack:** TypeScript, NestJS, Fastify, Prisma ORM, PostgreSQL, Vitest, Jest, Supertest, Next.js 15, React 19, Tailwind CSS.

## Global Constraints
- Node 22 / Fastify adapter in NestJS.
- Strict TypeScript (`exactOptionalPropertyTypes: true`, `noImplicitAny: true`).
- Contract DTOs use Zod schemas and infer TypeScript types.
- REST Controllers use `import type` for contract values and route prefix `/api/v1/families/:familyId/...`.
- Multi-tenant isolation guarded by `JwtAuthGuard` and `FamilyTenantGuard`.
- Sibling ranking, comparisons, and grading shame are strictly prohibited.

---

### Task 1: Contracts and Database Schema for Compliance, Attendance & Reports

**Files:**
- Create: `packages/contracts/src/attendance.ts`
- Create: `packages/contracts/src/report.ts`
- Create: `packages/contracts/src/attendance.test.ts`
- Create: `packages/contracts/src/report.test.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/0008_compliance_reports/migration.sql`

**Interfaces:**
- Produces:
  - Enums: `AttendanceStatus` (`"PRESENT" | "EXCUSED_ABSENCE" | "UNEXCUSED_ABSENCE" | "HOLIDAY" | "FIELD_TRIP" | "SICK"`), `GradingScale` (`"MASTERY_QUALITATIVE" | "LETTER_A_F" | "NUMERIC_0_10" | "NUMERIC_0_100" | "NARRATIVE"`), `ReportType` (`"ATTENDANCE_SUMMARY" | "ACADEMIC_TRANSCRIPT" | "LEARNING_PORTFOLIO_DOSSIER" | "ANNUAL_COMPLIANCE_REPORT"`), `ExportFormat` (`"PDF" | "CSV" | "JSON"`).
  - Types & Schemas: `LogAttendanceDto`, `BulkLogAttendanceDto`, `AttendanceResponseDto`, `AttendanceFilterDto`, `AttendanceComplianceSummaryDto`, `UpsertComplianceRequirementDto`, `ComplianceRequirementResponseDto`, `GenerateReportDto`, `OfficialReportResponseDto`, `AcademicTranscriptDto`.

- [ ] **Step 1: Write contracts and validation test suites**
- [ ] **Step 2: Implement Zod schemas and DTOs in `@aletheia/contracts`**
- [ ] **Step 3: Update Prisma schema with `AttendanceRecord`, `ComplianceRequirement`, and `OfficialReport` models and relations**
- [ ] **Step 4: Create migration `0008_compliance_reports` and run Prisma generate**
- [ ] **Step 5: Run contract tests, build contracts, and typecheck**
- [ ] **Step 6: Commit changes: `feat(contracts): add compliance, attendance and official reports contracts and database schema`**

---

### Task 2: Domain Entities, Repositories & Application Services

**Files:**
- Create: `apps/api/src/modules/reports/domain/attendance-record.entity.ts`
- Create: `apps/api/src/modules/reports/domain/compliance-requirement.entity.ts`
- Create: `apps/api/src/modules/reports/domain/official-report.entity.ts`
- Create: `apps/api/src/modules/reports/domain/grade-converter.ts`
- Create: `apps/api/src/modules/reports/infrastructure/attendance.repository.ts`
- Create: `apps/api/src/modules/reports/infrastructure/compliance.repository.ts`
- Create: `apps/api/src/modules/reports/infrastructure/report.repository.ts`
- Create: `apps/api/src/modules/reports/application/attendance.service.ts`
- Create: `apps/api/src/modules/reports/application/report.service.ts`
- Create: `apps/api/src/modules/reports/application/attendance.service.spec.ts`
- Create: `apps/api/src/modules/reports/application/report.service.spec.ts`

**Interfaces:**
- Consumes: `@aletheia/contracts`, `PrismaService`, `LEARNING_RECORDS_PUBLIC_API`, `CURRICULUM_PUBLIC_API`, `LEARNERS_PUBLIC_API`.
- Produces: `AttendanceService`, `ReportService`.

- [ ] **Step 1: Write unit tests for `AttendanceService`, `GradeConverter`, and `ReportService`**
- [ ] **Step 2: Implement domain entities, repositories with multi-tenant boundaries, and grade converter utility**
- [ ] **Step 3: Implement `AttendanceService` (single/bulk logging, compliance metrics calculation against minimum days/hours targets)**
- [ ] **Step 4: Implement `ReportService` (transcript snapshot generation with converted grades, compliance dossier, CSV export generation)**
- [ ] **Step 5: Run unit tests and typecheck**
- [ ] **Step 6: Commit changes: `feat(reports): implement attendance and report domain services and repositories`**

---

### Task 3: Public API, Presentation Controllers & Module Registration

**Files:**
- Create: `apps/api/src/modules/reports/application/public-api.ts`
- Create: `apps/api/src/modules/reports/presentation/attendance.controller.ts`
- Create: `apps/api/src/modules/reports/presentation/report.controller.ts`
- Create: `apps/api/src/modules/reports/reports.module.ts`
- Create: `apps/api/src/modules/reports/index.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Produces:
  - `POST /api/v1/families/:familyId/attendance`
  - `POST /api/v1/families/:familyId/attendance/bulk`
  - `GET /api/v1/families/:familyId/attendance`
  - `GET /api/v1/families/:familyId/attendance/summary`
  - `PUT /api/v1/families/:familyId/attendance/requirements`
  - `GET /api/v1/families/:familyId/attendance/requirements`
  - `POST /api/v1/families/:familyId/reports/generate`
  - `GET /api/v1/families/:familyId/reports`
  - `GET /api/v1/families/:familyId/reports/:id`
  - `GET /api/v1/families/:familyId/reports/:id/export/csv`

- [ ] **Step 1: Define `COMPLIANCE_REPORTS_PUBLIC_API`**
- [ ] **Step 2: Implement `AttendanceController` and `ReportController` with tenant guards**
- [ ] **Step 3: Register `ReportsModule` in `AppModule`**
- [ ] **Step 4: Run boundary check, lint, and typecheck**
- [ ] **Step 5: Commit changes: `feat(reports): register reports module and REST presentation controllers`**

---

### Task 4: Multi-Tenant Isolation & E2E Test Suite

**Files:**
- Create: `apps/api/test/reports.e2e-spec.ts`

- [ ] **Step 1: Write E2E test suite covering multi-tenant family boundary isolation, auth guards, attendance logging, compliance progress, transcript generation, and CSV export**
- [ ] **Step 2: Run E2E test suite: `corepack pnpm --filter @aletheia/api test:e2e test/reports.e2e-spec.ts`**
- [ ] **Step 3: Commit changes: `test(reports): add multi-tenant isolation and reports e2e test suite`**

---

### Task 5: Web Frontend — Attendance Tracker, Compliance Gauges & Official Transcript Generator

**Files:**
- Create: `apps/web/src/components/reports/attendance-tracker-view.tsx`
- Create: `apps/web/src/components/reports/compliance-gauge.tsx`
- Create: `apps/web/src/components/reports/report-generator-view.tsx`
- Create: `apps/web/src/components/reports/printable-transcript.tsx`
- Create: `apps/web/app/(dashboard)/attendance/page.tsx`
- Create: `apps/web/app/(dashboard)/reports/page.tsx`
- Create: `apps/web/tests/reports.test.tsx`

- [ ] **Step 1: Write component tests in `apps/web/tests/reports.test.tsx`**
- [ ] **Step 2: Implement UI components with compliance progress rings, calendar grid, printable document view, and export buttons**
- [ ] **Step 3: Implement `/attendance` and `/reports` Next.js pages**
- [ ] **Step 4: Run web tests, lint, and typecheck**
- [ ] **Step 5: Commit changes: `feat(web): add attendance tracker, compliance gauges, and printable official report generator`**

---

### Task 6: Full Workspace Verification & PR Submission

- [ ] **Step 1: Run complete workspace quality gate:**
  `corepack pnpm check:boundaries && corepack pnpm lint && corepack pnpm typecheck && corepack pnpm test && corepack pnpm test:e2e`
- [ ] **Step 2: Push branch `build/compliance-reports` to origin**
- [ ] **Step 3: Create PR on `Trinity-Grove/Aletheia` and present results**
