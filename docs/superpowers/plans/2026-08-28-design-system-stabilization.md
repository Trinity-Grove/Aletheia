# Design System Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish and verify the Antigravity design-system changes without losing existing work or expanding into the dashboard backend.

**Architecture:** `@aletheia/ui` owns layered tokens, accessible structural primitives, and presentation-only dashboard patterns. `ProductShell` remains a Next.js integration adapter that supplies navigation, family, permission, and notification data to the shared shell.

**Tech Stack:** React 19, TypeScript 5.9, vanilla CSS custom properties, Lucide React, Vitest, Testing Library, Next.js 16.3.2.

**Spec:** `docs/superpowers/specs/2026-08-28-design-as-code-stabilization-dashboard-design.md`

## Global Constraints

- Preserve all inherited uncommitted Antigravity changes and review them file by file.
- Native `<option>` elements contain text only.
- Public UI components emit stable `ui-*` classes and no arbitrary inline style objects.
- `ProductShell` keeps its existing call-site compatibility.
- `DailyJourney` and `ActivityList` contain no routing, storage, authentication, or HTTP behavior.
- Each task finishes with focused verification before its commit.

---

### Task 1: Make native select rendering warning-free

**Files:**
- Modify: `apps/web/src/components/records/records-journal-view.tsx`
- Modify: `apps/web/src/components/reports/attendance-tracker-view.tsx`
- Modify: `apps/web/src/components/records/portfolio-gallery-view.tsx`
- Modify: `apps/web/src/components/records/portfolio-item-modal.tsx`
- Modify: `apps/web/src/components/records/record-form-modal.tsx`
- Modify: `apps/web/src/components/reports/report-generator-view.tsx`
- Test: `apps/web/tests/ui-components.test.tsx`

**Interfaces:**
- Consumes: existing label configuration objects such as `RECORD_TYPE_LABELS` and `ATTENDANCE_STATUS_CONFIG`.
- Produces: native options whose children are strings, while retaining icons in non-option UI.

- [ ] **Step 1: Add a failing console-safety regression test**

Wrap representative record and attendance select renders with a console trap:

```tsx
const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
render(<RecordsJournalView {...requiredProps} />);
expect(consoleError).not.toHaveBeenCalled();
expect(
  screen.getByRole('option', { name: 'Lição' }).querySelector('svg'),
).toBeNull();
consoleError.mockRestore();
```

- [ ] **Step 2: Run the focused test and confirm the inherited baseline**

Run: `pnpm --filter @aletheia/web test -- ui-components.test.tsx`

Expected before corrections are complete: FAIL because an option contains a rendered icon or React emits an option-descendant warning.

- [ ] **Step 3: Convert every affected native option to text-only content**

Use the same form at every mapped occurrence:

```tsx
<option key={key} value={key}>
  {item.label}
</option>
```

Do not remove `item.icon` from configuration objects used by cards, badges, or custom interactive controls.

- [ ] **Step 4: Run the focused test and scan all native options**

Run: `pnpm --filter @aletheia/web test -- ui-components.test.tsx`

Run: `rg -n -U '<option[^>]*>\s*\{[^}]*\.icon\}' apps/web packages/ui`

Expected: test PASS and search returns no matches.

- [ ] **Step 5: Commit the native select fix**

```bash
git add apps/web/src/components/records apps/web/src/components/reports apps/web/tests/ui-components.test.tsx
git commit -m "fix(web): keep native select options text only"
```

---

### Task 2: Verify and complete the three-layer token contract

**Files:**
- Modify: `packages/ui/src/styles/tokens-primitive.css`
- Modify: `packages/ui/src/styles/tokens-semantic.css`
- Modify: `packages/ui/src/styles/tokens-component.css`
- Modify: `packages/ui/src/styles/tokens.css`
- Modify: `packages/ui/src/styles/components.css`
- Test: `packages/ui/tests/tokens-css.test.ts`

