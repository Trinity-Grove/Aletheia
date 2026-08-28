# Design as Code Stabilization and Real Dashboard Design

**Date:** 2026-08-28

**Status:** Approved

## Purpose

Advance Aletheia's Design as Code foundation through two ordered, independently verifiable increments:

1. stabilize the uncommitted design-system work inherited from the Antigravity session;
2. replace the production dashboard's fictitious data with an authenticated, family-scoped backend projection.

Storybook, automated axe coverage in Storybook, visual regression, the remaining broad inline-style migration, design-system documentation, and CI gates are explicitly deferred until these two increments are complete and green.

## Existing State and Preservation Rule

The worktree starts from `main` at commit `78468fc` and contains uncommitted Antigravity changes. These changes include fixes for invalid SVG children in native options, layered token files, new shared components, shared patterns, ProductShell migration, CSS, and tests.

All inherited changes must be treated as work to preserve. The implementation may amend them when tests or the approved design require it, but must not discard or overwrite them wholesale. Commits must include only reviewed files belonging to the current increment.

## Increment 1: Stabilize the Existing Design-System Work

### Native Select Correctness

Every native `<option>` must contain text only. Configuration objects may retain icons for rendering outside native options, but option content must use the corresponding text label. Tests must fail if React reports invalid option descendants or hydration-related console errors.

### Token Architecture

CSS tokens are divided into three public layers:

- primitive tokens define raw palette, type scale, spacing, radii, shadows, duration values, easing values, and breakpoints;
- semantic tokens map primitives to product intent such as actions, surfaces, text, borders, focus rings, disabled states, selection, scrims, and semantic elevation;
- component tokens define stable customization contracts for controls, overlays, navigation, and shared patterns.

The existing `tokens.css` remains the compatibility entry point and imports the three layers in dependency order. Components consume semantic or component tokens rather than primitive palette values wherever a semantic mapping exists.

### Shared Components

`@aletheia/ui` publicly exports:

- `Drawer`;
- `Dropdown`;
- `Tooltip`;
- `SectionHeader`;
- `DataList`;
- `AppShell`;
- `Sidebar`;
- `Topbar`;
- `MobileNavigation`.

`Sidebar`, `Topbar`, and `MobileNavigation` are independently exported parts of the AppShell composition, not private markup embedded in the web application. Interactive components provide keyboard operation, focus behavior, accessible naming, and appropriate ARIA relationships. Components use stable `ui-*` classes and do not generate arbitrary inline style objects.

### Shared Patterns

`DailyJourney` and `ActivityList`, including their public prop types, live under `packages/ui/src/patterns` and are exported by `@aletheia/ui`. They remain presentation-only: no authentication, routing, storage, or HTTP behavior belongs in the package.

### ProductShell Boundary

`ProductShell` remains in `apps/web` as the integration adapter. It owns:

- Aletheia's navigation configuration;
- current-route mapping;
- active-family and active-learner integration;
- authorization and permission filtering;
- notification integration;
- Next.js-specific links and routing behavior.

It delegates responsive layout and navigation regions to `AppShell`. The files changed in this increment must replace inline layout styles with stable classes backed by semantic or component tokens. Compatibility with existing page call sites is required.

## Increment 2: Authenticated Dashboard Projection

### API Endpoint

The API adds:

```text
GET /api/v1/families/:familyId/dashboard?date=YYYY-MM-DD&learnerId=<optional UUID>
```

`date` is required and interpreted as a calendar date. `learnerId` is optional: omission requests a family-wide projection, while a value requests a learner-specific projection.

The endpoint uses the existing authentication and family-membership authorization mechanisms. A caller without family access receives `403`. A learner that is absent, archived when not eligible for the view, or outside the requested family produces `404`; the response must not disclose cross-family existence.

### Shared Contract

`packages/contracts` exports a Zod schema and inferred TypeScript type equivalent to:

