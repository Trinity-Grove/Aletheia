# Verifiable Educational Dossiers, Reports & Public Authenticity Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement verifiable academic dossiers and compliance reports (Issue #28): complete generation and PDF rendering for `LEARNING_PORTFOLIO_DOSSIER` and `ANNUAL_COMPLIANCE_REPORT`, in-memory draft preview before report generation, public document verification endpoint (`GET /api/v1/reports/verify/:identifier`) and public verification page (`/verificar/[hash]`), with SHA-256 cryptographic snapshot stamping and clear legal disclaimers.

**Architecture:** Hexagonal architecture across `@aletheia/contracts`, `apps/api` (NestJS/Fastify, Prisma ORM, pdf-lib), and `apps/web` (Next.js 15 App Router, React 19). Multi-tenant isolation strictly enforced per family for report generation; document verification endpoint is public and read-only by SHA-256 content hash.

**Tech Stack:** TypeScript, NestJS, Fastify, Prisma, pdf-lib, Vitest, Jest, Supertest, Next.js 15, React 19, @aletheia/ui.

## Global Constraints
- Node 22 / Fastify adapter in NestJS.
- Zero AI attribution trailers in commits/comments (`Co-Authored-By`, `Generated-By`, etc.).
- Strict multi-tenant isolation: reports only aggregate data belonging to the authenticated `familyId`.
- Deterministic PDF rendering: identical report snapshot produces identical `documentHash` (SHA-256) byte-for-byte.
- No legal safe-conduct ("salvo-conduto") claim: all generated PDFs and verification views must state clearly that the document reflects family-reported data and does not constitute a government or legal guarantee ("não usa a expressão comprovante de não abandono intelectual como garantia").
- 100% of automated tests in `@aletheia/contracts`, `@aletheia/api`, and `@aletheia/web` must pass without regressions.

---

### Task 1: Contracts and Schemas for Dossiers, Compliance Reports & Document Verification

**Files:**
- Modify: `packages/contracts/src/report.ts`
- Modify: `packages/contracts/src/report.test.ts`
- Modify: `packages/contracts/src/index.ts`

**Interfaces:**
- Produces:
  - `LearningPortfolioDossierDto` and `learningPortfolioDossierSchema`
  - `AnnualComplianceReportDto` and `annualComplianceReportSchema`
  - `ReportVerificationResponseDto` and `reportVerificationResponseSchema`
  - `ReportPreviewDto` and `reportPreviewSchema`

- [ ] **Step 1: Write failing test in `packages/contracts/src/report.test.ts` for new schemas**
- [ ] **Step 2: Add `learningPortfolioDossierSchema`, `annualComplianceReportSchema`, `reportVerificationResponseSchema`, `reportPreviewSchema` in `packages/contracts/src/report.ts`**
- [ ] **Step 3: Export schemas and types in `packages/contracts/src/index.ts`**
- [ ] **Step 4: Run `pnpm --filter @aletheia/contracts test` and `pnpm --filter @aletheia/contracts build`**
- [ ] **Step 5: Commit changes: `feat(contracts): add schemas for dossiers, annual compliance and report verification (issue #28)`**

---

### Task 2: Backend Dossier Data Aggregation, Preview & Public Verification API

**Files:**
- Modify: `apps/api/src/modules/reports/application/report.service.ts`
- Modify: `apps/api/src/modules/reports/presentation/report.controller.ts`
- Create: `apps/api/src/modules/reports/presentation/public-report-verification.controller.ts`
- Modify: `apps/api/src/modules/reports/reports.module.ts`
- Modify: `apps/api/src/modules/reports/application/report.service.spec.ts`
- Create: `apps/api/src/modules/reports/presentation/public-report-verification.controller.spec.ts`

**Interfaces:**
- Consumes:
  - `GenerateReportDto`, `LearningPortfolioDossierDto`, `AnnualComplianceReportDto`, `ReportVerificationResponseDto`, `ReportPreviewDto` from `@aletheia/contracts`
  - Prisma models `EvidenceSubmission`, `LearningRecord`, `AttendanceRecord`, `OfficialReport`, `JurisdictionDefinition`
- Produces:
  - `ReportService.previewReport(familyId, dto)`
  - `ReportService.buildLearningPortfolioDossierContent(familyId, dto, learner)`
  - `ReportService.buildAnnualComplianceReportContent(familyId, dto, learner)`
  - `ReportService.verifyReport(identifier)`
  - Endpoint `POST /api/v1/families/:familyId/reports/preview`
  - Public endpoint `GET /api/v1/reports/verify/:identifier`

- [ ] **Step 1: Write failing tests in `report.service.spec.ts` for dossier content building, preview, and verification**
- [ ] **Step 2: Implement `buildLearningPortfolioDossierContent` aggregating evidence submissions and learning records**
- [ ] **Step 3: Implement `buildAnnualComplianceReportContent` aggregating attendance compliance, subject progress, and jurisdiction citations**
- [ ] **Step 4: Implement `previewReport` and `verifyReport` in `ReportService`**
- [ ] **Step 5: Add preview route in `ReportController` and public `PublicReportVerificationController`**
- [ ] **Step 6: Register controllers and dependencies in `ReportsModule`**
- [ ] **Step 7: Run `pnpm --filter @aletheia/api test`**
- [ ] **Step 8: Commit changes: `feat(api): add dossier aggregation, preview and public report verification (issue #28)`**