**Interfaces:**
- Consumes: existing Trinity Grove palette, spacing, typography, radii, and shadows.
- Produces: `tokens.css` compatibility entry point importing primitive, semantic, then component layers.

- [ ] **Step 1: Add a CSS contract test**

Create a test that reads the emitted source files and checks import order and required contracts:

```ts
expect(entry).toMatch(
  /tokens-primitive\.css[\s\S]*tokens-semantic\.css[\s\S]*tokens-component\.css/,
);
for (const token of [
  '--ui-action-primary-background',
  '--ui-control-disabled-opacity',
  '--ui-focus-ring',
  '--ui-motion-duration-fast',
  '--ui-breakpoint-md',
  '--ui-scrim-background',
  '--ui-selection-background',
  '--ui-elevation-overlay',
]) {
  expect(allLayers).toContain(token);
}
```

- [ ] **Step 2: Run the token test and confirm missing contracts fail**

Run: `pnpm --filter @aletheia/ui test -- tokens-css.test.ts`

Expected: FAIL for any missing token, wrong import order, or primitive reference from the component layer where a semantic mapping exists.

- [ ] **Step 3: Complete the layers and compatibility entry point**

Keep raw values in primitives, intent mappings in semantics, and component aliases in the component layer. The entry point must be only:

```css
@import './tokens-primitive.css';
@import './tokens-semantic.css';
@import './tokens-component.css';
```

- [ ] **Step 4: Replace raw values in the component CSS touched by this increment**

Map focus, disabled, overlay, navigation, drawer, tooltip, dropdown, control, and shell declarations to `--ui-*` semantic/component variables. Preserve existing public legacy variables only as aliases when current web styles consume them.

- [ ] **Step 5: Run UI token, type, lint, and build checks**

Run: `pnpm --filter @aletheia/ui test -- tokens-css.test.ts`

Run: `pnpm --filter @aletheia/ui typecheck`

Run: `pnpm --filter @aletheia/ui lint`

Run: `pnpm --filter @aletheia/ui build`

Expected: all commands exit 0.

- [ ] **Step 6: Commit the token architecture**

```bash
git add packages/ui/src/styles packages/ui/tests/tokens-css.test.ts
git commit -m "feat(ui): establish layered design token contracts"
```

---

### Task 3: Harden accessible overlay and disclosure primitives

**Files:**
- Modify: `packages/ui/src/components/drawer.tsx`
- Modify: `packages/ui/src/components/dropdown.tsx`
- Modify: `packages/ui/src/components/tooltip.tsx`
- Modify: `packages/ui/src/components/index.ts`
- Modify: `packages/ui/src/index.ts`
- Test: `packages/ui/tests/new-components.test.tsx`

**Interfaces:**
- Produces: `Drawer`, `Dropdown`, and `Tooltip` as named package exports.
- Drawer contract: modal focus trap, Escape close, scrim close, body-scroll restoration, and return focus.
- Dropdown contract: trigger/menu ARIA linkage, ArrowDown/ArrowUp navigation, Enter/Space activation, Escape close, and outside-click close.
- Tooltip contract: trigger described by tooltip while visible through hover or keyboard focus.

- [ ] **Step 1: Extend tests with keyboard and focus assertions**

Add tests equivalent to:

```tsx
trigger.focus();
fireEvent.keyDown(trigger, { key: 'ArrowDown' });
expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus();
fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
expect(trigger).toHaveFocus();
```

For Drawer, assert Tab wraps from last to first focusable element and Shift+Tab wraps back. For Tooltip, assert `role="tooltip"` appears on focus and the trigger's `aria-describedby` references its id.

- [ ] **Step 2: Run focused component tests and observe failures**

Run: `pnpm --filter @aletheia/ui test -- new-components.test.tsx`

Expected: FAIL because the inherited implementations do not yet cover every documented keyboard/focus behavior.

- [ ] **Step 3: Implement minimal accessible behavior**

Use stable generated IDs from `useId`, keep focus references in refs, and install document listeners only while an overlay/disclosure is open. Drawer cleanup restores the previous body overflow value, not an assumed empty string.

