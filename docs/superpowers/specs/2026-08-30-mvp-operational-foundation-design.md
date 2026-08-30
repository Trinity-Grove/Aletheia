# Increment 3: Operational MVP Foundation, Real Auth & Design System Completion Design

**Date:** 2026-08-30  
**Status:** Approved  
**Related Issues:** #20, #21, #22, #23, #24, #25

---

## 1. Purpose & Overview

Following the stabilization of the Design System (Increment 1) and the Backend Family Dashboard Projection (Increment 2), **Increment 3** elevates Aletheia into a fully operational Minimum Viable Product (MVP).

This specification resolves the primary functional blockers:
1. **Centralized HTTP Client & Structured Errors:** Eliminating fragmented `fetch` and raw `localStorage` reads in favor of a robust, typed client (`apiClient`).
2. **Real Authentication & Reactive Session (`Issue #20`):** Connecting login and registration forms to the backend identity endpoints and managing session lifecycles without fake default roles.
3. **Persisted Family Onboarding (`Issue #21`):** Connecting `/onboarding` to `POST /api/v1/families` in PostgreSQL.
4. **Truthful ProductShell (`Issue #24`):** Removing the hardcoded fallback user ("Família Santos" / `OWNER_GUARDIAN`) to ensure that missing or unauthenticated sessions are handled faithfully.
5. **Semantic Icon Catalog & Governance (`Issue #25`):** Exporting `AletheiaIcon` from `@aletheia/ui` with strict grid sizes (16, 20, 24, 32px) and blocking unregulated direct Lucide imports.
6. **Page Style & Token Normalization (`Issue #22`):** Migrating arbitrary hex colors and inline styles across all remaining web pages to `@aletheia/ui` tokens and components.
7. **End-to-End Real Journey Smoke Test (`Issue #23`):** Playwright automated test asserting the complete family workflow against the PostgreSQL database.
8. **Storybook & Automated Accessibility Tooling:** Storybook setup in `@aletheia/ui` with comprehensive stories and automated WCAG 2.1 AA checking (`@storybook/addon-a11y` / `axe-core`).

---

## 2. Centralized HTTP API Client (`apps/web/src/lib/api/client.ts`)

### 2.1 Architecture
The web application requires a single, typed HTTP transport client that abstracts header injection, base URL resolution, and error parsing.

```ts
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  token?: string | null;
  familyId?: string | null;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly error: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### 2.2 Behavior & Error Translation
- **Base URL:** Resolved via `process.env.NEXT_PUBLIC_API_URL || '/api/v1'`.
- **Authorization Header:** Automatically injected when an active session token is present.
- **Tenant Header / Scoping:** Automatically injects `x-family-id` or routes requests with appropriate path parameters.
- **Status Codes:**
  - `401 Unauthorized`: Broadcasts an `auth:unauthorized` event to invalidate local session state and redirect to `/login`.
  - `400/403/404/409/500`: Parses the NestJS error envelope (`{ statusCode, message, error }`), surfacing human-readable messages in Portuguese.
- **Convenience Methods:** `api.get<T>`, `api.post<T>`, `api.patch<T>`, `api.put<T>`, `api.delete<T>`.

---

## 3. Real Authentication & Reactive Session (`apps/web/src/lib/auth/auth-context.tsx`)

### 3.1 State Machine
```ts
export interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: UserSummaryDto | null;
  token: string | null;
  activeFamilyId: string | null;
  activeRole: FamilyRole | null;
  families: FamilySummaryDto[];
}
```

### 3.2 Operations
1. **`login({ email, password })`:**
   - Calls `POST /api/v1/auth/login` (`LoginDto` $\to$ `AuthResponseDto`).
   - Stores JWT token securely in token storage.
   - Fetches user profile via `GET /api/v1/auth/me`.
   - Fetches associated families via `GET /api/v1/families`.
   - Sets state to `'authenticated'` and active family to the first available family (or `null` if none exist).
   - Redirects to `/` (or requested redirect destination).
2. **`register({ email, password, fullName })`:**
   - Calls `POST /api/v1/auth/register` (`RegisterGuardianDto` $\to$ `AuthResponseDto`).
   - Sets session state to `'authenticated'` with zero families.
   - Redirects to `/onboarding`.
3. **`logout()`:**
   - Clears token and user state.
   - Transitions to `'unauthenticated'` and routes to `/login`.
4. **`selectFamily(familyId: string)`:**
   - Sets `activeFamilyId` in session state and persists active preference.

### 3.3 Form Connections
- `apps/web/app/(auth)/login/page.tsx`: Connects `LoginForm` to `useAuth().login`. Displays field-level loading and alerts on invalid credentials.
- `apps/web/app/(auth)/register/page.tsx`: Connects `RegisterForm` to `useAuth().register`.

---

## 4. Persisted Onboarding & Truthful ProductShell

### 4.1 Onboarding Persistence (`apps/web/app/(dashboard)/onboarding/page.tsx`)
- Submits `POST /api/v1/families` via `api.post<FamilyResponseDto>`.
- Body: `{ name: familyName, countryCode, stateProvince: stateProvince || undefined }`.
- On success:
  - Updates `AuthContext` with the newly created family.
  - Automatically selects it as `activeFamilyId`.
  - Redirects to `/` or `/learners`.

### 4.2 ProductShell Truthfulness (`apps/web/src/components/layout/product-shell.tsx`)
- **Removal of Mock Fallback:** Delete hardcoded default `Família Santos`, `user-1`, and default `OWNER_GUARDIAN`.
- **Session Handling:**
  - `status === 'loading'`: Renders a loading state / skeleton shell with `aria-busy="true"`.
  - `status === 'unauthenticated'`: Redirects to `/login` for protected dashboard routes.
  - `status === 'authenticated'`: Derives user details, role permissions, and active family directly from the verified session.

---

## 5. Semantic Icon Governance (`packages/ui/src/components/icon.tsx`)

### 5.1 Icon Component Contract
```tsx
export type IconSize = 'sm' | 'md' | 'lg' | 'xl'; // 16px, 20px, 24px, 32px
export type IconName =
  | 'home' | 'learners' | 'devotional' | 'curriculum' | 'schedule'
  | 'records' | 'portfolio' | 'attendance' | 'reports' | 'settings'
  | 'calendar' | 'book-open' | 'pen-line' | 'folder-heart' | 'bar-chart'
  | 'check' | 'x' | 'plus' | 'menu' | 'chevron-left' | 'chevron-right'
  | 'chevron-down' | 'bell' | 'user' | 'lock' | 'mail' | 'eye' | 'eye-off'
  | 'sparkles' | 'book' | 'graduation-cap' | 'download' | 'upload' | 'trash';

