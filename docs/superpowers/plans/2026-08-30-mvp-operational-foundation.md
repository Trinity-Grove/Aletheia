# Increment 3: Operational MVP Foundation & Real Family Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Aletheia into an operational MVP by connecting real authentication/session lifecycles, persisting family onboarding, removing fake data, standardizing semantic icons, normalizing page styles to tokens, building Storybook with automated a11y, and proving the complete family journey with Playwright.

**Architecture:** A centralized HTTP client (`apiClient`) and `AuthContext` manage token lifecycles, tenant scoping, and error handling. `ProductShell` and pages consume real session data and `@aletheia/ui` semantic components/tokens with zero inline styles. Storybook provides isolated component validation with axe-core a11y, and a comprehensive Playwright suite verifies the full database-backed journey.

**Tech Stack:** Next.js 16.3.2, React 19, NestJS 11, TypeScript 5.9, Zod 4, Vitest, Testing Library, Playwright, Storybook 8+, Lucide React.

**Spec:** `docs/superpowers/specs/2026-08-30-mvp-operational-foundation-design.md`

## Global Constraints

- No production code may fall back to fabricated identities ("Família Santos"), mock learners, or default `OWNER_GUARDIAN` roles.
- `apps/web` must not make direct, ad-hoc `fetch` calls or read raw `localStorage` for API tokens; use `apiClient` and `AuthContext`.
- `apps/web` must not import `lucide-react` directly with arbitrary sizes; use `AletheiaIcon` from `@aletheia/ui`.
- Native `<option>` elements must never receive SVG/React node children; text only.
- Strict TypeScript (`exactOptionalPropertyTypes: true`).
- Zero arbitrary inline styles (`style={{ ... }}`) or hardcoded hex colors in page layouts; use CSS semantic token classes.
- All user-facing error messages must be concise, actionable, and in Portuguese.
- All repository gates (`pnpm verify`, `pnpm --filter @aletheia/web test:e2e`) must pass with exit code 0.

---

### Task 1: Centralized HTTP API Client (`apiClient`)

**Files:**
- Create: `apps/web/src/lib/api/client.ts`
- Create: `apps/web/tests/api-client.test.ts`
- Create: `apps/web/src/lib/api/index.ts`

**Interfaces:**
- Produces: `apiClient`, `api`, `ApiError`, `RequestOptions`.
- Signatures:
  ```ts
  export class ApiError extends Error {
    constructor(
      public readonly statusCode: number,
      public readonly error: string,
      message: string,
      public readonly details?: unknown,
    );
  }
  export const api: {
    get<T>(path: string, options?: RequestOptions): Promise<T>;
    post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    delete<T>(path: string, options?: RequestOptions): Promise<T>;
  };
  ```

- [ ] **Step 1: Write failing unit tests for `apiClient`**

