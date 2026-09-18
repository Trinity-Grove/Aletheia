# Versioned Jurisdictions & Explainable Compliance Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a versioned, explainable legal compliance engine that evaluates homeschooling requirements across countries/states (Brazil, Uruguay, and priority US states like Texas and Florida) by date of validity, provides an auditable manual override without claiming legal immunity, treats unknown states as "revisão necessária" rather than presumed compliance, and visualizes the breakdown directly in the frontend.

**Architecture:** 
- `@aletheia/contracts` defines versioned compliance evaluation DTOs, criterion breakdown schemas, confidence levels, and manual override audit contracts.
- `apps/api` extends `JurisdictionDefinition` seeds with Uruguay and US priority states (Texas, Florida), adds an immutable `ComplianceManualOverride` audit table, and implements `ComplianceEvaluationService` with rule-boundary evaluation and explainable criteria breakdowns.
- `apps/web` provides a family-facing `ComplianceEvaluationPanel` with jurisdiction badges, explainable criteria cards, "revisão necessária" states, auditable manual overrides, and non-repudiation legal disclaimers.

**Tech Stack:** NestJS, Prisma (PostgreSQL), Zod, React 19, Next.js 15, Vitest, Jest.

**Spec / Issue:** Issue #26 ([P1] Criar motor versionado de jurisdições e conformidade).

## Global Constraints
- Zero AI-attribution trailers (`Co-Authored-By`, `Generated-By`, etc.) in all commits, PRs, or comments.
- Immutability: altering a jurisdiction rule creates a new version and never modifies historical evaluations or reports.
- Unknown states (`UNCERTAIN` confidence or unmapped jurisdiction) MUST resolve to `REVIEW_NEEDED` ("revisão necessária"), NEVER presumed compliance.
- Every evaluation result must report rule code, version, source citation, and confidence level (`ESTABLISHED`, `CONTESTED`, `UNCERTAIN`).
- Mandatory legal disclaimer: "Esta avaliação atesta o alinhamento pedagógico aos parâmetros cadastrados e não constitui salvo-conduto, garantia jurídica ou substituição de orientação legal especializada."
- Test-Driven Development: failing test first, minimal implementation, verification before completion.

---

### Task 1: Contratos e Schemas Zod (`@aletheia/contracts`)

**Files:**
- Modify: `packages/contracts/src/jurisdiction-definition.ts`
- Modify: `packages/contracts/src/index.ts`
- Create / Modify: `packages/contracts/src/jurisdiction-definition.test.ts`

**Interfaces:**
- Produces:
  - `complianceEvaluationStatusSchema`: `'COMPLIANT' | 'IN_PROGRESS' | 'NON_COMPLIANT' | 'REVIEW_NEEDED' | 'EXEMPT'`
  - `criterionEvaluationSchema`
  - `complianceEvaluationResponseSchema`
  - `manualComplianceOverrideSchema`

- [ ] **Step 1: Write failing tests in `packages/contracts/src/jurisdiction-definition.test.ts`**
- [ ] **Step 2: Implement schemas and types in `packages/contracts/src/jurisdiction-definition.ts`**
- [ ] **Step 3: Run tests: `pnpm --filter @aletheia/contracts test`**
- [ ] **Step 4: Commit changes: `feat(contracts): add schemas for compliance evaluation and manual override (issue #26)`**

---

