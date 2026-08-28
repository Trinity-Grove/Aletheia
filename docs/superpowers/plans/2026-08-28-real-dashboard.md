# Real Family Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace production dashboard mocks with a validated, authenticated, family-scoped dashboard projection calculated by the backend.

**Architecture:** A new NestJS dashboard module composes the existing family, learner, and schedule public APIs and returns a shared Zod DTO. The web page uses a focused controller hook to resolve family context, fetch/refetch the projection, complete lesson activities through the existing endpoint, and render shared UI patterns for all states.

**Tech Stack:** NestJS 11, Zod 4, TypeScript 5.9, React 19, Next.js 16.3.2, Jest/Supertest, Vitest/Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-28-design-as-code-stabilization-dashboard-design.md`

## Global Constraints

- Execute only after `2026-08-28-design-system-stabilization.md` is complete and green.
- The API enforces authentication and family tenancy.
- Every cross-module dashboard dependency uses an exported public API token.
- Dates use `YYYY-MM-DD`; the browser derives the user's local calendar date.
- No production fallback contains invented learners, activities, progress, or scripture.
- Activity progress changes only after the mutation succeeds and the dashboard refetch completes.

---

### Task 1: Define the shared dashboard transport contract

**Files:**
- Create: `packages/contracts/src/dashboard.ts`
- Create: `packages/contracts/src/dashboard.test.ts`
- Modify: `packages/contracts/src/index.ts`

**Interfaces:**
- Produces: `dashboardQuerySchema`, `DashboardQueryDto`, `dashboardResponseSchema`, `DashboardResponseDto`, `dashboardActivitySchema`, and `DashboardActivityDto`.
- Query: `{ date: YYYY-MM-DD; learnerId?: UUID }`.
- Activity types: `'devotional' | 'lesson' | 'routine'`.

- [ ] **Step 1: Write populated, empty, and invalid contract tests**

Use fixed UUIDs and assert:

```ts
expect(dashboardQuerySchema.parse({ date: '2026-08-28' })).toEqual({
  date: '2026-08-28',
});
expect(dashboardResponseSchema.parse(emptyDashboard).activities).toEqual([]);
expect(dashboardQuerySchema.safeParse({ date: '28/08/2026' }).success).toBe(false);
expect(dashboardQuerySchema.safeParse({ date: '2026-08-28', learnerId: 'foreign' }).success).toBe(false);
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run: `pnpm --filter @aletheia/contracts test -- dashboard.test.ts`

Expected: FAIL because `dashboard.ts` and its exports do not exist.

- [ ] **Step 3: Implement the schemas and inferred types**

Define `displayName`, non-negative integer journey values, nullable `activeLearnerId`, optional `subjectName`/`scheduledTime`/`durationMinutes`, and strict date regex. Use `.uuid()` for all ids.

- [ ] **Step 4: Run contracts checks**

Run: `pnpm --filter @aletheia/contracts test -- dashboard.test.ts`

Run: `pnpm --filter @aletheia/contracts typecheck`

Run: `pnpm --filter @aletheia/contracts lint`

Run: `pnpm --filter @aletheia/contracts build`

- [ ] **Step 5: Commit the dashboard contract**

```bash
git add packages/contracts/src/dashboard.ts packages/contracts/src/dashboard.test.ts packages/contracts/src/index.ts
git commit -m "feat(contracts): define family dashboard projection"
```

---

### Task 2: Expose family-scoped schedule aggregation through a public API

**Files:**
- Modify: `apps/api/src/modules/lessons/application/public-api.ts`
- Modify: `apps/api/src/modules/lessons/lessons.module.ts`
- Test: `apps/api/src/modules/lessons/application/schedule.service.spec.ts`

**Interfaces:**
- Produces:

```ts
export const SCHEDULE_PUBLIC_API = Symbol('SCHEDULE_PUBLIC_API');
export interface SchedulePublicApi {
  getDailyAgenda(familyId: string, date: string, learnerId?: string): Promise<DailyAgendaDto>;
}
```