export interface AletheiaIconProps {
  name: IconName;
  size?: IconSize; // default: 'md' (20px)
  className?: string;
  label?: string; // If present, sets role="img" and aria-label; if omitted, aria-hidden="true"
}
```

### 5.2 Icon Rules
1. Size scale mapped to design tokens:
   - `sm`: 16px
   - `md`: 20px (default)
   - `lg`: 24px
   - `xl`: 32px
2. `lucide-react` is only imported inside `packages/ui/src/components/icon.tsx`.
3. Application code consumes `<AletheiaIcon name="..." size="..." />` exclusively.

---

## 6. Page Style & Token Normalization (`apps/web`)

### 6.1 Affected Pages
- `apps/web/app/(dashboard)/portfolio/page.tsx`
- `apps/web/app/(dashboard)/reports/page.tsx`
- `apps/web/app/(dashboard)/schedule/page.tsx`
- `apps/web/app/(dashboard)/records/page.tsx`
- `apps/web/app/(dashboard)/attendance/page.tsx`
- `apps/web/app/(dashboard)/devotional/page.tsx`
- `apps/web/app/(dashboard)/curriculum/page.tsx`
- `apps/web/app/(dashboard)/settings/page.tsx`
- `apps/web/app/(dashboard)/learners/page.tsx`

### 6.2 Normalization Rules
1. Zero inline `style={{ ... }}` in page layouts and controls.
2. Replace all hardcoded hex colors (`#111827`, `#6B7280`, `#D97706`, etc.) with `@aletheia/ui` semantic CSS variables (`--ui-color-text-primary`, `--ui-color-text-muted`, `--ui-color-surface-card`, `--ui-color-border-subtle`, `--ui-color-gold`, etc.).
3. Standardize layouts using `@aletheia/ui` components: `PageHeader`, `Card`, `Button`, `EmptyState`, `Badge`, `Modal`.

---

## 7. End-to-End Real Family Journey Test (`apps/web/e2e/mvp-journey.spec.ts`)

### 7.1 Verification Scope
A multi-step Playwright test executing against a live API and PostgreSQL instance:
1. **Registration:** Registers a unique guardian account (`/register`).
2. **Login:** Authenticates with credentials (`/login`).
3. **Onboarding:** Creates a sovereign family aggregate (`/onboarding`).
4. **Learner Setup:** Adds a real learner via `/learners`.
5. **Dashboard Reflection:** Asserts that `/` reflects the authenticated guardian, family name, and real learner without fallback mocks.
6. **Activity Execution:** Completes a lesson activity and verifies updated metrics.
7. **Report Retrieval:** Visits `/reports` and validates data recovery.

---

## 8. Storybook & Automated Accessibility Tooling (`packages/ui`)

### 8.1 Setup & Configuration
- **Framework:** Storybook 8+ with `@storybook/react-vite`.
- **Styles:** Automatically loads `@aletheia/ui/css`, `tokens.css`, `components.css`, and Trinity Grove typography.
- **Stories:** Stories for all 25 primitive components and 2 shared patterns (`DailyJourney`, `ActivityList`), showcasing interactive states, sizes, and variants.

### 8.2 Automated A11y
- Integration of `@storybook/addon-a11y`.
- Automated axe-core accessibility audits for contrast, accessible names, focus indicators, and ARIA relationships.
- Storybook build check added to CI: `pnpm --filter @aletheia/ui storybook:build`.

---

## 9. Delivery & Verification Checklist

1. **API Client & Auth:** All auth flows, token renewal, and structured error states covered by unit and component tests.
2. **Onboarding & Shell:** Zero fabricated data in tests or production code.
3. **Icons & Styling:** Zero direct `lucide-react` imports outside `@aletheia/ui`, zero arbitrary hex colors or inline layout styles.
4. **E2E Smoke:** `pnpm --filter @aletheia/web test:e2e` passes all tests including `mvp-journey.spec.ts`.
5. **Storybook:** `pnpm --filter @aletheia/ui storybook:build` passes cleanly with zero a11y violations.
6. **Repository Gate:** `pnpm verify` exits 0 across all packages.
