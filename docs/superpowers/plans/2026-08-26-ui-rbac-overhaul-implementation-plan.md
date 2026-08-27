# UI Design System Overhaul & Frontend RBAC Guards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Aletheia frontend into a visually stunning, warm, and highly polished home education platform while integrating strict client-side Role-Based Access Control (RBAC) to enforce permission boundaries across Owner Guardians, Guardians, Co-Guardians, and Educators.

**Architecture:** Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons, TypeScript with strict exactOptionalPropertyTypes.

## Global Constraints
- Strict TypeScript (`exactOptionalPropertyTypes: true`, `noImplicitAny: true`).
- No `console.log` or `console.error` (ESLint rule).
- Multi-tenant family boundaries strictly preserved.
- Sibling ranking and comparative shaming strictly prohibited.
- Role matrix:
  - `OWNER_GUARDIAN`: Complete administrative & financial authority, family deletion, transfer ownership.
  - `GUARDIAN` / `CO_GUARDIAN`: Full educational and member management, transcript generation, settings updates.
  - `EDUCATOR`: Educational execution only (can log lessons, attendance, records, portfolio evidence; cannot delete learners, change legal requirements, alter family settings, or invite members).

---

### Task 1: Frontend RBAC Context, Permission Matrix & UI Guards

**Files:**
- Create: `apps/web/src/lib/auth/rbac-context.tsx`
- Create: `apps/web/src/lib/auth/use-permissions.ts`
- Create: `apps/web/src/components/auth/role-guard.tsx`
- Create: `apps/web/src/components/auth/role-badge.tsx`
- Create: `apps/web/tests/rbac-guards.test.tsx`

**Interfaces:**
- Produces:
  - `RoleProvider`, `useAuthRole`, `usePermissions` hook.
  - `<RequireRole roles={[...]} fallback={...}>{children}</RequireRole>`
  - `<Can action="manage_family" | "delete_learner" | "edit_settings" | "log_learning" | "generate_transcripts" fallback={...}>{children}</Can>`
  - `<RoleBadge role="OWNER_GUARDIAN" | "GUARDIAN" | "CO_GUARDIAN" | "EDUCATOR" />`

- [ ] **Step 1: Write RBAC unit & component tests in `apps/web/tests/rbac-guards.test.tsx`**
- [ ] **Step 2: Implement `rbac-context.tsx`, `use-permissions.ts`, `role-guard.tsx`, and `role-badge.tsx`**
- [ ] **Step 3: Run web tests, lint, and typecheck**
- [ ] **Step 4: Commit changes: `feat(web): add frontend RBAC context, permission matrix and role guard components`**

---

### Task 2: Design System Tokens, Typography & Global Styles Overhaul

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/src/components/layout/product-shell.tsx`
- Modify: `apps/web/src/components/layout/notification-bell.tsx`
- Modify: `apps/web/src/components/layout/learner-focus-switcher.tsx`
- Create: `apps/web/src/components/ui/card.tsx`
- Create: `apps/web/src/components/ui/button.tsx`
- Create: `apps/web/src/components/ui/badge.tsx`
- Create: `apps/web/src/components/ui/modal.tsx`
- Create: `apps/web/tests/ui-components.test.tsx`

- [ ] **Step 1: Write UI component tests in `apps/web/tests/ui-components.test.tsx`**
- [ ] **Step 2: Modernize `globals.css` with Aletheia palette (Slate/Navy `#0F172A`, Indigo `#4F46E5`, Amber `#D97706`, Emerald `#059669`, Parchment neutrals), modern gradients, shadows, and responsive layout classes**
- [ ] **Step 3: Implement reusable UI primitives (`Card`, `Button`, `Badge`, `Modal`)**
- [ ] **Step 4: Overhaul `ProductShell` with floating glass header, sleek collapsible sidebar, active route indicators, learner focus chip, and role badge**
- [ ] **Step 5: Run web tests, lint, and typecheck**
- [ ] **Step 6: Commit changes: `feat(web): modernize design system, layout shell, and reusable UI primitives`**

