# Mobile Tab Bar & Navigation Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mobile hamburger-drawer navigation with a curated bottom tab bar (4 primary items + "Mais" overflow sheet), and re-theme the desktop sidebar and new tab bar in the mockup's dark forest-green palette.

**Architecture:** `packages/ui`'s `AppShell` currently renders identical navigation on desktop (`Sidebar`) and mobile (hamburger → `MobileNavigation` full drawer). We split navigation into "primary" (tab bar, always visible on mobile) and "overflow" (behind a new "Mais" bottom sheet), reusing the existing `Drawer` primitive (extended with a `position="bottom"` variant) instead of `MobileNavigation`'s duplicate focus-trap logic. Color changes are pure CSS custom-property edits layered on top, once the structural change lands.

**Tech Stack:** React 19, Next.js 16, TypeScript, Vitest + Testing Library (`packages/ui` and `apps/web`), plain CSS custom properties (no CSS-in-JS).

**Spec:** `docs/superpowers/specs/2026-09-02-mobile-tab-bar-and-navigation-theme-design.md`

## Global Constraints

- No new npm dependencies — `AletheiaIcon` (already exports `more-horizontal`) is used for the "Mais" icon, not a direct `lucide-react` import, matching this codebase's icon-governance convention (only `packages/ui/src/components/icon.tsx` imports from `lucide-react` directly).
- No feature flag — `MobileNavigation` is deleted outright, not hidden behind a toggle.
- All five color values (`--forest-2: #0c3028`, `--forest: #123f34`, `--gold-muted: #d7bf79`, `--sage: #78937f`, `--ivory: #fbf8ef`) come from `apps/web/app/globals.css`, already defined — no new colors introduced anywhere in this plan.
- `packages/ui` is consumed only by `apps/web` today (verified: no other `package.json` depends on `@aletheia/ui`) — this plan lets a handful of `packages/ui` CSS rules reference those five app-level custom properties directly, a new but low-risk coupling per the spec.
- Every step that touches a `.tsx`/`.css` file under `packages/ui` must keep `pnpm --filter @aletheia/ui typecheck` and `pnpm --filter @aletheia/ui test` green; every step touching `apps/web` must keep `pnpm --filter @aletheia/web typecheck` and its relevant Vitest file green. Full-suite verification happens in Task 8.

---

### Task 1: `Drawer` gains a `bottom` position and an `id` prop

**Files:**
- Modify: `packages/ui/src/components/drawer.tsx`
- Modify: `packages/ui/src/styles/components.css:487-512` (drawer position/size rules), `packages/ui/src/styles/components.css:1289-1296` (keyframes)
- Test: `packages/ui/tests/new-components.test.tsx` (append to the existing `describe('Drawer', ...)` block, after line 148)

**Interfaces:**
- Consumes: nothing new.
- Produces: `DrawerProps.position` now accepts `'bottom'`; `DrawerProps.id?: string` is applied to the dialog element (`data-testid="drawer-container"`). Task 3 (`MobileMoreSheet`) relies on both.

- [ ] **Step 1: Write the failing test for the `bottom` position variant**

Add this test inside the existing `describe('Drawer', ...)` block in `packages/ui/tests/new-components.test.tsx` (after the `'closes when its scrim is clicked'` test, i.e. after line 148):

```tsx
    it('renders a bottom-anchored variant with a stable id when requested', () => {
      render(
        <Drawer isOpen={true} onClose={() => {}} position="bottom" id="more-sheet-test">
          <p>Conteúdo do painel inferior</p>
        </Drawer>
      );

      const container = screen.getByTestId('drawer-container');
      expect(container).toHaveClass('ui-drawer--bottom');
      expect(container).toHaveAttribute('id', 'more-sheet-test');
    });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @aletheia/ui test -- new-components -t "bottom-anchored"`
Expected: FAIL — `position` prop's TypeScript type doesn't accept `'bottom'` yet (or, if TS is loose in the test runner, the assertion on `id` fails since `Drawer` never renders an `id` attribute today).

- [ ] **Step 3: Extend `DrawerProps` and the component**

In `packages/ui/src/components/drawer.tsx`, change the props interface and the two places that consume `position`/add `id`:

```ts
export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'right' | 'left' | 'bottom';
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string | undefined;
  id?: string;
}
```

Add `id` to the function's destructured props (default-less, optional):

```ts
export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  position = 'right',
  size = 'md',
  ariaLabel = 'Gaveta lateral',
  id,
}: DrawerProps) {
```

Update the backdrop and dialog `<div>`s (the backdrop needs a bottom-specific alignment class; the dialog needs the `id`):

```tsx
    <div
      className={`ui-drawer-backdrop ${position === 'bottom' ? 'ui-drawer-backdrop--bottom' : ''}`.trim()}
      data-testid="drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={drawerRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasTitle ? titleId : undefined}
        aria-label={hasTitle ? undefined : accessibleLabel}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`ui-drawer ui-drawer--${position} ${SIZE_CLASSES[size]}`}
        data-testid="drawer-container"
      >
```

- [ ] **Step 4: Add the CSS for the bottom variant**

In `packages/ui/src/styles/components.css`, add a new rule immediately after `.ui-drawer--left` (currently lines 500-503):

```css
.ui-drawer-backdrop--bottom {
  align-items: flex-end;
  justify-content: center;
}
.ui-drawer--bottom {
  width: 100%;
  max-height: min(75vh, 32rem);
  border-radius: var(--ui-radius-lg) var(--ui-radius-lg) 0 0;
  animation: ui-slide-up var(--ui-motion-duration-slow) var(--ui-motion-easing-drawer);
}
```

And add the matching keyframe next to `ui-slide-right` (currently lines 1293-1296):

```css
@keyframes ui-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @aletheia/ui test -- new-components -t "bottom-anchored"`
Expected: PASS

- [ ] **Step 6: Run the full `packages/ui` test suite and typecheck**

Run: `pnpm --filter @aletheia/ui test && pnpm --filter @aletheia/ui typecheck`
Expected: all existing Drawer/AppShell tests still pass (this task didn't touch any behavior existing tests depend on) and typecheck is clean.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/drawer.tsx packages/ui/src/styles/components.css packages/ui/tests/new-components.test.tsx
git commit -m "Add a bottom-anchored Drawer variant with a stable id

Needed so the upcoming mobile 'more' sheet can reuse Drawer's
focus-trap/Escape/scroll-lock logic instead of duplicating it a
third time, and so its trigger button can point aria-controls at it."
```

---

### Task 2: New `TabBar` component

**Files:**
- Create: `packages/ui/src/components/tab-bar.tsx`
- Modify: `packages/ui/src/components/index.ts:25` (swap export)
- Modify: `packages/ui/src/styles/components.css` (new `.ui-tab-bar*` block + media query line)
- Test: `packages/ui/tests/new-components.test.tsx` (new `describe('TabBar', ...)` block)

**Interfaces:**
- Consumes: `NavigationItem`, `NavigationLinkRenderer`, `NavigationLinkRenderProps` from `./app-shell.js` (unchanged types); `AletheiaIcon` from `./icon.js`.
- Produces: `TabBar` component and `TabBarProps` — `{ items: NavigationItem[]; moreActive: boolean; moreOpen: boolean; moreLabel?: string; onOpenMore: () => void; moreControlsId?: string; renderNavigationLink?: NavigationLinkRenderer }`. Task 5 (`AppShell`) renders this with `items = primaryNavigationItems`.

- [ ] **Step 1: Write the failing test**

Create the following inside `packages/ui/tests/new-components.test.tsx`. Add `TabBar` to the import from `'../src/index.js'` at the top of the file (alongside `MobileNavigation`, which Task 5 will later remove), and add this new `describe` block right after the `describe('Drawer', ...)` block closes (after line 149, i.e. before the blank line preceding `describe('Dropdown', ...)`):

```tsx
  describe('TabBar', () => {
    const primaryItems = [
      { id: 'home', label: 'Início', href: '/', icon: <span aria-hidden="true">H</span>, active: true },
      { id: 'devotional', label: 'Devocional', href: '/devotional', icon: <span aria-hidden="true">D</span> },
    ];

    it('renders the primary items as links and a Mais button reflecting sheet state', () => {
      const onOpenMore = vi.fn();
      const { rerender } = render(
        <TabBar
          items={primaryItems}
          moreActive={false}
          moreOpen={false}
          onOpenMore={onOpenMore}
          moreControlsId="more-sheet-id"
        />
      );

      expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: 'Devocional' })).not.toHaveAttribute('aria-current');

      const moreButton = screen.getByRole('button', { name: 'Mais' });
      expect(moreButton).toHaveAttribute('aria-haspopup', 'dialog');
      expect(moreButton).toHaveAttribute('aria-expanded', 'false');
      expect(moreButton).toHaveAttribute('aria-controls', 'more-sheet-id');
      expect(moreButton).not.toHaveClass('ui-tab-bar-link--active');

      fireEvent.click(moreButton);
      expect(onOpenMore).toHaveBeenCalledTimes(1);

      rerender(
        <TabBar
          items={primaryItems}
          moreActive={true}
          moreOpen={true}
          onOpenMore={onOpenMore}
          moreControlsId="more-sheet-id"
        />
      );
      expect(screen.getByRole('button', { name: 'Mais' })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('button', { name: 'Mais' })).toHaveClass('ui-tab-bar-link--active');
    });

    it('forwards an injected navigation link renderer', () => {
      render(
        <TabBar
          items={primaryItems}
          moreActive={false}
          moreOpen={false}
          onOpenMore={() => {}}
          renderNavigationLink={({ href, ...linkProps }) => (
            <a {...linkProps} href={`/adapted${href}`} data-adapted-link="true" />
          )}
        />
      );

      const link = screen.getByRole('link', { name: 'Início' });
      expect(link).toHaveAttribute('href', '/adapted/');
      expect(link).toHaveAttribute('data-adapted-link', 'true');
    });
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @aletheia/ui test -- new-components -t "TabBar"`
Expected: FAIL — `TabBar` is not exported from `../src/index.js` yet.

- [ ] **Step 3: Implement `TabBar`**

Create `packages/ui/src/components/tab-bar.tsx`:

```tsx
'use client';