- [ ] **Step 1: Add a provider/export test through Nest TestingModule**

Assert `SCHEDULE_PUBLIC_API` resolves to `ScheduleService` and that the call forwards an explicit family id, date, and learner id.

- [ ] **Step 2: Run the lesson test and verify the missing token fails**

Run: `pnpm --filter @aletheia/api test -- schedule.service.spec.ts`

- [ ] **Step 3: Add the schedule public token and module provider**

```ts
{
  provide: SCHEDULE_PUBLIC_API,
  useExisting: ScheduleService,
}
```

Export `SCHEDULE_PUBLIC_API`; do not export repositories to the dashboard module.

- [ ] **Step 4: Run lesson tests and boundary checks**

Run: `pnpm --filter @aletheia/api test -- schedule.service.spec.ts`

Run: `pnpm check:boundaries`

- [ ] **Step 5: Commit the public schedule API**

```bash
git add apps/api/src/modules/lessons/application/public-api.ts apps/api/src/modules/lessons/lessons.module.ts apps/api/src/modules/lessons/application/schedule.service.spec.ts
git commit -m "refactor(api): expose daily agenda public api"
```

---

### Task 3: Implement the dashboard aggregation service

**Files:**
- Create: `apps/api/src/modules/dashboard/application/dashboard.service.ts`
- Create: `apps/api/src/modules/dashboard/application/dashboard.service.spec.ts`

**Interfaces:**
- Consumes: `FAMILY_PUBLIC_API`, `LEARNERS_PUBLIC_API`, and `SCHEDULE_PUBLIC_API`.
- Produces:

```ts
getDashboard(
  userId: string,
  familyId: string,
  query: DashboardQueryDto,
): Promise<DashboardResponseDto>
```

- [ ] **Step 1: Write service tests for real aggregation rules**

Cover:

- display name precedence: preferred name, then first name plus last name;
- no learner filter and a valid learner filter;
- external/missing learner throws `NotFoundException` before agenda lookup;
- lesson/routine mapping from `DailyAgendaDto`;
- completed minutes derived only from completed items with valid start/end duration;
- completed/total lesson counts ignore routine items;
- missing truthful target/day-sequence data returns zero;
- empty learners and empty agenda return valid empty arrays and zero journey values.

- [ ] **Step 2: Run the service test and verify it fails**

Run: `pnpm --filter @aletheia/api test -- dashboard.service.spec.ts`

Expected: FAIL because `DashboardService` does not exist.

- [ ] **Step 3: Implement deterministic mapping helpers**

Use focused private or module-local functions:

```ts
function minutesBetween(start?: string | null, end?: string | null): number {
  if (!start || !end) return 0;
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  return Math.max(0, endHour * 60 + endMinute - startHour * 60 - startMinute);
}
```

Map `LESSON` to `lesson`, `ROUTINE_SLOT` to `routine`, and include no devotional activity until an existing family/date-scoped devotional public API supplies it. Neutral values are preferable to fabricated data.

- [ ] **Step 4: Implement family and learner authorization behavior**

Resolve the family with `getFamilyForUser(userId, familyId)`; preserve `403` responsibility in `FamilyTenantGuard`, and fail closed if the family projection is absent. Resolve an optional learner only through `findLearnerById(familyId, learnerId)` and throw `NotFoundException('Learner not found')` when absent.

- [ ] **Step 5: Run service, type, and lint checks**

Run: `pnpm --filter @aletheia/api test -- dashboard.service.spec.ts`

Run: `pnpm --filter @aletheia/api typecheck`

Run: `pnpm --filter @aletheia/api lint`

- [ ] **Step 6: Commit the aggregation service**

```bash
git add apps/api/src/modules/dashboard/application
git commit -m "feat(api): aggregate family dashboard data"
```

---

### Task 4: Publish the guarded dashboard endpoint

**Files:**
- Create: `apps/api/src/modules/dashboard/presentation/dashboard.controller.ts`
- Create: `apps/api/src/modules/dashboard/dashboard.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/test/dashboard.e2e-spec.ts`