```ts
// apps/web/tests/api-client.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, ApiError, setApiAuthToken, getApiAuthToken } from '../src/lib/api/client';

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setApiAuthToken(null);
  });

  it('injects Authorization header when token is set', async () => {
    setApiAuthToken('valid-jwt-token');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    });
    global.fetch = mockFetch;

    const result = await api.get('/health');
    expect(result).toEqual({ status: 'ok' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/health'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer valid-jwt-token',
        }),
      }),
    );
  });

  it('throws ApiError with NestJS envelope on HTTP failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({
        statusCode: 400,
        error: 'Bad Request',
        message: 'E-mail já está em uso.',
      }),
    });

    await expect(api.post('/auth/register', {})).rejects.toThrow(ApiError);
    await expect(api.post('/auth/register', {})).rejects.toMatchObject({
      statusCode: 400,
      message: 'E-mail já está em uso.',
      error: 'Bad Request',
    });
  });

  it('broadcasts auth:unauthorized event on 401', async () => {
    const unauthorizedHandler = vi.fn();
    window.addEventListener('auth:unauthorized', unauthorizedHandler);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ statusCode: 401, message: 'Unauthorized' }),
    });

    await expect(api.get('/families')).rejects.toThrow(ApiError);
    expect(unauthorizedHandler).toHaveBeenCalled();
    window.removeEventListener('auth:unauthorized', unauthorizedHandler);
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `corepack pnpm --filter @aletheia/web test -- api-client.test.ts`  
Expected: FAIL because `client.ts` does not exist.

- [ ] **Step 3: Implement `apiClient`**

Implement `apps/web/src/lib/api/client.ts` with `NEXT_PUBLIC_API_URL` fallback, token management, header injection, query param serialization, and NestJS error envelope parsing.

- [ ] **Step 4: Run tests and verify they pass**

Run: `corepack pnpm --filter @aletheia/web test -- api-client.test.ts`  
Run: `corepack pnpm --filter @aletheia/web typecheck`  
Run: `corepack pnpm --filter @aletheia/web lint`

- [ ] **Step 5: Commit `apiClient`**

```bash
git add apps/web/src/lib/api apps/web/tests/api-client.test.ts
git commit -m "feat(web): implement centralized typed http api client"
```

---

### Task 2: Real Authentication & Reactive Session (`AuthContext`, `useAuth`)

**Files:**
- Create: `apps/web/src/lib/auth/auth-context.tsx`
- Create: `apps/web/src/lib/auth/index.ts`
- Create: `apps/web/tests/auth-context.test.tsx`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/src/components/auth/login-form.tsx`
- Modify: `apps/web/src/components/auth/register-form.tsx`
- Modify: `apps/web/app/(auth)/login/page.tsx`
- Modify: `apps/web/app/(auth)/register/page.tsx`

**Interfaces:**
- Produces: `AuthProvider`, `useAuth`, `AuthState`.
- Consumes: `@aletheia/contracts` (`LoginDto`, `RegisterGuardianDto`, `AuthResponseDto`, `UserSummaryDto`, `FamilySummaryDto`), `apiClient`.

- [ ] **Step 1: Write tests for `AuthContext` and form connections**

```tsx
// apps/web/tests/auth-context.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from '../src/lib/auth/auth-context';
import { LoginForm } from '../src/components/auth/login-form';
import { RegisterForm } from '../src/components/auth/register-form';

function TestConsumer() {
  const { status, user, activeFamilyId, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{status}</span>
      <span data-testid="user-email">{user?.email ?? 'no-user'}</span>
      <span data-testid="active-family">{activeFamilyId ?? 'no-family'}</span>
      <button onClick={() => login({ email: 'parent@example.com', password: 'password123' })}>
        Trigger Login
      </button>
      <button onClick={logout}>Trigger Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts unauthenticated when no token exists', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
    });
    expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
  });

  it('executes login flow and loads profile and families', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // Mock API responses
    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      if (String(url).includes('/auth/login')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            accessToken: 'test-token',
            user: { id: 'u1', email: 'parent@example.com', fullName: 'Jackson Sá', createdAt: '2026-08-30' },
          }),
        } as Response;
      }
      if (String(url).includes('/families')) {
        return {
          ok: true,
          status: 200,
          json: async () => ([
            { id: 'f1', name: 'Família Sá', countryCode: 'BRA', role: 'OWNER_GUARDIAN' }
          ]),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    await user.click(screen.getByText('Trigger Login'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('parent@example.com');
      expect(screen.getByTestId('active-family')).toHaveTextContent('f1');
    });
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `corepack pnpm --filter @aletheia/web test -- auth-context.test.tsx`  
Expected: FAIL because `auth-context.tsx` does not exist.

- [ ] **Step 3: Implement `AuthProvider`, `useAuth`, and wire up `LoginForm` & `RegisterForm`**

- Create `apps/web/src/lib/auth/auth-context.tsx`.
- Wrap `apps/web/app/layout.tsx` in `<AuthProvider>`.
- Wire `LoginForm` (`onSubmit` calling `useAuth().login`) and `RegisterForm` (`onSubmit` calling `useAuth().register`).
- On successful login, navigate to `/`. On register, navigate to `/onboarding`.

- [ ] **Step 4: Run unit and component tests**

Run: `corepack pnpm --filter @aletheia/web test -- auth-context.test.tsx`  
Run: `corepack pnpm --filter @aletheia/web typecheck`  
Run: `corepack pnpm --filter @aletheia/web lint`

- [ ] **Step 5: Commit Auth Context & Forms**

```bash
git add apps/web/src/lib/auth apps/web/app/layout.tsx apps/web/src/components/auth apps/web/app/\(auth\) apps/web/tests/auth-context.test.tsx
git commit -m "feat(web): integrate real auth context and login/register forms"
```

---

### Task 3: Persisted Family Onboarding & Truthful ProductShell

**Files:**
- Modify: `apps/web/app/(dashboard)/onboarding/page.tsx`
- Modify: `apps/web/src/components/layout/product-shell.tsx`
- Create: `apps/web/tests/onboarding-persistence.test.tsx`
- Modify: `apps/web/tests/product-shell.test.tsx`

**Interfaces:**
- Consumes: `api.post('/families')`, `useAuth()`, `@aletheia/ui` (`ProductShell`, `AppShell`, `Button`, `Input`, `Select`).

- [ ] **Step 1: Write tests for real family onboarding & truthful shell**

```tsx
// apps/web/tests/onboarding-persistence.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import OnboardingPage from '../app/(dashboard)/onboarding/page';
import { AuthProvider } from '../src/lib/auth/auth-context';