---

### Task 3: Deterministic PDF Renderers for Learning Portfolio & Annual Compliance

**Files:**
- Create: `apps/api/src/modules/reports/application/learning-portfolio-pdf.renderer.ts`
- Create: `apps/api/src/modules/reports/application/annual-compliance-pdf.renderer.ts`
- Create: `apps/api/src/modules/reports/application/learning-portfolio-pdf.renderer.spec.ts`
- Create: `apps/api/src/modules/reports/application/annual-compliance-pdf.renderer.spec.ts`
- Modify: `apps/api/src/modules/reports/application/report.service.ts`
- Modify: `apps/api/src/modules/reports/reports.module.ts`

**Interfaces:**
- Consumes:
  - `OfficialReportResponseDto`, `LearningPortfolioDossierDto`, `AnnualComplianceReportDto`
  - `pdf-lib`
- Produces:
  - `LearningPortfolioPdfRenderer.render(report, generatedByLabel)`
  - `AnnualCompliancePdfRenderer.render(report, generatedByLabel)`
  - Full binary PDF export for all 4 report types in `ReportService.exportReportPdf`

- [ ] **Step 1: Write failing tests for `LearningPortfolioPdfRenderer` and `AnnualCompliancePdfRenderer` (verifying reproducibility, hash stability, international characters and pagination)**
- [ ] **Step 2: Implement `LearningPortfolioPdfRenderer` with evidence cards, badges, dates, and non-repudiation disclaimer**
- [ ] **Step 3: Implement `AnnualCompliancePdfRenderer` with jurisdiction rule citations, attendance comparison, subject progress, and signature lines**
- [ ] **Step 4: Wire renderers into `ReportService.exportReportPdf` and `ReportsModule`**
- [ ] **Step 5: Run tests across all renderers: `pnpm --filter @aletheia/api test`**
- [ ] **Step 6: Commit changes: `feat(api): add deterministic PDF renderers for portfolio dossier and annual compliance (issue #28)`**

---

### Task 4: Frontend Live Preview and Full Dossier / PDF Integration

**Files:**
- Modify: `apps/web/src/components/reports/report-generator-view.tsx`
- Modify: `apps/web/src/components/reports/printable-transcript.tsx`
- Create: `apps/web/src/components/reports/printable-portfolio-dossier.tsx`
- Create: `apps/web/src/components/reports/printable-compliance-report.tsx`
- Modify: `apps/web/tests/reports.test.tsx`

**Interfaces:**
- Consumes:
  - `POST /api/v1/families/:familyId/reports/preview`
  - `GET /api/v1/families/:familyId/reports/:id/export/pdf`
- Produces:
  - Modal draft preview before official generation
  - Specialized printable views for Portfolio Dossier & Compliance Report
  - PDF export enabled for all 4 report types

- [ ] **Step 1: Write failing tests in `apps/web/tests/reports.test.tsx` for draft preview and dossier rendering**
- [ ] **Step 2: Add `PrintablePortfolioDossier` and `PrintableComplianceReport` components with clean typography and printing styles**
- [ ] **Step 3: Update `ReportGeneratorView` with "Pré-visualizar Rascunho" step and allow PDF export for all report types**
- [ ] **Step 4: Run `pnpm --filter @aletheia/web test`**
- [ ] **Step 5: Commit changes: `feat(web): add draft preview and full printable dossier views (issue #28)`**

---

### Task 5: Public Document Verification Page & Direct Lookup

**Files:**
- Create: `apps/web/app/verificar/page.tsx`
- Create: `apps/web/app/verify/page.tsx`
- Create: `apps/web/src/components/reports/document-verification-view.tsx`
- Create: `apps/web/tests/document-verification.test.tsx`

**Interfaces:**
- Consumes:
  - `GET /api/v1/reports/verify/:identifier`
  - `ReportVerificationResponseDto`
- Produces:
  - Public verification view supporting direct URL hash query (`/verificar?hash=...` or typing hash manually)
  - Clear badge of authenticity and legal disclaimer

- [ ] **Step 1: Write failing tests in `apps/web/tests/document-verification.test.tsx`**
- [ ] **Step 2: Implement `DocumentVerificationView` with search input, result card, verified badge, and legal non-repudiation disclosure**
- [ ] **Step 3: Implement public page routes `/verificar` and `/verify`**
- [ ] **Step 4: Run tests: `pnpm --filter @aletheia/web test`**
- [ ] **Step 5: Commit changes: `feat(web): add public document authenticity verification page (issue #28)`**

---

### Task 6: Full Verification, Regression Check & PR Creation

- [ ] **Step 1: Run full test suite: contracts, api, web**
- [ ] **Step 2: Push branch `feat/verifiable-dossiers-and-reports` to remote origin**
- [ ] **Step 3: Open PR using `gh pr create` referencing Issue #28**
- [ ] **Step 4: Squash merge PR using `gh pr merge --squash --delete-branch`**
- [ ] **Step 5: Clean up worktree, prune, update `main`**