### Task 2: Database Migration & Seeds para Uruguai e EUA (`apps/api`)

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260918120000_add_compliance_manual_overrides/migration.sql`
- Create: `apps/api/src/modules/jurisdictions/infrastructure/uruguay-jurisdiction.seed-data.ts`
- Create: `apps/api/src/modules/jurisdictions/infrastructure/us-texas-jurisdiction.seed-data.ts`
- Create: `apps/api/src/modules/jurisdictions/infrastructure/us-florida-jurisdiction.seed-data.ts`
- Modify: `apps/api/src/modules/jurisdictions/infrastructure/jurisdiction-definition.seeder.ts`
- Modify: `apps/api/src/modules/jurisdictions/infrastructure/jurisdiction-definition.seeder.spec.ts`

**Interfaces:**
- Produces:
  - Table `compliance_manual_overrides`
  - Seeds for `UY` (Uruguay), `US-TX` (Texas), `US-FL` (Florida)
  - `JurisdictionDefinitionSeeder` seeding baseline versions for BR, UY, US-TX, US-FL

- [ ] **Step 1: Add `ComplianceManualOverride` model and migration**
- [ ] **Step 2: Create seeds for UY, US-TX, and US-FL with official statutory citations and confidence levels**
- [ ] **Step 3: Update `JurisdictionDefinitionSeeder` and tests**
- [ ] **Step 4: Run tests: `pnpm --filter @aletheia/api test jurisdiction-definition.seeder`**
- [ ] **Step 5: Commit changes: `feat(api): add manual compliance override model and seeds for UY, US-TX, US-FL (issue #26)`**

---

### Task 3: Motor de Avaliação Explicável de Conformidade (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/jurisdictions/application/compliance-evaluation.service.ts`
- Create: `apps/api/src/modules/jurisdictions/application/compliance-evaluation.service.spec.ts`
- Create: `apps/api/src/modules/jurisdictions/presentation/compliance-evaluation.controller.ts`
- Modify: `apps/api/src/modules/jurisdictions/jurisdictions.module.ts`

**Interfaces:**
- Consumes:
  - `JurisdictionDefinition` catalog
  - `AttendanceRecord` and `AcademicYear`
  - `Learner` and `FamilySettings`
- Produces:
  - `GET /api/v1/families/:familyId/compliance/evaluate?learnerId=...&academicYearId=...`
  - `POST /api/v1/families/:familyId/compliance/override`

- [ ] **Step 1: Write failing unit tests for `ComplianceEvaluationService` (verifying days, hours, age boundaries, missing jurisdiction => REVIEW_NEEDED, manual overrides)**
- [ ] **Step 2: Implement `ComplianceEvaluationService` with criteria breakdown**
- [ ] **Step 3: Implement `ComplianceEvaluationController` with RBAC guards**
- [ ] **Step 4: Register in `JurisdictionsModule`**
- [ ] **Step 5: Run tests: `pnpm --filter @aletheia/api test src/modules/jurisdictions`**
- [ ] **Step 6: Commit changes: `feat(api): implement explainable compliance evaluation engine and manual overrides (issue #26)`**

---

### Task 4: Painel de Conformidade e Jurisdição no Frontend (`apps/web`)

**Files:**
- Create: `apps/web/src/components/compliance/compliance-evaluation-panel.tsx`
- Modify: `apps/web/app/(dashboard)/attendance/page.tsx`
- Create: `apps/web/tests/compliance-evaluation.test.tsx`

**Interfaces:**
- Consumes:
  - `GET /api/v1/families/:familyId/compliance/evaluate`
  - `POST /api/v1/families/:familyId/compliance/override`
- Produces:
  - Interactive compliance breakdown with criteria cards
  - Prominent "Revisão Necessária" badge for uncertain jurisdictions
  - Manual override dialog with required reason
  - Mandatory legal non-repudiation notice

- [ ] **Step 1: Write failing tests in `apps/web/tests/compliance-evaluation.test.tsx`**
- [ ] **Step 2: Implement `ComplianceEvaluationPanel` with explainable criteria breakdown and override modal**
- [ ] **Step 3: Integrate panel into Attendance & Compliance Dashboard**
- [ ] **Step 4: Run tests: `pnpm --filter @aletheia/web test tests/compliance-evaluation.test.tsx`**
- [ ] **Step 5: Commit changes: `feat(web): add explainable compliance evaluation panel and manual override (issue #26)`**

---

### Task 5: Validação Completa, Regressão, PR e Merge

- [ ] **Step 1: Run full test suite: contracts, api, web**
- [ ] **Step 2: Push branch `feat/versioned-jurisdictions-and-compliance` to remote origin**
- [ ] **Step 3: Open PR using `gh pr create` referencing Issue #26**
- [ ] **Step 4: Squash merge PR using `gh pr merge --squash --delete-branch`**
- [ ] **Step 5: Clean up worktree, prune, update `main`**
