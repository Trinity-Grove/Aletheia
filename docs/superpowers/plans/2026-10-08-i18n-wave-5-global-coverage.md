# Wave 5 i18n: Global Coverage & Final Module Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Wave 5 of the internationalization roadmap by localizing all remaining 46 frontend files (12 pages and 34 components across auth, settings, learners, invitations, verification, layout, shared, and design system), achieving **100% global i18n coverage across the entire Aletheia web application** in `pt-BR`, `en-US`, and `es-ES`.

**Architecture:** Expand and create dictionaries across `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/`, register them in `index.ts`, bind all hardcoded strings using `useLocale()` and `t(...)`, ensure proper method syntax on interface function props to prevent scanner false positives, update the coverage matrix to 100% (126/126 files), and integrate via green GitHub Actions CI.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5.9, Vitest, Node.js 22, GitHub Actions.

**Spec / Coverage Base:** `docs/i18n-coverage-matrix.md` (Wave 5 section).

## Global Constraints
- ZERO AI attribution trailers (`Co-Authored-By`, `Generated-By`, etc.) in commits, PR descriptions, and code comments.
- 100% dictionary key and token symmetry across `pt-BR`, `en-US`, and `es-ES`.
- Method syntax on interface function props (e.g. `onClose?(): void;`, `onSave?(...): Promise<void>;`) to eliminate scanner regex collisions (`> Promise<...`).
- Clean module boundaries (`pnpm check:boundaries` MUST pass with 14/14 tests).
- Isolated worktree `.worktrees/i18n-wave-5-global-coverage` on branch `feat/i18n-wave-5-global-coverage`.
- Preserve untouched other worktrees (`.worktrees/weekly-support-feedback-widget`).
- Never merge PR without verifying 100% GREEN GitHub Actions CI status.

---

### Task 1: Dicionários Globais & Testes TDD da Onda 5

