# Wave 4 i18n: Reports, Compliance Dossiers & Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Localize all 10 target files in Wave 4 of the i18n roadmap (2 pages and 8 components across `reports`, `portfolio`, and `compliance`), establishing 100% dictionary key and interpolation symmetry across `pt-BR`, `en-US`, and `es-ES`, updating the coverage matrix, and integrating cleanly with green CI.

**Architecture:** Create modular dictionaries `reports.ts` and `compliance.ts` in `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/`, register them in `index.ts`, and bind all strings using `useLocale()` and `t(...)`. Ensure method syntax on component prop interfaces to prevent parser regex collisions.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5.9, Vitest, Node.js 22, GitHub Actions.

**Spec / Coverage Base:** `docs/i18n-coverage-matrix.md` (Wave 4 section).

## Global Constraints
- ZERO AI attribution trailers (`Co-Authored-By`, `Generated-By`, etc.) in commits, PR descriptions, and code comments.
- 100% dictionary key and token symmetry across `pt-BR`, `en-US`, and `es-ES`.
- Method syntax on interface function props (e.g. `onClose(): void;` instead of `onClose: () => void;`) to eliminate scanner false positives.
- Clean module boundaries (`pnpm check:boundaries` MUST pass with 14/14 tests).
- Isolated worktree `.worktrees/i18n-wave-4-reports` on branch `feat/i18n-wave-4-reports`.
- Preserve untouched other worktrees (`.worktrees/weekly-support-feedback-widget`).
- Never merge PR without verifying 100% GREEN GitHub Actions CI status.

---

### Task 1: Dicionários i18n & Suíte de Testes TDD (Wave 4)

**Files:**
- Create: `apps/web/src/lib/i18n/dictionaries/pt-BR/reports.ts`
- Create: `apps/web/src/lib/i18n/dictionaries/en-US/reports.ts`
- Create: `apps/web/src/lib/i18n/dictionaries/es-ES/reports.ts`
- Create: `apps/web/src/lib/i18n/dictionaries/pt-BR/compliance.ts`
- Create: `apps/web/src/lib/i18n/dictionaries/en-US/compliance.ts`
- Create: `apps/web/src/lib/i18n/dictionaries/es-ES/compliance.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/index.ts`
- Create: `apps/web/tests/reports-compliance-i18n.test.tsx`

- [ ] **Step 1: Write TDD test suite for reports & compliance dictionary parity**
- [ ] **Step 2: Run test to capture RED failure**
- [ ] **Step 3: Implement reports and compliance dictionaries in pt-BR, en-US, and es-ES**
- [ ] **Step 4: Register new dictionaries in index.ts for all three locales**
- [ ] **Step 5: Run tests to verify GREEN status (`tests/reports-compliance-i18n.test.tsx`, `tests/i18n.test.tsx`)**
- [ ] **Step 6: Commit changes**
  ```bash
  git add apps/web/src/lib/i18n/dictionaries/ apps/web/tests/reports-compliance-i18n.test.tsx
  git commit -m "feat(i18n): create reports and compliance dictionaries with 100% parity across pt-BR, en-US, and es-ES"
  ```

---

### Task 2: Páginas de Relatórios e Portfólio (2 arquivos)

**Files:**
- Modify: `apps/web/app/(dashboard)/portfolio/page.tsx`
- Modify: `apps/web/app/(dashboard)/reports/page.tsx`

- [ ] **Step 1: Localize portfolio dashboard page using `useLocale` and `t('reports.portfolioPage.*')`**
- [ ] **Step 2: Localize reports dashboard page using `useLocale` and `t('reports.reportsPage.*')`**
- [ ] **Step 3: Run static scanner on both pages to verify 0 hardcoded strings**
- [ ] **Step 4: Commit changes**
  ```bash
  git add apps/web/app/(dashboard)/portfolio/page.tsx apps/web/app/(dashboard)/reports/page.tsx
  git commit -m "feat(i18n): localize portfolio and reports dashboard pages"
  ```

---

### Task 3: Componentes de Conformidade & Verificação (3 arquivos)

**Files:**
- Modify: `apps/web/src/components/compliance/compliance-evaluation-panel.tsx`
- Modify: `apps/web/src/components/reports/compliance-gauge.tsx`
- Modify: `apps/web/src/components/reports/document-verification-view.tsx`

