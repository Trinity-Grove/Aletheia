# Mobile Tab Bar & Navigation Theme Design

**Date:** 2026-09-02
**Status:** Approved
**Related:** Brand design audit (mockup vs. product), PR #58 quick wins

---

## 1. Purpose & Overview

The brand design audit compared the product against its original mockup and identified two navigation-shell gaps, both scoped here as one cohesive change to `packages/ui`'s app shell:

1. **Information architecture on mobile.** Today, `AppShell` renders identical navigation on desktop and mobile: a full sidebar with all 10 items on desktop, and the exact same 10 items behind a hamburger-triggered full-screen drawer (`MobileNavigation`) on mobile. The mockup's phone screens instead show a curated bottom tab bar with 4 primary destinations plus a "Mais" overflow — a mobile-native pattern the product never adopted.
2. **Navigation surface color.** The mockup renders both the desktop sidebar and the mobile tab bar in a deep forest-green, with a gold accent on the active item. The product's sidebar today uses a light neutral surface (`--ui-surface-default`), and has no tab bar at all.

Both surfaces (`Sidebar`, and the new `TabBar`) are addressed together because they are the same navigation concept rendered at two breakpoints, and this spec's second half (color) applies identically to both.

Out of scope (explicitly deferred, not part of this spec):
- A true week-at-a-glance completion grid (separate, not-yet-agreed feature).
- Any change to which items exist in `MAIN_NAV_ITEMS` or their permission gating — this spec only changes *how* the existing 10 items are grouped and colored, not the set itself.

---

## 2. Information Architecture: Primary Items vs. Overflow

The 10 items in `apps/web/src/components/layout/product-shell.tsx`'s `MAIN_NAV_ITEMS` split as:

**Primary (always visible in the mobile tab bar):**
- Início (`/`)
- Devocional (`/devotional`)
- Agenda & Rotina (`/schedule`)
- Educandos (`/learners`)

**Overflow (behind "Mais"):**
- Currículo, Diário de Aprendizagem, Portfólio, Frequência, Relatórios, Configurações