- [ ] **Step 4: Run focused tests and package quality gates**

Run: `pnpm --filter @aletheia/ui test -- new-components.test.tsx`

Run: `pnpm --filter @aletheia/ui typecheck`

Run: `pnpm --filter @aletheia/ui lint`

Expected: all commands exit 0.

- [ ] **Step 5: Commit accessible overlay primitives**

```bash
git add packages/ui/src/components packages/ui/src/index.ts packages/ui/tests/new-components.test.tsx
git commit -m "feat(ui): harden accessible overlay primitives"
```

---

### Task 4: Split and verify the shared AppShell composition

**Files:**
- Modify: `packages/ui/src/components/app-shell.tsx`
- Create: `packages/ui/src/components/sidebar.tsx`
- Create: `packages/ui/src/components/topbar.tsx`
- Create: `packages/ui/src/components/mobile-navigation.tsx`
- Modify: `packages/ui/src/components/index.ts`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles/components.css`
- Test: `packages/ui/tests/new-components.test.tsx`

**Interfaces:**
- `NavigationItem`: `{ id; label; href; icon; active?; badge? }`.
- `Sidebar`: brand, navigation items, collapsed state, collapse callback, and optional footer.
- `Topbar`: mobile-menu callback and action content.
- `MobileNavigation`: navigation items, open state, close callback, and accessible label.
- `AppShell`: composes those parts and owns only responsive open/collapsed UI state.

- [ ] **Step 1: Write direct tests for all four public components**

Assert landmark names, active navigation state via `aria-current="page"`, collapsed labels, mobile open/close behavior, and that every component is importable from `../src/index.js`.

- [ ] **Step 2: Run focused tests to verify missing exports/components fail**

Run: `pnpm --filter @aletheia/ui test -- new-components.test.tsx`

Expected: FAIL until `Sidebar`, `Topbar`, and `MobileNavigation` exist as public components.

- [ ] **Step 3: Extract structural components from AppShell**

Keep `AppShell` composition declarative:

```tsx
<div className={shellClassName} data-testid="app-shell">
  <Sidebar {...sidebarProps} />
  <div className="ui-appshell-main-wrapper">
    <Topbar onOpenNavigation={() => setMobileOpen(true)} actions={topbarActions} />
    <main className="ui-appshell-content">{children}</main>
  </div>
  <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} items={navigationItems} />
</div>
```

- [ ] **Step 4: Complete stable class styles without inline layout values**

Use token-backed `ui-sidebar-*`, `ui-topbar-*`, `ui-mobile-navigation-*`, and compatibility `ui-appshell-*` classes. Ensure the desktop sidebar and mobile navigation are not simultaneously exposed to assistive technology at the same viewport state.

- [ ] **Step 5: Verify public exports, tests, types, lint, and build**

Run: `pnpm --filter @aletheia/ui test -- new-components.test.tsx`

Run: `pnpm --filter @aletheia/ui typecheck`

Run: `pnpm --filter @aletheia/ui lint`

Run: `pnpm --filter @aletheia/ui build`

- [ ] **Step 6: Commit the shell composition**

```bash
git add packages/ui/src/components packages/ui/src/styles/components.css packages/ui/tests/new-components.test.tsx
git commit -m "feat(ui): expose composable application shell"
```

---

### Task 5: Publish content components and dashboard patterns

**Files:**
- Modify: `packages/ui/src/components/section-header.tsx`
- Modify: `packages/ui/src/components/data-list.tsx`
- Modify: `packages/ui/src/patterns/daily-journey.tsx`
- Modify: `packages/ui/src/patterns/activity-list.tsx`
- Modify: `packages/ui/src/patterns/index.ts`
- Modify: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles/components.css`
- Delete after migration: `apps/web/src/components/dashboard/daily-journey.tsx`
- Delete after migration: `apps/web/src/components/dashboard/activity-list.tsx`
- Modify: `apps/web/tests/dashboard.test.tsx`
- Test: `packages/ui/tests/new-components.test.tsx`