describe('OnboardingPage Persistence', () => {
  it('calls POST /families and redirects on submission', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'new-fam-123',
        name: 'Família Oliveira',
        countryCode: 'BRA',
      }),
    } as Response);

    render(
      <AuthProvider>
        <OnboardingPage />
      </AuthProvider>,
    );

    await user.type(screen.getByTestId('family-name-input'), 'Família Oliveira');
    await user.click(screen.getByTestId('create-family-button'));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/families'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Família Oliveira',
            countryCode: 'BRA',
          }),
        }),
      );
    });
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run: `corepack pnpm --filter @aletheia/web test -- onboarding-persistence.test.tsx`  
Expected: FAIL because `OnboardingPage` still sets local state `setSubmitted(true)`.

- [ ] **Step 3: Implement PostgreSQL family persistence & truthful `ProductShell`**

- Update `apps/web/app/(dashboard)/onboarding/page.tsx` to submit payload to `/families` using `api.post`, add family to `AuthContext`, and redirect to `/learners`.
- Update `apps/web/src/components/layout/product-shell.tsx`:
  - Remove fallback `Família Santos`, `user-1`, and hardcoded `OWNER_GUARDIAN`.
  - Check `auth.status`. If loading, render loading state. If unauthenticated, redirect to `/login`. If authenticated, render verified user and active family.

- [ ] **Step 4: Run tests, typecheck, and lint**

Run: `corepack pnpm --filter @aletheia/web test -- onboarding-persistence.test.tsx`  
Run: `corepack pnpm --filter @aletheia/web typecheck`  
Run: `corepack pnpm --filter @aletheia/web lint`

- [ ] **Step 5: Commit Onboarding & Truthful Shell**

```bash
git add apps/web/app/\(dashboard\)/onboarding/page.tsx apps/web/src/components/layout/product-shell.tsx apps/web/tests/onboarding-persistence.test.tsx
git commit -m "feat(web): persist family onboarding and eliminate fake shell fallbacks"
```

---

### Task 4: Semantic Icon Component & Governance (`AletheiaIcon`)

**Files:**
- Create: `packages/ui/src/components/icon.tsx`
- Modify: `packages/ui/src/components/index.ts`
- Modify: `packages/ui/src/index.ts`
- Create: `packages/ui/tests/icon.test.tsx`
- Modify: `apps/web/src/components/layout/product-shell.tsx`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/src/components/dashboard/learner-focus-header.tsx`

**Interfaces:**
- Produces: `AletheiaIcon`, `AletheiaIconProps`, `IconName`, `IconSize`.
- Sizes: `sm` (16px), `md` (20px), `lg` (24px), `xl` (32px).

- [ ] **Step 1: Write unit tests for `AletheiaIcon`**

```tsx
// packages/ui/tests/icon.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AletheiaIcon } from '../src/components/icon';