import React from 'react';
import { AletheiaIcon } from './icon.js';
import type {
  NavigationItem,
  NavigationLinkRenderer,
  NavigationLinkRenderProps,
} from './app-shell.js';

export interface TabBarProps {
  items: NavigationItem[];
  moreActive: boolean;
  moreOpen: boolean;
  moreLabel?: string;
  onOpenMore: () => void;
  moreControlsId?: string;
  renderNavigationLink?: NavigationLinkRenderer | undefined;
}

export function TabBar({
  items,
  moreActive,
  moreOpen,
  moreLabel = 'Mais',
  onOpenMore,
  moreControlsId,
  renderNavigationLink,
}: TabBarProps) {
  return (
    <nav
      className="ui-tab-bar ui-appshell-tab-bar"
      aria-label="Navegação principal"
      data-testid="appshell-tab-bar"
    >
      <ul className="ui-tab-bar-list">
        {items.map((item) => {
          const linkProps: NavigationLinkRenderProps = {
            href: item.href,
            className: `ui-tab-bar-link ${item.active ? 'ui-tab-bar-link--active' : ''}`,
            'aria-current': item.active ? 'page' : undefined,
            'data-testid': `appshell-tab-bar-${item.id}`,
            children: (
              <>
                <span className="ui-tab-bar-icon" aria-hidden="true">{item.icon}</span>
                <span className="ui-tab-bar-label">{item.label}</span>
              </>
            ),
          };

          return (
            <li key={item.id} className="ui-tab-bar-item">
              {renderNavigationLink ? renderNavigationLink(linkProps) : <a {...linkProps} />}
            </li>
          );
        })}
        <li className="ui-tab-bar-item">
          <button
            type="button"
            className={`ui-tab-bar-link ui-tab-bar-more-button ${moreActive ? 'ui-tab-bar-link--active' : ''}`}
            onClick={onOpenMore}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            aria-controls={moreControlsId}
            data-testid="appshell-tab-bar-more"
          >
            <span className="ui-tab-bar-icon" aria-hidden="true">
              <AletheiaIcon name="more-horizontal" size={18} />
            </span>
            <span className="ui-tab-bar-label">{moreLabel}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
```

- [ ] **Step 4: Export it and add the CSS**

In `packages/ui/src/components/index.ts`, add `export * from './tab-bar.js';` right after line 24 (`export * from './topbar.js';`) — leave the `mobile-navigation.js` export alone for now (Task 5 removes it).

In `packages/ui/src/styles/components.css`, add this new block right after the `.ui-appshell-content` rule (currently lines 989-995, right before `.ui-mobile-navigation-layer`):

```css
.ui-tab-bar,
.ui-appshell-tab-bar {
  display: none;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  background-color: var(--ui-navigation-sidebar-background);
  border-top: 1px solid var(--forest);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.ui-tab-bar-list {
  display: flex;
  align-items: stretch;
  list-style: none;
  margin: 0;
  padding: 0;
}
.ui-tab-bar-item {
  flex: 1;
  display: flex;
}
.ui-tab-bar-link {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  padding: 0.5rem 0.25rem 0.375rem;
  color: var(--ui-navigation-link-foreground);
  font-family: var(--ui-font-sans);
  font-size: 0.6875rem;
  font-weight: 600;
  text-decoration: none;
  background: transparent;
  border: none;
  cursor: pointer;
}
.ui-tab-bar-link--active {
  color: var(--ui-navigation-link-foreground-active);
}
.ui-tab-bar-link--active .ui-tab-bar-icon {
  color: var(--ui-navigation-link-icon-foreground-active);
}
.ui-tab-bar-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ui-tab-bar-label {
  white-space: nowrap;
}
```

Then update the breakpoint media query (currently lines 1103-1119) to also show the tab bar on mobile — add these two lines inside the existing `@media (max-width: 1024px) { ... }` block, next to the `.ui-mobile-navigation-layer { display: flex; }` rule:

```css
  .ui-tab-bar,
  .ui-appshell-tab-bar {
    display: flex;
  }
```

(`--ui-navigation-link-foreground`, `-foreground-active`, and the new `-icon-foreground-active` token don't exist yet with those dark-theme values — Task 6 defines them. Until Task 6 runs, this CSS resolves to whatever `tokens-component.css` currently defines for `--ui-navigation-link-foreground`/`-foreground-active`, i.e. the existing light-theme values — harmless, since the tab bar isn't visible in any test's jsdom viewport and Task 6 lands before Task 8's visual check.)

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @aletheia/ui test -- new-components -t "TabBar"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/tab-bar.tsx packages/ui/src/components/index.ts packages/ui/src/styles/components.css packages/ui/tests/new-components.test.tsx
git commit -m "Add TabBar: the mobile primary-navigation bottom bar

Presentational only — AppShell wires it up in a later commit. Kept
separate from the sheet it opens so each has one clear job."
```

---

### Task 3: New `MobileMoreSheet` component

**Files:**
- Create: `packages/ui/src/components/mobile-more-sheet.tsx`
- Modify: `packages/ui/src/components/index.ts` (add export)
- Modify: `packages/ui/src/styles/components.css` (new `.ui-more-sheet*` block)
- Test: `packages/ui/tests/new-components.test.tsx` (new `describe('MobileMoreSheet', ...)` block)

**Interfaces:**
- Consumes: `Drawer` (Task 1's `position="bottom"` and `id` prop), `NavigationItem`/`NavigationLinkRenderer`/`NavigationLinkRenderProps` from `./app-shell.js`.
- Produces: `MobileMoreSheet` and `MobileMoreSheetProps` — `{ id?: string; items: NavigationItem[]; open: boolean; onClose: () => void; label?: string; userProfile?: React.ReactNode; renderNavigationLink?: NavigationLinkRenderer }`. Task 5 (`AppShell`) renders this with `items = overflowItems`.

- [ ] **Step 1: Write the failing test**

Add `MobileMoreSheet` to the `'../src/index.js'` import in `packages/ui/tests/new-components.test.tsx`, and add this `describe` block after the new `TabBar` block from Task 2:

```tsx
  describe('MobileMoreSheet', () => {
    const overflowItems = [
      { id: 'curriculum', label: 'Currículo', href: '/curriculum', icon: <span aria-hidden="true">C</span>, active: true },
      { id: 'reports', label: 'Relatórios', href: '/reports', icon: <span aria-hidden="true">R</span> },
    ];

    it('is absent when closed and renders the overflow items with active state when open', () => {
      const onClose = vi.fn();
      const { rerender } = render(
        <MobileMoreSheet items={overflowItems} open={false} onClose={onClose} />
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<MobileMoreSheet items={overflowItems} open={true} onClose={onClose} id="more-sheet" />);

      const dialog = screen.getByRole('dialog', { name: 'Mais opções' });
      expect(dialog).toHaveAttribute('id', 'more-sheet');
      expect(within(dialog).getByRole('link', { name: 'Currículo' })).toHaveAttribute('aria-current', 'page');
      expect(within(dialog).getByRole('link', { name: 'Relatórios' })).not.toHaveAttribute('aria-current');
    });

    it('closes when an item link is activated and shows the user profile slot', () => {
      const onClose = vi.fn();
      render(
        <MobileMoreSheet
          items={overflowItems}
          open={true}
          onClose={onClose}
          userProfile={<span>Wendel Silva</span>}
        />
      );

      expect(screen.getByText('Wendel Silva')).toBeInTheDocument();

      const link = screen.getByRole('link', { name: 'Relatórios' });
      link.addEventListener('click', (event) => event.preventDefault());
      fireEvent.click(link);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('forwards an injected navigation link renderer', () => {
      render(
        <MobileMoreSheet
          items={overflowItems}
          open={true}
          onClose={() => {}}
          renderNavigationLink={({ href, ...linkProps }) => (
            <a {...linkProps} href={`/adapted${href}`} data-adapted-link="true" />
          )}
        />
      );

      const link = screen.getByRole('link', { name: 'Currículo' });
      expect(link).toHaveAttribute('href', '/adapted/curriculum');
      expect(link).toHaveAttribute('data-adapted-link', 'true');
    });
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @aletheia/ui test -- new-components -t "MobileMoreSheet"`
Expected: FAIL — `MobileMoreSheet` doesn't exist yet.

- [ ] **Step 3: Implement `MobileMoreSheet`**

Create `packages/ui/src/components/mobile-more-sheet.tsx`:

```tsx
'use client';

import React from 'react';
import { Drawer } from './drawer.js';
import type {
  NavigationItem,
  NavigationLinkRenderer,
  NavigationLinkRenderProps,
} from './app-shell.js';

export interface MobileMoreSheetProps {
  id?: string;
  items: NavigationItem[];
  open: boolean;
  onClose: () => void;
  label?: string;
  userProfile?: React.ReactNode;
  renderNavigationLink?: NavigationLinkRenderer | undefined;
}

export function MobileMoreSheet({
  id,
  items,
  open,
  onClose,
  label = 'Mais opções',
  userProfile,
  renderNavigationLink,
}: MobileMoreSheetProps) {
  return (
    <Drawer isOpen={open} onClose={onClose} position="bottom" ariaLabel={label} id={id}>
      <nav className="ui-more-sheet-menu" aria-label={label}>
        <ul className="ui-more-sheet-list">
          {items.map((item) => {
            const linkProps: NavigationLinkRenderProps = {
              href: item.href,
              className: `ui-more-sheet-link ${item.active ? 'ui-more-sheet-link--active' : ''}`,
              'aria-current': item.active ? 'page' : undefined,
              onClick: onClose,
              children: (
                <>
                  <span className="ui-more-sheet-icon" aria-hidden="true">{item.icon}</span>
                  <span className="ui-more-sheet-label">{item.label}</span>
                  {item.badge && <span className="ui-more-sheet-badge">{item.badge}</span>}
                </>
              ),
            };

            return (
              <li key={item.id} className="ui-more-sheet-item">
                {renderNavigationLink ? renderNavigationLink(linkProps) : <a {...linkProps} />}
              </li>
            );
          })}
        </ul>
      </nav>
      {userProfile && (
        <div className="ui-more-sheet-profile" data-testid="appshell-mobile-user-profile">
          {userProfile}
        </div>
      )}
    </Drawer>
  );
}
```

- [ ] **Step 4: Export it and add the CSS**

In `packages/ui/src/components/index.ts`, add `export * from './mobile-more-sheet.js';` after the `tab-bar.js` line added in Task 2.

In `packages/ui/src/styles/components.css`, add this block right after the new `.ui-tab-bar-label` rule from Task 2:

```css
.ui-more-sheet-list {
  display: flex;
  flex-direction: column;
  gap: calc(var(--ui-space-8) / 8);
  padding: 0;
  margin: 0;
  list-style: none;
}
.ui-more-sheet-link {
  display: flex;
  align-items: center;
  gap: calc(var(--ui-space-12) / 4);
  padding: calc(var(--ui-space-10) / 4) calc(var(--ui-space-12) / 4);
  color: var(--ui-text-secondary);
  font-family: var(--ui-font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: var(--ui-radius-md);
  transition:
    background-color var(--ui-motion-duration-fast) var(--ui-motion-easing-default),
    color var(--ui-motion-duration-fast) var(--ui-motion-easing-default);
}
.ui-more-sheet-link:hover {
  color: var(--ui-text-brand);
  background-color: var(--ui-surface-hover);
}
.ui-more-sheet-link--active {
  color: var(--ui-action-primary-foreground);
  background-color: var(--ui-action-primary-background);
}
.ui-more-sheet-icon {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
}
.ui-more-sheet-label {
  flex: 1;
}
.ui-more-sheet-badge {
  font-size: 0.6875rem;
}
.ui-more-sheet-profile {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--ui-border-default);
}
```

Note this block deliberately reuses `--ui-text-secondary`, `--ui-text-brand`, `--ui-surface-hover`, `--ui-action-primary-background`/`-foreground` — the *original*, unchanged tokens — not the `--ui-navigation-link-*` ones Task 6 re-themes. The "Mais" sheet keeps its current light background per the spec, so its link colors must stay independent of the sidebar/tab-bar dark-theme tokens.

Also add `.ui-more-sheet-link:focus-visible` to the shared focus-visible selector list (currently `components.css:878-887`) — Task 6 finalizes that list alongside removing the now-dead `MobileNavigation` selectors, so no edit here; just note it's pending.

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @aletheia/ui test -- new-components -t "MobileMoreSheet"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/mobile-more-sheet.tsx packages/ui/src/components/index.ts packages/ui/src/styles/components.css packages/ui/tests/new-components.test.tsx
git commit -m "Add MobileMoreSheet: the mobile navigation overflow panel

Wraps the new bottom Drawer variant instead of re-implementing
focus-trap/Escape/scroll-lock a third time."
```

---

### Task 4: `Topbar` loses the hamburger, gains a compact brand mark

**Files:**
- Modify: `packages/ui/src/components/topbar.tsx` (full rewrite, it's a 42-line file)
- Modify: `packages/ui/src/styles/components.css:958-988` (topbar rules), the shared focus-visible list (`878-887`), and the `@media (max-width: 1024px)` block (`1103-1119`)
- Test: `packages/ui/tests/new-components.test.tsx` (rewrite the `'exports a topbar banner...'` test, currently lines 414-424)

**Interfaces:**
- Consumes: nothing new.
- Produces: `TopbarProps` becomes `{ brandLogo?: React.ReactNode; brandTitle?: React.ReactNode; actions?: React.ReactNode }` — `onOpenNavigation`, `navigationOpen`, `navigationControlsId` are removed. Task 5 (`AppShell`) passes `brandLogo`/`brandTitle` (the same props it already receives) instead of the old navigation-control props.

- [ ] **Step 1: Update the failing test first**

Replace the test at `packages/ui/tests/new-components.test.tsx:414-424` (`'exports a topbar banner with a named mobile navigation control and actions'`) with:

```tsx
    it('exports a topbar banner with a brand mark and actions', () => {
      render(
        <Topbar
          brandLogo={<span aria-hidden="true">ἀ</span>}
          brandTitle="Aletheia"
          actions={<button type="button">Perfil</button>}
        />
      );

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByTestId('appshell-topbar-brand')).toHaveTextContent('Aletheia');
      expect(screen.getByRole('button', { name: 'Perfil' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Abrir navegação' })).not.toBeInTheDocument();
    });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @aletheia/ui test -- new-components -t "topbar banner"`
Expected: FAIL — `Topbar` still requires `onOpenNavigation` and still renders the hamburger button, so `appshell-topbar-brand` doesn't exist.

- [ ] **Step 3: Rewrite `Topbar`**

Replace the entire contents of `packages/ui/src/components/topbar.tsx` with:

```tsx
'use client';

import React from 'react';

export interface TopbarProps {
  brandLogo?: React.ReactNode;
  brandTitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export function Topbar({ brandLogo, brandTitle, actions }: TopbarProps) {
  return (
    <header className="ui-topbar ui-appshell-topbar" data-testid="appshell-topbar">
      <div className="ui-topbar-brand ui-appshell-topbar-left" data-testid="appshell-topbar-brand">
        {brandLogo && (
          <span className="ui-topbar-brand-logo" aria-hidden="true">
            {brandLogo}
          </span>
        )}
        {brandTitle && <span className="ui-topbar-brand-title">{brandTitle}</span>}
      </div>

      <div className="ui-topbar-actions ui-appshell-topbar-right" data-testid="appshell-topbar-actions">
        {actions}
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Update the CSS**

In `packages/ui/src/styles/components.css`, replace the `.ui-topbar-menu-button, .ui-appshell-mobile-menu-btn` rule (currently lines 972-981) with:

```css
.ui-topbar-brand,
.ui-appshell-topbar-left {
  display: none;
  align-items: center;
  gap: calc(var(--ui-space-12) / 4);
}
.ui-topbar-brand-logo {
  display: inline-flex;
  align-items: center;
  font-size: 1.25rem;
}
.ui-topbar-brand-title {
  font-family: var(--ui-font-serif);
  font-weight: 700;
  font-size: 1.0625rem;
  color: var(--ui-text-brand);
}
```

In the shared focus-visible selector list (currently lines 878-887), delete the `.ui-topbar-menu-button:focus-visible,` and `.ui-appshell-mobile-menu-btn:focus-visible` lines (the latter is the list's last entry — remove its trailing comma from the line before it, `.ui-appshell-nav-link:focus-visible`, so it ends the selector list with `{`).

In the `@media (max-width: 1024px)` block (currently lines 1103-1119), replace:

```css
  .ui-topbar-menu-button,
  .ui-appshell-mobile-menu-btn {
    display: inline-flex;
  }
```

with:

```css
  .ui-topbar-brand,
  .ui-appshell-topbar-left {
    display: flex;
  }
```

(The sidebar already shows the full brand block on desktop, so the topbar's compact copy stays `display: none` above the breakpoint to avoid showing the brand twice.)

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @aletheia/ui test -- new-components -t "topbar banner"`
Expected: PASS. Other `AppShell`-block tests in this same file will still fail at this point — they're rewritten in Task 5, which also updates every call site of `Topbar`/`AppShell`.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/topbar.tsx packages/ui/src/styles/components.css packages/ui/tests/new-components.test.tsx
git commit -m "Replace Topbar's mobile hamburger with a compact brand mark

The hamburger opened the drawer being replaced by TabBar + Mais;
keeping it around would just be a redundant second way to reach
the same navigation. AppShell and the other broken AppShell-block
tests are fixed in the next commit."
```

---

### Task 5: Rewire `AppShell`, delete `MobileNavigation`, update Storybook

**Files:**
- Modify: `packages/ui/src/components/app-shell.tsx`
- Delete: `packages/ui/src/components/mobile-navigation.tsx`
- Modify: `packages/ui/src/components/index.ts:25` (remove `mobile-navigation.js` export)
- Modify: `packages/ui/src/stories/Navigation.stories.tsx`
- Modify: `packages/ui/tests/new-components.test.tsx` (rewrite the remaining broken `AppShell`-block tests: `'exports mobile navigation...'`, `'moves focus into mobile navigation...'`, `'composes responsive navigation...'`, `'forwards an injected navigation link renderer...'`, `'closes mobile navigation and moves focus...'` — lines 426-605 as read before this plan's edits)

**Interfaces:**
- Consumes: `TabBar`/`TabBarProps` (Task 2), `MobileMoreSheet`/`MobileMoreSheetProps` (Task 3), `Topbar`/`TopbarProps` (Task 4), `Sidebar` (unchanged).
- Produces: `AppShellProps` gains `primaryNavigationItems: NavigationItem[]` (required). Task 7 (`product-shell.tsx`) is the only caller and supplies it.

- [ ] **Step 1: Write the failing tests**

Replace `packages/ui/tests/new-components.test.tsx` lines 426-605 (everything from `it('exports mobile navigation...')` through the end of the `describe('AppShell', ...)` block) with:

```tsx
    it('is absent when closed and opens the Mais sheet from the tab bar', () => {
      const onClose = vi.fn();
      const { rerender } = render(
        <MobileMoreSheet items={navigationItems} open={false} onClose={onClose} label="Mais opções" />
      );
      expect(screen.queryByRole('dialog', { name: 'Mais opções' })).not.toBeInTheDocument();

      rerender(
        <MobileMoreSheet items={navigationItems} open={true} onClose={onClose} label="Mais opções" />
      );
      expect(screen.getByRole('dialog', { name: 'Mais opções' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page');
    });

    it('composes the sidebar, topbar, tab bar, and content while owning their UI state', () => {
      render(
        <AppShell
          brandTitle="Aletheia Test"
          navigationItems={navigationItems}
          primaryNavigationItems={[navigationItems[0]!]}
          topbarActions={<button type="button">Perfil</button>}
        >
          <div>Conteúdo Principal</div>
        </AppShell>
      );

      expect(screen.getByTestId('app-shell')).toBeInTheDocument();
      expect(screen.getByTestId('appshell-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('appshell-topbar')).toBeInTheDocument();
      expect(screen.getByTestId('appshell-tab-bar')).toBeInTheDocument();
      expect(screen.getByTestId('appshell-nav-home')).toHaveAttribute('aria-current', 'page');
      expect(screen.getByText('Conteúdo Principal')).toBeInTheDocument();

      const moreButton = screen.getByRole('button', { name: 'Mais' });
      fireEvent.click(moreButton);
      const moreSheet = screen.getByRole('dialog', { name: 'Mais opções' });
      expect(moreButton).toHaveAttribute('aria-controls', moreSheet.id);
      // The one primary item (Início) must not be duplicated inside the overflow sheet.
      expect(within(moreSheet).queryByRole('link', { name: 'Início' })).not.toBeInTheDocument();
      expect(within(moreSheet).getByRole('link', { name: 'Educandos' })).toBeInTheDocument();
    });

    it('forwards an injected navigation link renderer to desktop, tab bar, and overflow sheet', () => {
      render(
        <AppShell
          navigationItems={navigationItems}
          primaryNavigationItems={[navigationItems[1]!]}
          renderNavigationLink={({ href, ...linkProps }) => (
            <a {...linkProps} href={`/adapted${href}`} data-adapted-link="true" />
          )}
        >
          <div>Conteúdo Principal</div>
        </AppShell>
      );

      const desktopLink = screen.getByTestId('appshell-nav-home');
      expect(desktopLink).toHaveAttribute('href', '/adapted/');

      const tabBarLink = screen.getByTestId('appshell-tab-bar-learners');
      expect(tabBarLink).toHaveAttribute('href', '/adapted/learners');
      expect(tabBarLink).toHaveAttribute('data-adapted-link', 'true');

      fireEvent.click(screen.getByRole('button', { name: 'Mais' }));
      const moreSheet = screen.getByRole('dialog');
      const overflowLink = within(moreSheet).getByRole('link', { name: 'Início' });
      expect(overflowLink).toHaveAttribute('href', '/adapted/');
      expect(overflowLink).toHaveAttribute('data-adapted-link', 'true');
    });

    it('closes an open Mais sheet and moves focus into desktop navigation beyond the breakpoint', () => {
      let matches = true;
      const listeners = new Set<(event: MediaQueryListEvent) => void>();
      const mediaQueryList = {
        get matches() {
          return matches;
        },
        media: '(max-width: 1024px)',
        onchange: null,
        addEventListener: (_type: 'change', listener: (event: MediaQueryListEvent) => void) => {
          listeners.add(listener);
        },
        removeEventListener: (_type: 'change', listener: (event: MediaQueryListEvent) => void) => {
          listeners.delete(listener);
        },
        addListener: (listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
        removeListener: (listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
        dispatchEvent: (event: Event) => {
          listeners.forEach((listener) => listener(event as MediaQueryListEvent));
          return true;
        },
      } as unknown as MediaQueryList;
      const originalMatchMedia = window.matchMedia;
      const matchMedia = vi.fn(() => mediaQueryList);
      Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: matchMedia });

      try {
        document.body.style.overflow = 'scroll';
        render(
          <AppShell navigationItems={navigationItems} primaryNavigationItems={[navigationItems[0]!]}>
            <div>Conteúdo Principal</div>
          </AppShell>
        );

        const moreButton = screen.getByRole('button', { name: 'Mais' });
        fireEvent.click(moreButton);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(document.body.style.overflow).toBe('hidden');

        act(() => {
          matches = false;
          mediaQueryList.dispatchEvent({ matches, media: mediaQueryList.media } as MediaQueryListEvent);
        });

        expect(matchMedia).toHaveBeenCalledWith('(max-width: 1024px)');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(document.body.style.overflow).toBe('scroll');
        expect(screen.getByTestId('appshell-nav-home')).toHaveFocus();
        expect(moreButton).not.toHaveFocus();
      } finally {
        Object.defineProperty(window, 'matchMedia', {
          configurable: true,
          writable: true,
          value: originalMatchMedia,
        });
      }
    });
  });
```

Also update the top-of-file import: remove `MobileNavigation` from the `'../src/index.js'` import list (its own describe block from Task 3 already imports `MobileMoreSheet`, which should already be in that same import list from Task 3's Step 1).

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @aletheia/ui test -- new-components -t "AppShell"`
Expected: FAIL — `AppShell` still has the old `isMobileMenuOpen`/hamburger wiring and doesn't accept `primaryNavigationItems`.

- [ ] **Step 3: Rewrite `AppShell`**

Replace the entire contents of `packages/ui/src/components/app-shell.tsx` with:

```tsx
'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { MobileMoreSheet } from './mobile-more-sheet.js';
import { Sidebar } from './sidebar.js';
import { TabBar } from './tab-bar.js';
import { Topbar } from './topbar.js';

const MOBILE_NAVIGATION_MEDIA_QUERY = '(max-width: 1024px)';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: React.ReactNode;
}

export type NavigationLinkRenderProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> & {
  href: string;
  'data-testid'?: string | undefined;
};

export type NavigationLinkRenderer = (props: NavigationLinkRenderProps) => React.ReactNode;

export type AppShellUserProfile = React.ReactNode | ((collapsed: boolean) => React.ReactNode);

export interface AppShellProps {
  children: React.ReactNode;
  brandTitle?: React.ReactNode;
  brandSubtitle?: React.ReactNode;
  brandLogo?: React.ReactNode;
  navigationItems: NavigationItem[];
  primaryNavigationItems: NavigationItem[];
  topbarActions?: React.ReactNode;
  userProfile?: AppShellUserProfile;
  renderNavigationLink?: NavigationLinkRenderer | undefined;
  className?: string;
}

export function AppShell({
  children,
  brandTitle = 'Aletheia',
  brandSubtitle = 'Educação Domiciliar',
  brandLogo,
  navigationItems,
  primaryNavigationItems,
  topbarActions,
  userProfile,
  renderNavigationLink,
  className = '',
}: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const moreSheetId = useId();
  const shellRef = useRef<HTMLDivElement>(null);
  const isMoreSheetOpenRef = useRef(isMoreSheetOpen);
  const moveFocusToDesktopNavigationRef = useRef(false);
  isMoreSheetOpenRef.current = isMoreSheetOpen;
  const shellClassName = `ui-appshell ${isSidebarCollapsed ? 'ui-appshell--collapsed' : ''} ${className}`.trim();
  const renderUserProfile = (collapsed: boolean) =>
    typeof userProfile === 'function' ? userProfile(collapsed) : userProfile;

  const overflowItems = navigationItems.filter(
    (item) => !primaryNavigationItems.some((primary) => primary.id === item.id),
  );
  const moreActive = overflowItems.some((item) => item.active === true);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const mobileViewport = window.matchMedia(MOBILE_NAVIGATION_MEDIA_QUERY);
    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (!event.matches && isMoreSheetOpenRef.current) {
        moveFocusToDesktopNavigationRef.current = true;
        setIsMoreSheetOpen(false);
      }
    };

    mobileViewport.addEventListener('change', handleViewportChange);
    return () => mobileViewport.removeEventListener('change', handleViewportChange);
  }, []);

  useEffect(() => {
    if (isMoreSheetOpen || !moveFocusToDesktopNavigationRef.current) return;

    moveFocusToDesktopNavigationRef.current = false;
    const desktopNavigationTarget = shellRef.current?.querySelector<HTMLElement>(
      '.ui-sidebar-navigation-link[aria-current="page"], .ui-sidebar-navigation-link',
    );
    desktopNavigationTarget?.focus();
  }, [isMoreSheetOpen]);

  const openMoreSheet = () => {
    moveFocusToDesktopNavigationRef.current = false;
    setIsMoreSheetOpen(true);
  };

  const closeMoreSheet = () => {
    moveFocusToDesktopNavigationRef.current = false;
    setIsMoreSheetOpen(false);
  };

  return (
    <div ref={shellRef} className={shellClassName} data-testid="app-shell">
      <a href="#appshell-main-content" className="ui-skip-link">
        Pular para o conteúdo principal
      </a>

      <Sidebar
        brandTitle={brandTitle}
        brandSubtitle={brandSubtitle}
        brandLogo={brandLogo}
        items={navigationItems}
        collapsed={isSidebarCollapsed}
        onCollapse={setIsSidebarCollapsed}
        footer={renderUserProfile(isSidebarCollapsed)}
        renderNavigationLink={renderNavigationLink}
      />

      <div className="ui-appshell-main-wrapper">
        <Topbar brandLogo={brandLogo} brandTitle={brandTitle} actions={topbarActions} />

        <main
          id="appshell-main-content"
          className="ui-appshell-content"
          data-testid="appshell-main-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      <TabBar
        items={primaryNavigationItems}
        moreActive={moreActive}
        moreOpen={isMoreSheetOpen}
        onOpenMore={openMoreSheet}
        moreControlsId={moreSheetId}
        renderNavigationLink={renderNavigationLink}
      />

      <MobileMoreSheet
        id={moreSheetId}
        open={isMoreSheetOpen}
        onClose={closeMoreSheet}
        items={overflowItems}
        label="Mais opções"
        userProfile={renderUserProfile(false)}
        renderNavigationLink={renderNavigationLink}
      />
    </div>
  );
}
```

- [ ] **Step 4: Delete `MobileNavigation` and its export**

```bash
git rm packages/ui/src/components/mobile-navigation.tsx
```

In `packages/ui/src/components/index.ts`, remove the line `export * from './mobile-navigation.js';`.

Delete the now-dead CSS: in `packages/ui/src/styles/components.css`, remove the entire block from `.ui-mobile-navigation-layer {` through `.ui-mobile-navigation-badge { font-size: 0.6875rem; }` (this is the whole range that was at lines 996-1101 before this plan's earlier edits shifted line numbers — locate it by the `.ui-mobile-navigation-*` prefix, it's the block immediately before the `@media (max-width: 1024px)` rule). Also remove `.ui-mobile-navigation-close:focus-visible,` and `.ui-mobile-navigation-link:focus-visible,` from the shared focus-visible selector list, and remove the `.ui-mobile-navigation-layer { display: flex; }` rule from inside the `@media (max-width: 1024px)` block (already superseded by the `.ui-tab-bar { display: flex; }` rule Task 2 added there). Add `.ui-tab-bar-link:focus-visible,` and `.ui-more-sheet-link:focus-visible,` to that same shared focus-visible list in their place.

The focus-visible selector list should now read:

```css
.ui-sidebar-collapse-toggle:focus-visible,
.ui-sidebar-navigation-link:focus-visible,
.ui-tab-bar-link:focus-visible,
.ui-more-sheet-link:focus-visible,
.ui-appshell-collapse-toggle:focus-visible,
.ui-appshell-nav-link:focus-visible {
  outline: var(--ui-focus-ring-width) solid var(--ui-focus-ring-color);
  outline-offset: var(--ui-focus-ring-offset);
}
```

And the reduced-motion block (currently referencing `.ui-mobile-navigation-link`) becomes:

```css
@media (prefers-reduced-motion: reduce) {
  .ui-sidebar,
  .ui-appshell-sidebar,
  .ui-sidebar-navigation-link,
  .ui-appshell-nav-link,
  .ui-tab-bar-link,
  .ui-more-sheet-link {
    transition-duration: 0ms;
  }
}
```

- [ ] **Step 5: Update Storybook**

Replace `packages/ui/src/stories/Navigation.stories.tsx` in full:

```tsx
import React, { useState } from "react";
import type { Meta } from "@storybook/react";
import { Home, Users, BookOpen, Calendar, Settings, Bell, User } from "lucide-react";
import { AppShell, type NavigationItem } from "../components/app-shell.js";
import { Sidebar } from "../components/sidebar.js";
import { Topbar } from "../components/topbar.js";
import { TabBar } from "../components/tab-bar.js";
import { MobileMoreSheet } from "../components/mobile-more-sheet.js";
import { IconButton } from "../components/icon-button.js";
import { Badge } from "../components/badge.js";

const meta: Meta = {
  title: "Components/Navigation",
  parameters: {
    docs: {
      description: {
        component: "Responsive navigation hierarchy: AppShell composes a desktop Sidebar with a mobile TabBar (4 primary items) plus a MobileMoreSheet for the overflow.",
      },
    },
  },
};

export default meta;

const navigationItems: NavigationItem[] = [
  { id: "home", label: "Início", href: "/", icon: <Home size={18} />, active: true },
  { id: "learners", label: "Educandos", href: "/learners", icon: <Users size={18} />, badge: <Badge size="sm" variant="indigo">2</Badge> },
  { id: "curriculum", label: "Currículo", href: "/curriculum", icon: <BookOpen size={18} /> },
  { id: "calendar", label: "Calendário", href: "/calendar", icon: <Calendar size={18} /> },
  { id: "settings", label: "Configurações", href: "/settings", icon: <Settings size={18} /> },
];

const primaryNavigationItems = navigationItems.slice(0, 2);

export const AppShellComplete = () => (
  <div style={{ height: "600px", border: "1px solid var(--border-light)", borderRadius: "8px", overflow: "hidden" }}>
    <AppShell
      brandTitle="Aletheia"
      brandSubtitle="Família Santos"
      navigationItems={navigationItems}
      primaryNavigationItems={primaryNavigationItems}
      topbarActions={
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <IconButton aria-label="Notificações" size="sm">
            <Bell size={18} />
          </IconButton>
          <IconButton aria-label="Perfil do Usuário" size="sm">
            <User size={18} />
          </IconButton>
        </div>
      }
      userProfile={
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "var(--color-brand-forest)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            FS
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>Família Santos</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Plano Clássico</div>
          </div>
        </div>
      }
    >
      <div style={{ padding: "1.5rem" }}>
        <h2 style={{ margin: "0 0 1rem 0" }}>Painel Principal</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          Bem-vindo ao ambiente de gestão pedagógica domiciliar. Navegue pelas seções usando a barra lateral.
        </p>
      </div>
    </AppShell>
  </div>
);

export const SidebarOnly = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ width: collapsed ? "80px" : "260px", minHeight: "400px", border: "1px solid var(--border-light)", borderRadius: "8px" }}>
      <Sidebar
        brandTitle="Aletheia"
        brandSubtitle="Homeschool"
        items={navigationItems}
        collapsed={collapsed}
        onCollapse={setCollapsed}
      />
    </div>
  );
};

export const TopbarOnly = () => (
  <div style={{ border: "1px solid var(--border-light)", borderRadius: "8px" }}>
    <Topbar
      brandLogo={<span>ἀ</span>}
      brandTitle="Aletheia"
      actions={
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <IconButton aria-label="Notificações" size="sm">
            <Bell size={18} />
          </IconButton>
        </div>
      }
    />
  </div>
);

export const MobileTabBar = () => (
  <div style={{ position: "relative", height: "120px", border: "1px solid var(--border-light)", borderRadius: "8px", overflow: "hidden" }}>
    <TabBar
      items={primaryNavigationItems}
      moreActive={false}
      moreOpen={false}
      onOpenMore={() => alert("Abrir Mais")}
    />
  </div>
);

export const MobileMoreSheetStory = () => {
  const [open, setOpen] = useState(false);
  const overflowItems = navigationItems.slice(2);

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir Mais
      </button>
      <MobileMoreSheet open={open} onClose={() => setOpen(false)} items={overflowItems} />
    </div>
  );
};
```

- [ ] **Step 6: Run the full `packages/ui` suite and typecheck**

Run: `pnpm --filter @aletheia/ui test && pnpm --filter @aletheia/ui typecheck`
Expected: PASS / clean. Every test that referenced `MobileNavigation` or the old hamburger flow has now been rewritten (Tasks 3, 4, and this task).

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/app-shell.tsx packages/ui/src/components/index.ts packages/ui/src/stories/Navigation.stories.tsx packages/ui/src/styles/components.css packages/ui/tests/new-components.test.tsx
git rm packages/ui/src/components/mobile-navigation.tsx
git commit -m "Rewire AppShell onto TabBar + MobileMoreSheet, delete MobileNavigation

AppShell now splits navigationItems into primary (tab bar) and
overflow (Mais sheet) instead of showing all 10 items behind one
hamburger-triggered drawer on mobile."
```

---

### Task 6: Dark forest-green theme for the sidebar and tab bar

**Files:**
- Modify: `packages/ui/src/styles/tokens-component.css:49-58` (navigation tokens)
- Modify: `packages/ui/src/styles/components.css` (scoped sidebar/tab-bar overrides — brand text, collapse toggle, footer, borders, icon-active token)
- Modify: `apps/web/app/globals.css` (one scoped override for the user-profile name text)

**Interfaces:**
- Consumes: `--forest-2`, `--forest`, `--forest-dark`, `--gold-muted`, `--sage`, `--ivory` (already defined in `apps/web/app/globals.css`).
- Produces: nothing new for other tasks — this is a leaf, purely visual task.

This task has no meaningful unit-test surface (no test in this codebase asserts on computed CSS color values — the existing convention, confirmed by how PR #58's button-color fixes were verified, is visual/manual checking). Steps here are CSS edits verified by a manual/Playwright screenshot check at the end.

- [ ] **Step 1: Retheme the navigation link tokens**

In `packages/ui/src/styles/tokens-component.css`, change lines 49-58 from:

```css
  --ui-navigation-sidebar-width: var(--ui-layout-sidebar-width);
  --ui-navigation-sidebar-collapsed-width: var(--ui-layout-sidebar-collapsed-width);
  --ui-navigation-header-height: var(--ui-layout-header-height);
  --ui-navigation-sidebar-background: var(--ui-surface-default);
  --ui-navigation-link-foreground: var(--ui-text-secondary);
  --ui-navigation-link-foreground-hover: var(--ui-text-brand);
  --ui-navigation-link-background-hover: var(--ui-surface-hover);
  --ui-navigation-link-background-active: var(--ui-action-primary-background);
  --ui-navigation-link-foreground-active: var(--ui-action-primary-foreground);
```

to:

```css
  --ui-navigation-sidebar-width: var(--ui-layout-sidebar-width);
  --ui-navigation-sidebar-collapsed-width: var(--ui-layout-sidebar-collapsed-width);
  --ui-navigation-header-height: var(--ui-layout-header-height);
  --ui-navigation-sidebar-background: var(--forest-2);
  --ui-navigation-link-foreground: var(--sage);
  --ui-navigation-link-foreground-hover: var(--ivory);
  --ui-navigation-link-background-hover: var(--forest);
  --ui-navigation-link-background-active: var(--forest);
  --ui-navigation-link-foreground-active: var(--ivory);
  --ui-navigation-link-icon-foreground-active: var(--gold-muted);
```

(These five tokens — confirmed by a repo-wide search before this plan was written — are used *only* by `.ui-sidebar-navigation-link` and (until Task 5) `.ui-mobile-navigation-link`; now they're used by `.ui-sidebar-navigation-link` and the new `.ui-tab-bar-link`. Nothing else in `packages/ui` reads them, so this is a safe, fully-scoped repoint.)

- [ ] **Step 2: Give the active link's icon its own accent color**

In `packages/ui/src/styles/components.css`, the sidebar's active-link rule currently reads (around where `.ui-sidebar-navigation-link--active` is defined):

```css
.ui-sidebar-navigation-link--active,
.ui-appshell-nav-link--active {
  background-color: var(--ui-navigation-link-background-active);
  color: var(--ui-navigation-link-foreground-active);
  box-shadow: var(--ui-elevation-raised);
}
```

Add immediately after it:

```css
.ui-sidebar-navigation-link--active .ui-sidebar-navigation-icon,
.ui-appshell-nav-link--active .ui-appshell-nav-icon {
  color: var(--ui-navigation-link-icon-foreground-active);
}
```

`TabBar`'s active rule (added in Task 2) already targets `.ui-tab-bar-icon` the same way, so both surfaces pick up the gold icon accent from the one token.

- [ ] **Step 3: Fix the now-illegible sidebar chrome (brand text, collapse toggle, footer, borders)**

The sidebar's background just went from a light surface to dark forest green; several elements inside it were styled assuming a light background and are now unreadable or visually wrong. Fix each in `packages/ui/src/styles/components.css`:

Change the sidebar's own border (currently `border-right: 1px solid var(--ui-border-default);` in the `.ui-sidebar, .ui-appshell-sidebar` rule) to:

```css
  border-right: 1px solid var(--forest);
```

Change the sidebar header's border (currently `border-bottom: 1px solid var(--ui-border-default);` in `.ui-sidebar-header, .ui-appshell-sidebar-header`) to:

```css
  border-bottom: 1px solid var(--forest);
```

Change the brand title/subtitle colors (`.ui-sidebar-brand-title, .ui-appshell-brand-title` currently `color: var(--ui-text-brand);`, and `.ui-sidebar-brand-subtitle, .ui-appshell-brand-subtitle` currently `color: var(--ui-text-secondary);`) to:

```css
.ui-sidebar-brand-title,
.ui-appshell-brand-title {
  font-family: var(--ui-font-serif);
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--ivory);
  line-height: 1.2;
}
.ui-sidebar-brand-subtitle,
.ui-appshell-brand-subtitle {
  font-size: 0.6875rem;
  color: var(--sage);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

Change the collapse toggle (`.ui-sidebar-collapse-toggle, .ui-appshell-collapse-toggle`, currently `border: 1px solid var(--ui-border-default); color: var(--ui-text-secondary);`) to:

```css
.ui-sidebar-collapse-toggle,
.ui-appshell-collapse-toggle {
  background: transparent;
  border: 1px solid var(--forest);
  border-radius: var(--ui-radius-sm);
  padding: calc(var(--ui-space-8) / 8);
  color: var(--sage);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color var(--ui-motion-duration-fast) var(--ui-motion-easing-default),
    color var(--ui-motion-duration-fast) var(--ui-motion-easing-default),
    border-color var(--ui-motion-duration-fast) var(--ui-motion-easing-default);
}
```

Its hover rule (`.ui-sidebar-collapse-toggle:hover, .ui-appshell-collapse-toggle:hover`, currently reusing `--ui-navigation-link-background-hover`/`-foreground-hover`) needs no change — those tokens are already retheme'd to `--forest`/`--ivory` by Step 1, which is exactly right here too.

Change the sidebar footer (`.ui-sidebar-footer, .ui-appshell-sidebar-footer`, currently `background-color: var(--ui-surface-subtle);` with `border-top: 1px solid var(--ui-border-default);`) to:

```css
.ui-sidebar-footer,
.ui-appshell-sidebar-footer {
  padding: calc(var(--ui-space-8) / 2);
  border-top: 1px solid var(--forest-dark);
  background-color: var(--forest);
}
```

- [ ] **Step 4: Fix the one remaining illegible piece — the user's name in the sidebar footer**

`ProductShell` (in `apps/web`) renders the signed-in user's name via `.product-shell-user-name`, which today is `color: var(--ui-text-primary)` — dark ink, fine on the sheet's light background but invisible on the sidebar's new dark green footer. The avatar circle and `RoleBadge` next to it are unaffected (both already paint their own filled background, so they stay legible regardless of what's behind them) — only the plain name text needs a scoped fix, because the *same* markup also renders inside `MobileMoreSheet`'s still-light footer, where the default dark-ink color is correct and must not change.

In `apps/web/app/globals.css`, add this new rule immediately after the existing `.product-shell-user-name { ... }` block (currently around line 644-651):

```css
.ui-sidebar-footer .product-shell-user-name {
  color: var(--ivory);
}
```

(`RoleBadge` keeps its own per-role pastel background regardless of container — a deliberate, accepted tradeoff: it's legible on the dark sidebar footer, just not perfectly theme-matched, and recoloring it is out of scope here since it's a shared component used well beyond navigation.)

- [ ] **Step 5: Visual check**

There is no automated assertion for this task. Instead:

Run: `pnpm --filter @aletheia/ui test && pnpm --filter @aletheia/ui typecheck && pnpm --filter @aletheia/web typecheck`
Expected: all green (this task only changed CSS custom properties and one new CSS rule — no component logic changed, so no test should be affected).

Then do a manual visual check (this is the same throwaway-Playwright-script pattern used earlier in this project for the design audit): start the API and web dev servers, log in as an existing test user, navigate to any authenticated page, and screenshot both the desktop view (sidebar should be dark forest green, active item shows a lighter-green pill with a gold icon and ivory label, brand title/subtitle/collapse toggle/footer all legible) and a 390px-wide mobile view (bottom tab bar dark forest green with 4 items + Mais, active item gold icon + ivory label, tapping Mais opens a light sheet with the other 6 items). Report what you see; if any text is illegible against its background, fix that specific rule before moving on — don't proceed to Task 7 with a known contrast bug.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/styles/tokens-component.css packages/ui/src/styles/components.css apps/web/app/globals.css
git commit -m "Retheme the sidebar and tab bar in the mockup's forest green

The mockup renders both the desktop sidebar and the mobile tab bar
in a dark forest green with a gold accent on the active item; the
product's sidebar was still a light neutral surface with no tab bar
at all. Also fixes the sidebar chrome (brand text, collapse toggle,
footer, borders) that assumed a light background and went illegible
once the background changed."
```

---

### Task 7: Wire `product-shell.tsx` to the new primary/overflow split

**Files:**
- Modify: `apps/web/src/components/layout/product-shell.tsx`
- Modify: `apps/web/tests/product-shell.test.tsx` (rewrite the 3 tests that reference the removed "Abrir navegação" button)

**Interfaces:**
- Consumes: `AppShellProps.primaryNavigationItems` (Task 5).
- Produces: nothing further downstream — this is the leaf that makes the real app use everything built so far.

- [ ] **Step 1: Update the failing tests first**

In `apps/web/tests/product-shell.test.tsx`, replace the test at lines 94-112 (`'derives the active route from Next and renders Next-integrated desktop and mobile links'`):

```tsx
  it('derives the active route from Next and renders Next-integrated desktop and overflow-sheet links', () => {
    nextNavigation.pathname = '/curriculum';

    render(
      <ProductShell>
        <p>Conteúdo roteado</p>
      </ProductShell>,
    );

    const desktopLink = screen.getByTestId('appshell-nav-curriculum');
    expect(desktopLink).toHaveAttribute('aria-current', 'page');
    expect(desktopLink).toHaveAttribute('data-next-link', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Mais' }));
    const moreSheet = screen.getByRole('dialog', { name: 'Mais opções' });
    const overflowLink = within(moreSheet).getByRole('link', { name: 'Currículo' });
    expect(overflowLink).toHaveAttribute('aria-current', 'page');
    expect(overflowLink).toHaveAttribute('data-next-link', 'true');
  });
```

Replace the test at (now-shifted, originally) lines 247-260 (`'opens the shared mobile navigation from the topbar control'`):

```tsx
  it('opens the Mais overflow sheet from the tab bar', () => {
    render(
      <ProductShell>
        <p>Conteúdo mobile</p>
      </ProductShell>,
    );

    const moreButton = screen.getByRole('button', { name: 'Mais' });
    expect(moreButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(moreButton);

    expect(moreButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'Mais opções' })).toBeInTheDocument();
  });
```

Replace the test immediately after it (originally lines 262-274, `'renders the profile inside shared mobile navigation'`):

```tsx
  it('renders the profile inside the Mais overflow sheet', () => {
    render(
      <ProductShell user={{ name: 'Wendel Silva', email: 'wendel@aletheia.edu', role: 'OWNER_GUARDIAN' }}>
        <p>Conteúdo mobile</p>
      </ProductShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mais' }));

    const moreSheet = screen.getByRole('dialog', { name: 'Mais opções' });
    expect(within(moreSheet).getByText('Wendel Silva')).toBeInTheDocument();
    expect(within(moreSheet).getByText('Guardião Principal')).toBeInTheDocument();
  });
```

Also add one new test, right after the existing `'filters guardian-only navigation items using the active role permissions'` test (originally lines 114-124), asserting the primary/overflow split itself:

```tsx
  it('splits navigation into four primary tab-bar items and the rest as overflow', () => {
    render(
      <ProductShell>
        <p>Conteúdo</p>
      </ProductShell>,
    );

    expect(screen.getByTestId('appshell-tab-bar-home')).toBeInTheDocument();
    expect(screen.getByTestId('appshell-tab-bar-devotional')).toBeInTheDocument();
    expect(screen.getByTestId('appshell-tab-bar-schedule')).toBeInTheDocument();
    expect(screen.getByTestId('appshell-tab-bar-learners')).toBeInTheDocument();
    expect(screen.queryByTestId('appshell-tab-bar-curriculum')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mais' }));
    const moreSheet = screen.getByRole('dialog', { name: 'Mais opções' });
    expect(within(moreSheet).getByRole('link', { name: 'Currículo' })).toBeInTheDocument();
    expect(within(moreSheet).queryByRole('link', { name: 'Início' })).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @aletheia/web test -- product-shell`
Expected: FAIL — `ProductShell` doesn't pass `primaryNavigationItems` to `AppShell` yet, so `AppShell` (now requiring that prop) either errors or (if the type error is only caught by `typecheck`, not at runtime) falls back to `undefined`, breaking the `.filter`/`.some` calls inside it.

- [ ] **Step 3: Add the primary-item split to `product-shell.tsx`**

In `apps/web/src/components/layout/product-shell.tsx`, add this constant right after `MAIN_NAV_ITEMS` (after line 46):

```ts
const PRIMARY_NAV_ITEM_IDS: ReadonlyArray<NavigationItem['id']> = [
  'home',
  'devotional',
  'schedule',
  'learners',
];
```

In the component body, right after where `navigationItems` is computed (currently lines 218-226, ending with the closing `);` of the `.map()`), add:

```ts
  const primaryNavigationItems = PRIMARY_NAV_ITEM_IDS
    .map((id) => navigationItems.find((item) => item.id === id))
    .filter((item): item is NavigationItem => item !== undefined);
```

(This preserves the declared Início → Devocional → Agenda → Educandos order regardless of `MAIN_NAV_ITEMS`'s own order, and naturally drops any of the four if a future permission rule ever hides one — none do today.)

Then pass it to `AppShell` inside `shellContent` (currently lines 261-283), adding the new prop next to `navigationItems`:

```tsx
    <AppShell
      className="product-shell"
      brandTitle="Aletheia"
      brandSubtitle="Trinity Grove"
      brandLogo={<span className="product-shell-brand-logo">ἀ</span>}
      navigationItems={navigationItems}
      primaryNavigationItems={primaryNavigationItems}
      renderNavigationLink={renderNextNavigationLink}
      topbarActions={topbarActions}
      {...(userProfile !== undefined ? { userProfile } : {})}
    >
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @aletheia/web test -- product-shell`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/layout/product-shell.tsx apps/web/tests/product-shell.test.tsx
git commit -m "Give ProductShell's mobile tab bar its four primary destinations

Início, Devocional, Agenda & Rotina, and Educandos cover the daily
loop the mockup itself emphasizes; the other six items move behind
Mais."
```

---

### Task 8: Full verification pass

**Files:** none (verification only; fix-forward if something surfaces).

- [ ] **Step 1: Full `packages/ui` verification**

Run: `pnpm --filter @aletheia/ui typecheck && pnpm --filter @aletheia/ui lint && pnpm --filter @aletheia/ui test`
Expected: all clean.

- [ ] **Step 2: Full `apps/web` verification**

Run: `pnpm --filter @aletheia/web typecheck && pnpm --filter @aletheia/web lint && pnpm --filter @aletheia/web test`
Expected: all clean.

- [ ] **Step 3: e2e regression check**

Run: `pnpm --filter @aletheia/web test:e2e`
Expected: 26/26 (or whatever the current baseline count is) still passing — per the spec, no existing e2e spec depends on the hamburger button or drawer, and the desktop `Sidebar`'s structure (only its color changed) isn't asserted on by any spec. Before running, confirm no manually-started dev server is already listening on port 3000/3001 (`curl -o /dev/null -w '%{http_code}' http://localhost:3000/` should fail to connect) — a stray manual server has caused spurious failures earlier in this project by making Playwright's `webServer.reuseExistingServer` attach to the wrong instance.

- [ ] **Step 4: Manual visual smoke test on both breakpoints**

Start the API and web dev servers (same pattern used throughout this project: `pnpm dev` in `apps/api` with `DATABASE_URL`/`JWT_SECRET`/`PORT=3001` set, and `pnpm dev` in `apps/web` with `NEXT_PUBLIC_API_URL` pointed at it), log in as an existing test user, and check:
- Desktop (≥1025px): sidebar is dark forest green, no tab bar visible, hamburger button gone from the topbar (topbar shows only actions on the right).
- Mobile (390px): topbar shows the compact "ἀ Aletheia" brand mark on the left and actions on the right (no hamburger); a fixed dark-green tab bar sits at the bottom with Início/Devocional/Agenda & Rotina/Educandos plus Mais; tapping Mais opens a light sheet listing the other 6 items with the signed-in user's name/role at the bottom; tapping Escape or the backdrop closes it.
- Navigate to an overflow route directly (e.g. `/curriculum`) at 390px width and confirm the Mais tab itself shows the active (gold icon / ivory label) styling even though it's not one of the 4 direct links.

Stop the dev servers once the check is done.

- [ ] **Step 5: Update the design-audit artifact (optional, if the user asks for it)**

This plan doesn't include republishing the design-audit artifact from earlier in this project — that was for the PR #58 quick wins. If the user wants this change reflected there too, that's a separate small follow-up (new screenshots + template update), not part of this plan.