**Interfaces:**
- Produces: named exports `SectionHeader`, `DataList`, `DailyJourney`, `ActivityList`, and `DailyActivityItem`.
- `DailyActivityItem.time` is normalized to `scheduledTime` only if all consumers are migrated in the same task; otherwise retain `time` through Increment 1 and perform transport mapping in Increment 2.

- [ ] **Step 1: Change web tests to import patterns from `@aletheia/ui`**

```tsx
import { ActivityList, DailyJourney, type DailyActivityItem } from '@aletheia/ui';
```

- [ ] **Step 2: Run package and web dashboard tests**

Run: `pnpm --filter @aletheia/ui test -- new-components.test.tsx`

Run: `pnpm --filter @aletheia/web test -- dashboard.test.tsx`

Expected: web test FAIL until package build/exports and consumer migration are complete.

- [ ] **Step 3: Complete presentation-only patterns and migrate consumers**

Remove HTTP/state assumptions, retain callback-driven actions, use stable classes, migrate all imports, and delete local duplicates only after `rg` confirms no remaining consumers:

Run: `rg -n "components/dashboard/(daily-journey|activity-list)" apps/web`

Expected before deletion: no matches.

- [ ] **Step 4: Verify patterns and content components**

Run: `pnpm --filter @aletheia/ui build`

Run: `pnpm --filter @aletheia/ui test -- new-components.test.tsx`

Run: `pnpm --filter @aletheia/web test -- dashboard.test.tsx`

- [ ] **Step 5: Commit shared content and patterns**

```bash
git add packages/ui apps/web/src/components/dashboard apps/web/tests/dashboard.test.tsx
git commit -m "feat(ui): publish shared dashboard patterns"
```

---

### Task 6: Finish the ProductShell adapter and Increment 1 verification

**Files:**
- Modify: `apps/web/src/components/layout/product-shell.tsx`
- Modify: `apps/web/app/globals.css`
- Test: `apps/web/tests/ui-components.test.tsx`
- Test: `apps/web/tests/product-shell.test.tsx`

**Interfaces:**
- Consumes: `AppShell`, `NavigationItem`, learner/family context, permissions, and notifications.
- Produces: existing `ProductShellProps` behavior for all current pages.

- [ ] **Step 1: Add adapter-boundary tests**

Cover current path mapping, permission-filtered items, learner selection, notification/profile content, desktop shell landmarks, and mobile navigation opening. Assert no React warning is emitted.

- [ ] **Step 2: Run ProductShell tests and confirm any inherited gaps**

Run: `pnpm --filter @aletheia/web test -- product-shell.test.tsx ui-components.test.tsx`

- [ ] **Step 3: Reduce ProductShell to integration data and AppShell composition**

Convert the web navigation array to shared `NavigationItem[]`, pass active state and adapter slots to `AppShell`, and retain Next.js/application concerns in the web file. Move every touched layout declaration from `style={{...}}` into named classes in `globals.css`.

- [ ] **Step 4: Run Increment 1 quality gates**

Run: `pnpm --filter @aletheia/ui test`

Run: `pnpm --filter @aletheia/ui typecheck`

Run: `pnpm --filter @aletheia/ui lint`

Run: `pnpm --filter @aletheia/ui build`

Run: `pnpm --filter @aletheia/web test`

Run: `pnpm --filter @aletheia/web typecheck`

Run: `pnpm --filter @aletheia/web lint`

Run: `pnpm --filter @aletheia/web build`

Run: `pnpm check:boundaries`

Expected: every command exits 0 with no option/hydration warnings.

- [ ] **Step 5: Inspect the final Increment 1 diff**

Run: `git diff --check`

Run: `git status --short`

Confirm only reviewed Antigravity/design-system files remain in the increment.

- [ ] **Step 6: Commit ProductShell stabilization**

```bash
git add apps/web/src/components/layout/product-shell.tsx apps/web/app/globals.css apps/web/tests
git commit -m "refactor(web): adapt product shell to shared layout"
```