- [ ] **Step 1: Fix prop interface signatures and localize `compliance-evaluation-panel.tsx`**
- [ ] **Step 2: Fix prop signatures and localize `compliance-gauge.tsx`**
- [ ] **Step 3: Fix prop signatures and localize `document-verification-view.tsx`**
- [ ] **Step 4: Run static scanner on all 3 files to verify 0 hardcoded strings**
- [ ] **Step 5: Commit changes**
  ```bash
  git add apps/web/src/components/compliance/ apps/web/src/components/reports/compliance-gauge.tsx apps/web/src/components/reports/document-verification-view.tsx
  git commit -m "feat(i18n): localize compliance panel, compliance gauge, and document verification components"
  ```

---

### Task 4: Componentes de Visualização Imprimível / Dossiês Oficiais (3 arquivos)

**Files:**
- Modify: `apps/web/src/components/reports/printable-compliance-report.tsx`
- Modify: `apps/web/src/components/reports/printable-portfolio-dossier.tsx`
- Modify: `apps/web/src/components/reports/printable-transcript.tsx`

- [ ] **Step 1: Fix prop signatures and localize `printable-compliance-report.tsx`**
- [ ] **Step 2: Fix prop signatures and localize `printable-portfolio-dossier.tsx`**
- [ ] **Step 3: Fix prop signatures and localize `printable-transcript.tsx`**
- [ ] **Step 4: Run static scanner on all 3 files to verify 0 hardcoded strings**
- [ ] **Step 5: Commit changes**
  ```bash
  git add apps/web/src/components/reports/printable-*.tsx
  git commit -m "feat(i18n): localize printable compliance, dossier, and transcript components"
  ```

---

### Task 5: Componentes de Rastreamento e Gerador de Relatórios (2 arquivos)

**Files:**
- Modify: `apps/web/src/components/reports/attendance-tracker-view.tsx`
- Modify: `apps/web/src/components/reports/report-generator-view.tsx`

- [ ] **Step 1: Fix prop signatures and localize `attendance-tracker-view.tsx`**
- [ ] **Step 2: Fix prop signatures and localize `report-generator-view.tsx`**
- [ ] **Step 3: Run static scanner on both files to verify 0 hardcoded strings**
- [ ] **Step 4: Commit changes**
  ```bash
  git add apps/web/src/components/reports/attendance-tracker-view.tsx apps/web/src/components/reports/report-generator-view.tsx
  git commit -m "feat(i18n): localize attendance tracker and report generator components"
  ```

---

### Task 6: Portões de Qualidade & Atualização da Matriz de Cobertura

**Files:**
- Modify: `docs/i18n-coverage-matrix.md`

- [ ] **Step 1: Run static audit scanner on all 10 Wave 4 files (must report 0 failing files)**
- [ ] **Step 2: Regenerate matrix markdown via `node scripts/audit-i18n-coverage.mjs --markdown > docs/i18n-coverage-matrix.md`**
- [ ] **Step 3: Run `pnpm check:boundaries` (14/14 tests)**
- [ ] **Step 4: Run `pnpm -r --workspace-concurrency=1 typecheck` (0 errors)**
- [ ] **Step 5: Run `pnpm lint` (0 errors)**
- [ ] **Step 6: Run vitest test suites in `@aletheia/web`**
- [ ] **Step 7: Commit matrix update**
  ```bash
  git add docs/i18n-coverage-matrix.md
  git commit -m "docs(i18n): update coverage matrix for wave 4 reports and compliance"
  ```

---

### Task 7: Pull Request, Validação no GitHub Actions CI & Integração

- [ ] **Step 1: Push branch `feat/i18n-wave-4-reports` to origin**
- [ ] **Step 2: Open PR via `gh pr create` with zero AI attribution trailers**
- [ ] **Step 3: Monitor GitHub Actions CI runs until 100% GREEN**
- [ ] **Step 4: Squash-merge PR into `main`**
- [ ] **Step 5: Sync local `main` with origin (`git pull --ff-only origin main`)**
- [ ] **Step 6: Clean up worktree `.worktrees/i18n-wave-4-reports` and branches**