---

### Task 3: Visual Polish & RBAC Gating across Educational Views (Learners, Devotionals, Curriculum & Lessons)

**Files:**
- Modify: `apps/web/src/components/learners/learner-card.tsx`
- Modify: `apps/web/src/components/learners/learners-list.tsx`
- Modify: `apps/web/src/components/devotional/devotional-view.tsx`
- Modify: `apps/web/src/components/devotional/prayer-journal.tsx`
- Modify: `apps/web/src/components/curriculum/curriculum-view.tsx`
- Modify: `apps/web/src/components/curriculum/subject-card.tsx`
- Modify: `apps/web/src/components/lessons/daily-agenda-view.tsx`
- Modify: `apps/web/src/components/lessons/weekly-routine-grid.tsx`
- Modify: `apps/web/tests/learners.test.tsx`
- Modify: `apps/web/tests/devotional.test.tsx`
- Modify: `apps/web/tests/curriculum.test.tsx`
- Modify: `apps/web/tests/lessons.test.tsx`

- [ ] **Step 1: Apply UI redesign to Learners (avatar rings, stage chips, RBAC delete guard for educators)**
- [ ] **Step 2: Apply UI redesign to Devotional & Prayer Journal (warm scripture cards, answered prayer celebrations)**
- [ ] **Step 3: Apply UI redesign to Curriculum & Objectives (colored subject badges, clean progress gauges)**
- [ ] **Step 4: Apply UI redesign to Daily Agenda & Weekly Routine (checklist cards, status tags, smooth modals)**
- [ ] **Step 5: Run web tests, lint, and typecheck**
- [ ] **Step 6: Commit changes: `feat(web): overhaul visual layout and apply RBAC gating to learning modules`**

---

### Task 4: Visual Polish & RBAC Gating across Assessment, Reports & Settings

**Files:**
- Modify: `apps/web/src/components/records/records-journal-view.tsx`
- Modify: `apps/web/src/components/records/record-card.tsx`
- Modify: `apps/web/src/components/records/portfolio-gallery-view.tsx`
- Modify: `apps/web/src/components/reports/attendance-tracker-view.tsx`
- Modify: `apps/web/src/components/reports/compliance-gauge.tsx`
- Modify: `apps/web/src/components/reports/report-generator-view.tsx`
- Modify: `apps/web/src/components/reports/printable-transcript.tsx`
- Modify: `apps/web/src/components/settings/family-general-settings.tsx`
- Modify: `apps/web/src/components/settings/data-backup-card.tsx`
- Modify: `apps/web/tests/records.test.tsx`
- Modify: `apps/web/tests/reports.test.tsx`
- Modify: `apps/web/tests/settings.test.tsx`

- [ ] **Step 1: Polish Records Journal & Evidence Gallery (media card hover zoom, mastery pills, habit reflection chips)**
- [ ] **Step 2: Polish Attendance & Official Transcripts (compliance circular gauges, printable official seal, RBAC lock for legal targets)**
- [ ] **Step 3: Polish Settings & Data Backup (role badges on member list, sovereign backup download button, educator restricted notices)**
- [ ] **Step 4: Run web tests, lint, and typecheck**
- [ ] **Step 5: Commit changes: `feat(web): overhaul records, reports, transcripts and settings with premium UI and RBAC`**

---

### Task 5: Full Workspace Quality Gate & PR Submission

- [ ] **Step 1: Run complete workspace quality gate:**
  `corepack pnpm check:boundaries && corepack pnpm lint && corepack pnpm typecheck && corepack pnpm test && corepack pnpm test:e2e`
- [ ] **Step 2: Push branch `build/ui-rbac-overhaul` to origin**
- [ ] **Step 3: Create PR on `Trinity-Grove/Aletheia` and present results**