**Interfaces:**
- Produces: `GET /api/v1/families/:familyId/dashboard?date=YYYY-MM-DD&learnerId=<UUID>`.
- Controller consumes authenticated request user id using the repository's existing request-user pattern.

- [ ] **Step 1: Write endpoint e2e tests**

Cover authenticated `200`, valid empty `200`, missing token `401`, another family's id `403`, external learner id `404`, malformed date `400`, and malformed learner UUID `400`. Assert responses satisfy `dashboardResponseSchema`.

- [ ] **Step 2: Run the e2e test and verify route failure**

Run: `pnpm --filter @aletheia/api test:e2e -- dashboard.e2e-spec.ts`

Expected: FAIL with `404` because the route is not registered.

- [ ] **Step 3: Implement controller validation and guards**

Use `@UseGuards(JwtAuthGuard, FamilyTenantGuard)`. Parse `{ date, learnerId }` with `dashboardQuerySchema.safeParse`; throw `BadRequestException` with a stable public message on failure. Pass the authenticated `userId`, route `familyId`, and parsed query to `DashboardService`.

- [ ] **Step 4: Register DashboardModule with public module dependencies**

`DashboardModule` imports `FamiliesModule`, `LearnersModule`, and `LessonsModule`, provides `DashboardService`, and registers `DashboardController`. Add it to `AppModule`.

- [ ] **Step 5: Run endpoint and API gates**

Run: `pnpm --filter @aletheia/api test:e2e -- dashboard.e2e-spec.ts`

Run: `pnpm --filter @aletheia/api test`

Run: `pnpm --filter @aletheia/api typecheck`

Run: `pnpm --filter @aletheia/api lint`

Run: `pnpm --filter @aletheia/api build`

Run: `pnpm check:boundaries`

- [ ] **Step 6: Commit the endpoint**

```bash
git add apps/api/src/modules/dashboard apps/api/src/app.module.ts apps/api/test/dashboard.e2e-spec.ts
git commit -m "feat(api): expose authenticated family dashboard"
```

---

### Task 5: Create the web dashboard controller hook

**Files:**
- Create: `apps/web/src/components/dashboard/use-dashboard.ts`
- Create: `apps/web/tests/use-dashboard.test.tsx`

**Interfaces:**
- Consumes: auth token storage convention, active family id, optional learner id, local date, dashboard endpoint, and lesson completion endpoint.
- Produces:

```ts
interface DashboardController {
  data: DashboardResponseDto | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage: string | null;
  activeLearnerId: string | null;
  setActiveLearnerId(id: string | null): void;
  retry(): void;
  completeActivity(activity: DashboardActivityDto): Promise<void>;
}
```

- [ ] **Step 1: Write hook tests with mocked fetch**

Test no-family idle behavior, local-date URL generation, authenticated loading/success, response validation, HTTP failure, invalid response failure, retry, learner filter refetch, successful lesson completion/refetch, and failed completion without local progress mutation.

- [ ] **Step 2: Run the hook tests and verify the missing hook fails**

Run: `pnpm --filter @aletheia/web test -- use-dashboard.test.tsx`

- [ ] **Step 3: Implement a local calendar-date helper**

```ts
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

- [ ] **Step 4: Implement request, validation, retry, and mutation flow**

Validate successful JSON with `dashboardResponseSchema.parse`. Use an abort controller per dashboard request. Only `lesson` activities invoke `POST /lessons/:id/complete`; other types expose no completion action until their domain supports one. After successful mutation, fetch a fresh projection.

- [ ] **Step 5: Run hook tests, typecheck, and lint**

Run: `pnpm --filter @aletheia/web test -- use-dashboard.test.tsx`

Run: `pnpm --filter @aletheia/web typecheck`

Run: `pnpm --filter @aletheia/web lint`

- [ ] **Step 6: Commit the dashboard controller**

```bash
git add apps/web/src/components/dashboard/use-dashboard.ts apps/web/tests/use-dashboard.test.tsx
git commit -m "feat(web): add real dashboard data controller"
```

---

### Task 6: Replace production mocks with explicit dashboard states

**Files:**
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/src/components/dashboard/learner-focus-header.tsx`
- Modify: `apps/web/tests/dashboard.test.tsx`