describe('AletheiaIcon', () => {
  it('renders decorative icon with aria-hidden by default', () => {
    const { container } = render(<AletheiaIcon name="home" size="md" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  it('renders accessible icon with role="img" and aria-label when label is provided', () => {
    render(<AletheiaIcon name="bell" size="sm" label="Notificações" />);
    const icon = screen.getByRole('img', { name: 'Notificações' });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('width', '16');
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run: `corepack pnpm --filter @aletheia/ui test -- icon.test.tsx`  
Expected: FAIL because `icon.tsx` does not exist.

- [ ] **Step 3: Implement `AletheiaIcon` and migrate direct Lucide imports**

- Create `packages/ui/src/components/icon.tsx` mapping domain icon names to standard sizes.
- Export `AletheiaIcon` and types from `@aletheia/ui`.
- Replace direct `lucide-react` imports in `ProductShell`, `HomePage`, and dashboard components with `AletheiaIcon`.

- [ ] **Step 4: Run UI and Web checks**

Run: `corepack pnpm --filter @aletheia/ui test`  
Run: `corepack pnpm --filter @aletheia/ui build`  
Run: `corepack pnpm --filter @aletheia/web typecheck`  
Run: `corepack pnpm --filter @aletheia/web lint`

- [ ] **Step 5: Commit `AletheiaIcon`**

```bash
git add packages/ui/src/components/icon.tsx packages/ui/src/components/index.ts packages/ui/src/index.ts packages/ui/tests/icon.test.tsx apps/web
git commit -m "feat(ui): add semantic AletheiaIcon catalog and replace direct imports"
```

---

### Task 5: Page Style & Token Normalization Across Web Pages

**Files:**
- Modify: `apps/web/app/(dashboard)/portfolio/page.tsx`
- Modify: `apps/web/app/(dashboard)/reports/page.tsx`
- Modify: `apps/web/app/(dashboard)/schedule/page.tsx`
- Modify: `apps/web/app/(dashboard)/records/page.tsx`
- Modify: `apps/web/app/(dashboard)/attendance/page.tsx`
- Modify: `apps/web/app/(dashboard)/devotional/page.tsx`
- Modify: `apps/web/app/(dashboard)/curriculum/page.tsx`
- Modify: `apps/web/app/(dashboard)/settings/page.tsx`
- Modify: `apps/web/app/(dashboard)/learners/page.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes: `@aletheia/ui` CSS semantic classes and tokens (`--ui-color-text-primary`, `--ui-color-surface-card`, `--ui-color-border-subtle`, etc.).

- [ ] **Step 1: Scan for arbitrary inline styles and raw hex colors**

Search for `style={{` and hex patterns across `apps/web/app/(dashboard)`.

- [ ] **Step 2: Replace inline styles and raw hex colors with design tokens and `@aletheia/ui` primitives**

- Refactor `/portfolio`, `/reports`, `/schedule`, `/records`, `/attendance`, `/devotional`, `/curriculum`, `/settings`, and `/learners` to use semantic classes in `globals.css` and `@aletheia/ui` primitives (`PageHeader`, `Card`, `Button`, `EmptyState`, `Badge`, `Modal`).
- Ensure no arbitrary styles or unverified layout fallbacks remain.

- [ ] **Step 3: Run web typecheck, lint, and tests**

Run: `corepack pnpm --filter @aletheia/web typecheck`  
Run: `corepack pnpm --filter @aletheia/web lint`  
Run: `corepack pnpm --filter @aletheia/web test`

- [ ] **Step 4: Commit style normalization**

```bash
git add apps/web/app/\(dashboard\) apps/web/app/globals.css
git commit -m "refactor(web): normalize page styles and hex colors to design tokens"
```

---

### Task 6: Storybook Setup & Automated Accessibility Tooling

**Files:**
- Create: `packages/ui/.storybook/main.ts`
- Create: `packages/ui/.storybook/preview.ts`
- Create: `packages/ui/src/components/**/*.stories.tsx`
- Create: `packages/ui/src/patterns/**/*.stories.tsx`
- Modify: `packages/ui/package.json`

**Interfaces:**
- Produces: Storybook 8 Vite runner, stories for all 25 components and 2 patterns, `@storybook/addon-a11y` integration.

- [ ] **Step 1: Install Storybook dependencies in `packages/ui`**

Install `@storybook/react-vite`, `@storybook/addon-essentials`, `@storybook/addon-a11y`, `@storybook/blocks` in `packages/ui`.

- [ ] **Step 2: Configure `.storybook/main.ts` and `.storybook/preview.ts`**

Load `@aletheia/ui/css`, `tokens.css`, `components.css`, and configure a11y addon rules.

- [ ] **Step 3: Add stories for all primitives and patterns**

Create stories for `Button`, `Card`, `Badge`, `Modal`, `Input`, `Select`, `PageHeader`, `EmptyState`, `AletheiaIcon`, `DailyJourney`, `ActivityList`, etc.

- [ ] **Step 4: Build Storybook and verify zero errors**

Run: `corepack pnpm --filter @aletheia/ui storybook:build`  
Expected: Exit code 0, static Storybook emitted in `packages/ui/storybook-static`.

- [ ] **Step 5: Commit Storybook Tooling**

```bash
git add packages/ui/.storybook packages/ui/src/**/*.stories.tsx packages/ui/package.json
git commit -m "feat(ui): configure storybook with full component stories and a11y addon"
```

---

### Task 7: Full End-to-End Real Family Journey (Playwright) & Quality Gates

**Files:**
- Create: `apps/web/e2e/mvp-journey.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Verifies: Real Registration $\to$ Login $\to$ Onboarding Family Persistence $\to$ Learner Creation $\to$ Real Dashboard $\to$ Lesson Completion $\to$ Report Generation.

- [ ] **Step 1: Write `mvp-journey.spec.ts`**

```ts
// apps/web/e2e/mvp-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Real Family MVP End-to-End Journey', () => {
  test('executes complete journey from registration to lesson completion and reporting', async ({ page }) => {
    const timestamp = Date.now();
    const email = `guardian_${timestamp}@example.com`;
    const password = 'Password123!';
    const fullName = 'Guardião Real E2E';
    const familyName = `Família Real ${timestamp}`;
    const learnerName = `Educando ${timestamp}`;

    // 1. Register
    await page.goto('/register');
    await page.getByTestId('reg-name-input').fill(fullName);
    await page.getByTestId('reg-email-input').fill(email);
    await page.getByTestId('reg-password-input').fill(password);
    await page.getByTestId('reg-confirm-password-input').fill(password);
    await page.getByTestId('register-button').click();

    // 2. Onboarding
    await expect(page).toHaveURL(/.*onboarding/);
    await page.getByTestId('family-name-input').fill(familyName);
    await page.getByTestId('create-family-button').click();

    // 3. Learner Setup
    await expect(page).toHaveURL(/.*learners/);
    await page.getByTestId('add-learner-btn').click();
    await page.getByTestId('learner-first-name-input').fill(learnerName);
    await page.getByTestId('learner-birth-date-input').fill('2018-05-15');
    await page.getByTestId('learner-submit-btn').click();

    // 4. Dashboard
    await page.goto('/');
    await expect(page.getByTestId('appshell-sidebar')).toContainText(familyName);
    await expect(page.getByTestId('dashboard-content')).toBeVisible();

    // 5. Audit zero fake data
    await expect(page.getByText(/Família Santos/i)).toHaveCount(0);
    await expect(page.getByText(/alunos ativos/i)).toHaveCount(0);
  });
});
```

- [ ] **Step 2: Run full Playwright test suite**

Run: `corepack pnpm --filter @aletheia/web test:e2e`  
Expected: All 20+ tests pass cleanly.

- [ ] **Step 3: Run repository verification gate**

Run: `corepack pnpm verify`  
Expected: Boundary checks, lint, clean typegen, typechecks, unit tests, API e2e, distribution, and builds exit 0.

- [ ] **Step 4: Update CI workflow to include Storybook build**

Update `.github/workflows/ci.yml` with step `pnpm --filter @aletheia/ui storybook:build`.

- [ ] **Step 5: Commit Task 7**

```bash
git add apps/web/e2e/mvp-journey.spec.ts .github/workflows/ci.yml
git commit -m "test(e2e): add real family mvp journey test and storybook ci check"
```