```ts
interface DashboardResponseDto {
  date: string;
  family: {
    id: string;
    name: string;
  };
  learners: Array<{
    id: string;
    displayName: string;
  }>;
  activeLearnerId: string | null;
  journey: {
    completedMinutes: number;
    targetMinutes: number;
    completedLessons: number;
    totalLessons: number;
    daySequence: number;
  };
  activities: Array<{
    id: string;
    title: string;
    subjectName?: string;
    scheduledTime?: string;
    durationMinutes?: number;
    completed: boolean;
    type: 'devotional' | 'lesson' | 'routine';
  }>;
}
```

The final schema must follow the repository's strict TypeScript settings, including its optional-property conventions. API and web consumers use this shared contract instead of duplicating transport types.

### Aggregation and Calculations

A dedicated dashboard application service builds the response from existing family, learner, schedule, lesson, devotional, and progress data. It returns transport-safe DTOs rather than database entities.

The backend calculates:

- activities scheduled for the requested date and filter;
- completed and total lessons;
- completed instructional minutes;
- the configured or domain-derived daily target minutes;
- the academic-year day sequence.

When the current domain cannot supply a value truthfully, the service returns a documented neutral value such as zero rather than invented sample data. Any required repository extensions must preserve family scoping at their interfaces.

### Web Data Flow

The production home page contains no named sample learners, sample activities, or other demo records. Its controller or hook:

1. reads the authenticated session;
2. resolves the active family using the application's existing family-selection convention;
3. requests the dashboard for the local calendar date and optional active learner;
4. renders the shared presentational patterns from the validated response;
5. completes supported lesson activities through the existing lesson endpoint;
6. refreshes the dashboard only after the mutation succeeds.

The server remains authoritative. The UI must not optimistically increase progress before a successful completion response.

### Required UI States

The page provides explicit, accessible states:

- loading: the dashboard region exposes `aria-busy="true"` and a visible loading affordance;
- no active family: an onboarding-oriented empty state and no malformed request;
- family with no learners: a valid empty state with an action leading to learner setup;
- day with no activities: a valid editorial empty state while retaining truthful journey values;
- request failure: an alert with a retry action;
- learner change: the existing content remains structurally stable while the refreshed region reports busy state;
- activity mutation failure: the activity remains unchanged and an actionable error is announced.

## Error and Security Rules

- Authentication failures use the repository's existing authentication response behavior.
- Family authorization is enforced in the API, never inferred only from client state.
- Dashboard repository/service methods require an explicit `familyId`.
- Cross-family learner identifiers never return distinguishing data.
- User-facing failures use concise Portuguese copy and must not expose internal error details.
- Dates are serialized as `YYYY-MM-DD`; the client supplies the user's local calendar date rather than deriving it from a UTC timestamp substring.

## Testing Strategy

### Increment 1

- Add or extend component tests for every new public UI component.
- Cover keyboard behavior, accessible names, focus movement or restoration, and responsive-region rendering where applicable.
- Verify `DailyJourney` and `ActivityList` through their package exports.
- Exercise affected web selects while trapping unexpected `console.error` output.
- Run UI package tests, typecheck, lint, and build.
- Run affected web tests, typecheck, lint, and build.

### Increment 2

- Test the dashboard Zod contract with populated and empty responses and invalid cross-field shapes where applicable.
- Unit-test aggregation calculations and family/learner filtering in the dashboard service.
- Add API end-to-end coverage for authenticated success, empty data, forbidden family access, and an external learner identifier.
- Test the web dashboard's loading, no-family, no-learners, no-activities, failure/retry, learner selection, successful completion, and failed completion states.
- Run contracts, API, UI, and web quality gates affected by the change, followed by the repository-wide verification command if available.

## Delivery Boundaries

Increment 1 and Increment 2 are separate commits or commit series and must each end in a green, reviewable state. Storybook and the remaining completion work begin only after both increments pass their defined verification.

No production mock data may be retained as a fallback for API failures. Fixtures may exist only in tests and, in the later Storybook increment, stories.