**Interfaces:**
- Consumes: `useDashboard`, `DashboardResponseDto`, shared `DailyJourney`, shared `ActivityList`, and existing `ProductShell`.
- Produces: loading, no-family, no-learners, no-activities, error/retry, and real-content states.

- [ ] **Step 1: Replace fixture-oriented page tests with state tests**

Mock the controller boundary and assert Portuguese UI for:

- loading with `aria-busy="true"`;
- no active family with onboarding link;
- no learners with learner-setup link;
- request failure with “Tentar novamente”;
- empty activities without fake cards;
- real learner and journey rendering;
- learner selection callback;
- failed completion leaves rendered progress unchanged.

- [ ] **Step 2: Run dashboard tests and verify old page behavior fails**

Run: `pnpm --filter @aletheia/web test -- dashboard.test.tsx`

Expected: FAIL while `MOCK_LEARNERS` and `INITIAL_ACTIVITIES` still drive the page.

- [ ] **Step 3: Recompose the page from real controller states**

Remove both mock constants and all local progress calculations. Map transport activities to the shared pattern explicitly when naming differs:

```ts
const activities = data.activities.map((activity) => ({
  ...activity,
  time: activity.scheduledTime,
}));
```

Only pass completion callbacks for supported lesson activities.

- [ ] **Step 4: Move every home-page inline style into stable classes**

Create `dashboard-page-*` classes backed by semantic/component tokens for container, actions, scripture spacing, primary grid, module grid, module links, icon, title, and description. Verify:

Run: `rg -n "style=\\{\\{" apps/web/app/page.tsx`

Expected: no matches.

- [ ] **Step 5: Run focused web checks**

Run: `pnpm --filter @aletheia/web test -- dashboard.test.tsx use-dashboard.test.tsx`

Run: `pnpm --filter @aletheia/web typecheck`

Run: `pnpm --filter @aletheia/web lint`

Run: `pnpm --filter @aletheia/web build`

- [ ] **Step 6: Commit the production dashboard**

```bash
git add apps/web/app/page.tsx apps/web/app/globals.css apps/web/src/components/dashboard apps/web/tests
git commit -m "feat(web): render authenticated family dashboard"
```

---

### Task 7: Run the complete two-increment quality gate

**Files:**
- Modify only when a failing check exposes a defect in files already within the two approved increments.

**Interfaces:**
- Consumes: all prior task outputs.
- Produces: a warning-free, buildable repository state ready for Storybook design work.

- [ ] **Step 1: Prove production mocks are absent**

Run: `rg -n "MOCK_LEARNERS|INITIAL_ACTIVITIES|Ana Clara|Mateus" apps/web/app apps/web/src`

Expected: no production matches. Test fixtures may retain neutral names outside those paths.

- [ ] **Step 2: Prove native options contain no configured icons**

Run: `rg -n -U '<option[^>]*>\s*\{[^}]*\.icon\}' apps packages`

Expected: no matches.

- [ ] **Step 3: Run repository verification**

Run: `pnpm verify`

Expected: boundary checks, lint, clean type generation, typecheck, unit tests, API e2e, distribution checks, and builds all exit 0.

- [ ] **Step 4: Run web browser tests**

Run: `pnpm --filter @aletheia/web test:e2e`

Expected: all Playwright tests pass.

- [ ] **Step 5: Inspect repository state and diff quality**

Run: `git diff --check`

Run: `git status --short`

Confirm no generated output, unrelated file, or unreviewed inherited change remains unstaged.

- [ ] **Step 6: Commit verification-only fixes if required**

Stage only the corrected files shown by `git status --short`, using their explicit paths, then run:

```bash
git commit -m "fix: close dashboard verification gaps"
```

Skip this commit when Step 3 and Step 4 pass without source changes.