**Files:**
- Modify / Create: `apps/web/src/lib/i18n/dictionaries/pt-BR/` (`auth.ts`, `settings.ts`, `learners.ts`, `invitations.ts`, `landing.ts`, `shared.ts`, `showcase.ts`)
- Modify / Create: `apps/web/src/lib/i18n/dictionaries/en-US/` (identical structure)
- Modify / Create: `apps/web/src/lib/i18n/dictionaries/es-ES/` (identical structure)
- Modify: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/index.ts`
- Create: `apps/web/tests/wave-5-global-i18n.test.tsx`

- [ ] **Step 1: Write TDD test suite validating dictionary symmetry for Wave 5 namespaces**
- [ ] **Step 2: Run test to capture RED failure**
- [ ] **Step 3: Implement/expand dictionaries in pt-BR, en-US, and es-ES**
- [ ] **Step 4: Register all dictionaries in index.ts for all three locales**
- [ ] **Step 5: Run tests to verify GREEN status (`tests/wave-5-global-i18n.test.tsx`, `tests/i18n.test.tsx`)**
- [ ] **Step 6: Commit changes**
  ```bash
  git add apps/web/src/lib/i18n/dictionaries/ apps/web/tests/wave-5-global-i18n.test.tsx
  git commit -m "feat(i18n): create and expand dictionaries for wave 5 global coverage"
  ```

---

### Task 2: Autenticação, Convites e Verificação (6 páginas + 9 componentes)

**Files:**
- Modify Pages:
  - `apps/web/app/convite/[token]/page.tsx`
  - `apps/web/app/invite/[token]/page.tsx`
  - `apps/web/app/verificar/page.tsx`
  - `apps/web/app/verify/page.tsx`
  - `apps/web/app/aluno/page.tsx`
  - `apps/web/app/(dashboard)/schedule/page.tsx`
- Modify Components:
  - `apps/web/src/components/auth/email-code-verify-form.tsx`
  - `apps/web/src/components/auth/forgot-password-form.tsx`
  - `apps/web/src/components/auth/login-form.tsx`
  - `apps/web/src/components/auth/mfa-verify-form.tsx`
  - `apps/web/src/components/auth/register-form.tsx`
  - `apps/web/src/components/auth/reset-password-form.tsx`
  - `apps/web/src/components/auth/role-guard.tsx`
  - `apps/web/src/components/auth/verify-email-form.tsx`
  - `apps/web/src/components/invitations/invitation-accept-view.tsx`

- [ ] **Step 1: Localize auth form components and verify method syntax on props**
- [ ] **Step 2: Localize invitation accept view and invitation pages**
- [ ] **Step 3: Localize verification pages, aluno dashboard page, and schedule page**
- [ ] **Step 4: Run static scanner on all 15 files to verify 0 hardcoded strings**
- [ ] **Step 5: Commit changes**
  ```bash
  git add apps/web/app/convite/ apps/web/app/invite/ apps/web/app/verificar/ apps/web/app/verify/ apps/web/app/aluno/page.tsx apps/web/app/(dashboard)/schedule/page.tsx apps/web/src/components/auth/ apps/web/src/components/invitations/
  git commit -m "feat(i18n): localize auth, invitations, verification, and schedule views"
  ```

---

### Task 3: Módulo de Educandos & Portal do Aluno (1 página + 8 componentes)

**Files:**
- Modify Page:
  - `apps/web/app/(dashboard)/learners/page.tsx`
- Modify Components:
  - `apps/web/src/components/learners/learner-access-modal.tsx`
  - `apps/web/src/components/learners/learner-achievements-modal.tsx`
  - `apps/web/src/components/learners/learner-card.tsx`
  - `apps/web/src/components/learners/learner-form-modal.tsx`
  - `apps/web/src/components/learners/learners-list.tsx`
  - `apps/web/src/components/dashboard/learner-focus-header.tsx`
  - `apps/web/src/components/learner-portal/learner-progress-view.tsx`
  - `apps/web/src/components/learner-portal/learner-reflection-modal.tsx`

- [ ] **Step 1: Localize learners dashboard page and header components**
- [ ] **Step 2: Localize learner modals and list components**
- [ ] **Step 3: Localize learner portal progress view and reflection modal**
- [ ] **Step 4: Run static scanner on all 9 files to verify 0 hardcoded strings**
- [ ] **Step 5: Commit changes**
  ```bash
  git add apps/web/app/(dashboard)/learners/page.tsx apps/web/src/components/learners/ apps/web/src/components/dashboard/learner-focus-header.tsx apps/web/src/components/learner-portal/
  git commit -m "feat(i18n): localize learners management and student portal components"
  ```

---

### Task 4: Módulo de Configurações da Família (2 páginas + 12 componentes)

**Files:**
- Modify Pages:
  - `apps/web/app/(dashboard)/settings/page.tsx`
  - `apps/web/app/(dashboard)/settings/privacy/page.tsx`
- Modify Components:
  - `apps/web/src/components/settings/account-activity-log.tsx`
  - `apps/web/src/components/settings/account-security-settings.tsx`
  - `apps/web/src/components/settings/data-backup-card.tsx`
  - `apps/web/src/components/settings/data-backup-settings.tsx`
  - `apps/web/src/components/settings/family-general-settings.tsx`
  - `apps/web/src/components/settings/family-members-settings.tsx`
  - `apps/web/src/components/settings/mfa-settings-card.tsx`
  - `apps/web/src/components/settings/notification-preferences.tsx`
  - `apps/web/src/components/settings/pedagogical-theological-profile-settings.tsx`
  - `apps/web/src/components/settings/privacy-compliance-banner.tsx`
  - `apps/web/src/components/settings/privacy-consent-settings.tsx`
  - `apps/web/src/components/settings/settings-form-kit.tsx`

- [ ] **Step 1: Localize settings pages (general and privacy)**
- [ ] **Step 2: Localize security, MFA, activity, and notification settings cards**
- [ ] **Step 3: Localize data backup, family profile, members, and privacy compliance cards**
- [ ] **Step 4: Run static scanner on all 14 files to verify 0 hardcoded strings**
- [ ] **Step 5: Commit changes**
  ```bash
  git add apps/web/app/(dashboard)/settings/ apps/web/src/components/settings/
  git commit -m "feat(i18n): localize family settings, security, backup, and privacy compliance"
  ```

---

### Task 5: Shell, Layout, Home/Landing, Shared & Design System (3 páginas + 5 componentes)

**Files:**
- Modify Pages:
  - `apps/web/app/page.tsx` (landing / home)
  - `apps/web/app/layout.tsx` (root layout)
  - `apps/web/app/(dashboard)/design-system/page.tsx`
- Modify Components:
  - `apps/web/src/components/layout/notification-bell.tsx`
  - `apps/web/src/components/layout/product-shell.tsx`
  - `apps/web/src/components/product-shell.tsx`
  - `apps/web/src/components/shared/legal-document-content.tsx`
  - `apps/web/src/components/design-system/design-system-showcase.tsx`

- [ ] **Step 1: Localize root layout, landing page, and shell notification bell**
- [ ] **Step 2: Localize product shell wrappers and legal document content**
- [ ] **Step 3: Localize design system showcase and design system page**
- [ ] **Step 4: Run static scanner on all 8 files to verify 0 hardcoded strings**
- [ ] **Step 5: Commit changes**
  ```bash
  git add apps/web/app/page.tsx apps/web/app/layout.tsx apps/web/app/(dashboard)/design-system/page.tsx apps/web/src/components/layout/ apps/web/src/components/product-shell.tsx apps/web/src/components/shared/ apps/web/src/components/design-system/
  git commit -m "feat(i18n): localize root layout, landing page, product shells, and design system"
  ```

---

### Task 6: Portões de Qualidade, 100% Coverage Matrix & Validação Geral

**Files:**
- Modify: `docs/i18n-coverage-matrix.md`

- [ ] **Step 1: Run static audit scanner across entire frontend (`0 failing files, 126/126 fully localized`)**
- [ ] **Step 2: Regenerate matrix markdown via `node scripts/audit-i18n-coverage.mjs --markdown > docs/i18n-coverage-matrix.md`**
- [ ] **Step 3: Run `pnpm check:boundaries` (14/14 tests)**
- [ ] **Step 4: Run `pnpm -r --workspace-concurrency=1 typecheck` (0 errors)**
- [ ] **Step 5: Run `pnpm lint` (0 errors)**
- [ ] **Step 6: Run all vitest suites across `@aletheia/web`**
- [ ] **Step 7: Commit matrix update**
  ```bash
  git add docs/i18n-coverage-matrix.md
  git commit -m "docs(i18n): achieve 100% frontend internationalization coverage across all waves"
  ```

---

### Task 7: Pull Request, Validação no GitHub Actions CI & Integração

- [ ] **Step 1: Push branch `feat/i18n-wave-5-global-coverage` to origin**
- [ ] **Step 2: Open PR via `gh pr create` with zero AI attribution trailers**
- [ ] **Step 3: Monitor GitHub Actions CI runs until 100% GREEN**
- [ ] **Step 4: Squash-merge PR into `main`**
- [ ] **Step 5: Sync local `main` with origin (`git pull --ff-only origin main`)**
- [ ] **Step 6: Clean up worktree `.worktrees/i18n-wave-5-global-coverage` and branches**