Rationale: the primary four cover the daily-use loop (see today, do the devotional, check the week's schedule, check on a learner) that the mockup itself emphasizes ("Plano semanal", "Devocional diário", "Jornada de aprendizado"). Configuração/reporting/records-heavy items are lower-frequency and move to overflow.

This split is a `product-shell.tsx` concern, not a `packages/ui` concern — `AppShell` stays a generic, reusable shell that doesn't know what "Devocional" means.

---

## 3. Component Architecture

### 3.1 `Drawer` gains a `position: 'bottom'` variant

`packages/ui/src/components/drawer.tsx` already implements the focus-trap / Escape / body-scroll-lock machinery needed for any modal overlay panel. Rather than write that logic a third time (it's already duplicated once, between `Drawer` and `MobileNavigation`), extend `DrawerProps.position` from `'right' | 'left'` to `'right' | 'left' | 'bottom'`, with a corresponding `.ui-drawer--bottom` CSS variant (slides up from the bottom edge, full width, rounded top corners, capped height with internal scroll).

### 3.2 New: `TabBar` (`packages/ui/src/components/tab-bar.tsx`)

A presentational, fixed-to-viewport-bottom bar. Props:

```ts
export interface TabBarProps {
  items: NavigationItem[];            // the 4 primary items, with `active` already set
  moreActive: boolean;                // true when the current route is one of the overflow items
  onOpenMore: () => void;
  renderNavigationLink?: NavigationLinkRenderer | undefined;
}
```

Renders the 4 primary items as links (icon + label, same `NavigationItem` shape already used everywhere) plus a trailing "Mais" button (icon: `MoreHorizontal` from `lucide-react`) that calls `onOpenMore`. The "Mais" button gets the same active-state styling as a regular item when `moreActive` is true, aria-haspopup="dialog" and aria-expanded matching sheet state (mirrors the existing hamburger button's a11y attributes).

Respects `env(safe-area-inset-bottom)` via padding so it clears the iOS home-indicator gesture area.

### 3.3 New: `MobileMoreSheet` (`packages/ui/src/components/mobile-more-sheet.tsx`)

A thin wrapper around `<Drawer position="bottom" ariaLabel="Mais opções">` whose children are the overflow-item list, reusing the same list markup `MobileNavigation` used today (icon, label, active state, optional badge). Props:

```ts
export interface MobileMoreSheetProps {
  items: NavigationItem[];            // the 6 overflow items
  open: boolean;
  onClose: () => void;
  renderNavigationLink?: NavigationLinkRenderer | undefined;
  userProfile?: React.ReactNode;
}
```

`userProfile` (the avatar/name/role block) moves here from the deleted `MobileNavigation`, so it's still reachable on mobile — shown at the bottom of the sheet, same as today.

### 3.4 `MobileNavigation` is deleted

Nothing else references it once `AppShell` switches over (confirmed via repo-wide search — only `app-shell.tsx`, its own file, `Navigation.stories.tsx`, and the `packages/ui` test file reference it).

### 3.5 `Topbar` loses the mobile menu button

`packages/ui/src/components/topbar.tsx` drops `onOpenNavigation`, `navigationOpen`, `navigationControlsId`, and the `<button>` that used them. In their place, `Topbar` renders a compact brand mark (`brandLogo` + `brandTitle`, the same props `AppShell` already receives) on the left, visible only below the navigation breakpoint (above it, the Sidebar already shows the full brand block, so the Topbar's copy stays CSS-hidden to avoid duplication).

```ts
export interface TopbarProps {
  brandLogo?: React.ReactNode;
  brandTitle?: React.ReactNode;
  actions?: React.ReactNode;
}
```

### 3.6 `AppShell` changes

- State renamed: `isMobileMenuOpen` → `isMoreSheetOpen`, toggled by `TabBar`'s "Mais" button instead of `Topbar`'s hamburger.
- Derives `overflowItems` from the two lists it's given:
  ```ts
  export interface AppShellProps {
    // ...unchanged...
    navigationItems: NavigationItem[];        // full list, still used for desktop Sidebar
    primaryNavigationItems: NavigationItem[]; // subset for the mobile TabBar
  }
  const overflowItems = navigationItems.filter(
    (item) => !primaryNavigationItems.some((primary) => primary.id === item.id),
  );
  const moreActive = overflowItems.some((item) => item.active);
  ```
- Renders `Sidebar` (unchanged, desktop only via existing CSS), `Topbar` (mobile brand mark + actions), `TabBar` (mobile only, fixed bottom), `MobileMoreSheet` (mobile only, opens from "Mais").
- The breakpoint-crossing focus-restoration effect (today: closing the drawer and moving focus to the sidebar when the viewport grows past 1024px) is preserved, retargeted at `isMoreSheetOpen`.

### 3.7 `product-shell.tsx` changes

Passes `primaryNavigationItems` alongside the existing `navigationItems`, filtering `MAIN_NAV_ITEMS` by the four primary ids and mapping `active` the same way the full list already does. No change to `NAV_ITEM_PERMISSIONS` or `PATH_PERMISSIONS` — permission filtering happens once, before the primary/overflow split, so a hidden item is absent from both the sidebar and the tab bar/sheet.

---

## 4. Navigation Surface Color

All values come from tokens already defined in `apps/web/app/globals.css` — no new colors introduced.

| Element | Today | New | Token |
|---|---|---|---|
| Sidebar / TabBar background | `--ui-surface-default` (light) | dark forest green | `--forest-2` (`#0c3028`) |
| Active item pill background | `--sage-soft` | lighter forest step | `--forest` (`#123f34`) |
| Active item icon/accent | inherited text color | gold | `--gold-muted` (`#d7bf79`) |
| Active item label | inherited text color | light | `--ivory` (`#fbf8ef`) |
| Inactive item icon/label | default gray text | muted sage | `--sage` (`#78937f`) |

Changes land in two places:
- `packages/ui/src/styles/tokens-component.css`: `--ui-navigation-sidebar-background` becomes `var(--forest-2)` (currently `var(--ui-surface-default)`). This is the single token both `Sidebar` and `TabBar` read for their background, so both pick up the change from one edit.
- `packages/ui/src/styles/components.css`: `.ui-sidebar-navigation-link--active` (and the equivalent new `.ui-tab-bar-item--active` rule) get the pill/gold/ivory treatment; the default (inactive) link color switches from its current gray to `--sage`.

`--forest-2`, `--forest`, `--gold-muted`, `--sage`, and `--ivory` are defined in `apps/web/app/globals.css` (the app), not inside `@aletheia/ui`. Today, every `--ui-*` token in `tokens-component.css`/`tokens-semantic.css` resolves to an internal primitive defined inside the package itself (e.g. `--ui-surface-default: var(--primitive-color-paper)`) — none of them reference an app-level custom property. Having `--ui-navigation-sidebar-background` resolve to `var(--forest-2)` is therefore a new coupling: the package's navigation-color tokens become dependent on the consuming app defining those five brand variables at `:root`. This is deliberate and low-risk here because `@aletheia/ui` currently has exactly one consumer (`apps/web`, confirmed via its `package.json` dependents) — CSS custom properties resolve at computed-value time, so it doesn't matter that `@aletheia/ui/css` is imported before `globals.css` in `apps/web/app/layout.tsx`; `--forest-2` just needs to be defined at `:root` by the time the browser paints, which it is. If `@aletheia/ui` ever gains a second consumer that doesn't define these five variables, the affected rules would need a `var(--forest-2, <fallback>)` fallback — not needed today, so not added preemptively (YAGNI).

The `MobileMoreSheet` (the "Mais" panel) keeps its current light background — it's a secondary, occasionally-opened panel, not one of the two constantly-visible navigation surfaces the mockup themes darkly.

---

## 5. Testing

### 5.1 `packages/ui/tests/new-components.test.tsx`

The existing `AppShell` describe block has ~10 assertions built around the hamburger button and `MobileNavigation` (open/close, focus trap, Escape handling, breakpoint-triggered close-and-refocus, `renderNavigationLink` forwarding). These get rewritten against the new shape:
- `TabBar` renders exactly the 4 primary items plus "Mais".
- Clicking "Mais" opens `MobileMoreSheet` with the 6 overflow items; closing it (Escape, backdrop click, close button) restores focus to the "Mais" button.
- `moreActive` styling applies when the active item is among the overflow set.
- `renderNavigationLink` is forwarded to both `TabBar` and `MobileMoreSheet`.
- Breakpoint crossing above 1024px closes an open `MobileMoreSheet` and moves focus to the desktop sidebar (same behavior the old test asserted for the drawer, retargeted).

Since `MobileMoreSheet` wraps the already-tested `Drawer`, it does not need its own from-scratch focus-trap test — only that it renders the right items and forwards `open`/`onClose` correctly. Add a small `Drawer` unit test for the new `position="bottom"` variant's class name.

### 5.2 `apps/web` — `product-shell.spec.tsx` (or equivalent)

Update fixtures that currently assert all 10 items appear in one drawer; assert instead that `primaryNavigationItems` contains the expected 4 ids in order, and that permission-gated items (`reports`, `settings`) are correctly excluded from both the tab bar and the overflow sheet when the role lacks the permission (mirrors the existing test for the desktop sidebar).

### 5.3 No new e2e

This is viewport-driven component behavior already covered by component tests; no new Playwright spec is added. Existing e2e specs that navigate via `page.getByRole('link', { name: ... })` inside the sidebar are unaffected (desktop viewport, `Sidebar` unchanged in structure — only its color changes, which no test asserts on).

---

## 6. Migration Notes

- This is purely a `packages/ui` + `product-shell.tsx` change; no API, schema, or route changes.
- No feature flag — the old mobile drawer is deleted outright, not hidden behind a toggle, consistent with this codebase's "change the code, don't shim it" convention.
- Storybook's `Navigation.stories.tsx` (which references `MobileNavigation`) is updated to demo `TabBar` + `MobileMoreSheet` instead.
