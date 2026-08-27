# Full Design as Code System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the standalone `@aletheia/ui` design system package with strongly-typed tokens, full accessible component suite (with focus trap & a11y), clean CSS architectures without inline styles, updated approved dashboard (`DailyJourney`, `ScriptureCard`, `ActivityList`), and legally prudent copy.

**Architecture:** A standalone monorepo workspace package `packages/ui` exporting typed tokens, atomic stylesheets, and accessible React primitives. `apps/web` consumes `@aletheia/ui` via workspace dependency, removing duplicated component files and eliminating arbitrary inline styles.

**Tech Stack:** React 19, TypeScript 5.9, Vitest, Testing Library, Vanilla CSS Custom Properties (Design Tokens), Next.js 16.3.2.

## Global Constraints
- Strict TypeScript (`exactOptionalPropertyTypes: true`).
- Zero arbitrary inline styles in primitives (`style={{ ... }}` prohibited in favor of `.ui-*` token classes).
- Accessible focus management in modals (focus trapping, initial focus, return focus on close).
- All tests, boundary checks, lint, and typechecks must pass cleanly.
- Copy must use legally prudent wording for homeschool records ("Registros acadêmicos estruturados e relatórios de apoio pedagógico").

---

### Task 1: Package Scaffolding & Design Tokens (`packages/ui`)

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/tsconfig.typecheck.json`
- Create: `packages/ui/src/tokens/colors.ts`
- Create: `packages/ui/src/tokens/typography.ts`
- Create: `packages/ui/src/tokens/spacing.ts`
- Create: `packages/ui/src/tokens/shadows.ts`
- Create: `packages/ui/src/tokens/radii.ts`
- Create: `packages/ui/src/tokens/index.ts`
- Create: `packages/ui/src/tokens/tokens.test.ts`
- Create: `packages/ui/src/styles/tokens.css`
- Create: `packages/ui/src/styles/components.css`
- Create: `packages/ui/src/styles/index.css`

- [ ] **Step 1:** Create `packages/ui/package.json`, `tsconfig.json`, and `tsconfig.typecheck.json`.
- [ ] **Step 2:** Write tests in `packages/ui/src/tokens/tokens.test.ts` verifying all token constants match Trinity Grove brand contracts.
- [ ] **Step 3:** Implement token files in `packages/ui/src/tokens/` (`colors.ts`, `typography.ts`, `spacing.ts`, `shadows.ts`, `radii.ts`, `index.ts`).
- [ ] **Step 4:** Implement `packages/ui/src/styles/tokens.css` (fixing font circularity) and `packages/ui/src/styles/components.css`.
- [ ] **Step 5:** Run `corepack pnpm --filter @aletheia/ui test` and `corepack pnpm --filter @aletheia/ui build`.
- [ ] **Step 6:** Commit Task 1.

---

### Task 2: Accessible UI Primitives in `@aletheia/ui`

**Files:**
- Create: `packages/ui/src/components/button.tsx`
- Create: `packages/ui/src/components/icon-button.tsx`
- Create: `packages/ui/src/components/text-link.tsx`
- Create: `packages/ui/src/components/card.tsx`
- Create: `packages/ui/src/components/badge.tsx`
- Create: `packages/ui/src/components/modal.tsx` (with focus trap, initial focus, return focus)
- Create: `packages/ui/src/components/input.tsx`
- Create: `packages/ui/src/components/select.tsx`
- Create: `packages/ui/src/components/textarea.tsx`
- Create: `packages/ui/src/components/switch.tsx`
- Create: `packages/ui/src/components/checkbox.tsx`
- Create: `packages/ui/src/components/alert.tsx`
- Create: `packages/ui/src/components/progress.tsx`
- Create: `packages/ui/src/components/empty-state.tsx`
- Create: `packages/ui/src/components/page-header.tsx`
- Create: `packages/ui/src/components/scripture-card.tsx`
- Create: `packages/ui/src/components/index.ts`
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/tests/components.test.tsx`
- Create: `packages/ui/tests/modal-a11y.test.tsx`

- [ ] **Step 1:** Write component and accessibility tests in `packages/ui/tests/`.
- [ ] **Step 2:** Implement all 16 atomic UI primitives with zero inline styles and full ARIA support.
- [ ] **Step 3:** Implement `modal.tsx` with complete focus management (trap, restore focus, label linking).
- [ ] **Step 4:** Run tests: `corepack pnpm --filter @aletheia/ui test`.
- [ ] **Step 5:** Commit Task 2.

---

### Task 3: Migrate `apps/web` to `@aletheia/ui` & Clean Inline Styles

**Files:**
- Modify: `apps/web/package.json` (add `@aletheia/ui: "workspace:*"`)
- Modify: `apps/web/app/layout.tsx` (import `@aletheia/ui/css`)
- Modify: `apps/web/app/globals.css` (clean redundant styles)
- Modify: `apps/web/src/components/layout/product-shell.tsx` (clean inline styles, consume `@aletheia/ui`)
- Modify: `apps/web/src/components/design-system/design-system-showcase.tsx` (consume all `@aletheia/ui` primitives)

- [ ] **Step 1:** Add `@aletheia/ui` to `apps/web/package.json` and install.
- [ ] **Step 2:** Replace local `apps/web/src/components/ui/` with imports from `@aletheia/ui`.
- [ ] **Step 3:** Remove inline `style={{ ... }}` across `product-shell.tsx` and showcase components in favor of CSS token classes.
- [ ] **Step 4:** Run `corepack pnpm --filter @aletheia/web test` and `corepack pnpm typecheck`.
- [ ] **Step 5:** Commit Task 3.

---

### Task 4: Implement Approved Dashboard with `DailyJourney` & Prudent Copy

**Files:**
- Create: `apps/web/src/components/dashboard/daily-journey.tsx`
- Create: `apps/web/src/components/dashboard/activity-list.tsx`
- Create: `apps/web/src/components/dashboard/learner-focus-header.tsx`
- Modify: `apps/web/app/page.tsx` (implement full daily journey dashboard with active learner state, ScriptureCard, and legally prudent copy)
- Create: `apps/web/tests/dashboard.test.tsx`

- [ ] **Step 1:** Write component test suite in `apps/web/tests/dashboard.test.tsx`.
- [ ] **Step 2:** Implement `DailyJourney`, `ActivityList`, `LearnerFocusHeader`.
- [ ] **Step 3:** Overhaul `apps/web/app/page.tsx` to render the approved dashboard layout.
- [ ] **Step 4:** Verify copy disclaimers regarding academic records and compliance.
- [ ] **Step 5:** Run full quality gate and commit Task 4.

---

### Task 5: End-to-End Verification & Merge

- [ ] **Step 1:** Run `pnpm verify` (boundary check, lint, typecheck, unit tests, API e2e, distribution).
- [ ] **Step 2:** Run `corepack pnpm --filter @aletheia/web test:e2e`.
- [ ] **Step 3:** Push branch `feat/complete-design-as-code-system`, create PR and merge into `main`.
