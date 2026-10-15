# Competency safety policy metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a validated, versioned safety-policy object to competency metadata without changing persistence or learner-facing behavior.

**Architecture:** Reuse `CompetencyDefinition.metadata` JSONB and the existing admin create/list API. Add a strict Zod object with cross-field safety invariants, export its type through contracts, and prove persistence through the existing admin endpoint with a real-Postgres integration test.

**Tech Stack:** TypeScript, Zod, NestJS, Prisma/PostgreSQL JSONB, Jest, Vitest, Supertest.

**Spec:** `docs/superpowers/specs/2026-10-15-competency-safety-policy.md`

## Global Constraints

- Do not add a migration or new table; safety policy is versioned with `CompetencyDefinition.metadata`.
- Keep the policy optional so all existing catalog rows and seeders remain valid.
- Reject `HIGH`/`CRITICAL` risk without `REQUIRED`/`ADULT_ONLY` supervision.
- Reject `ADULT_ONLY` supervision without `requiresAdultConsent: true`.
- Do not add learner-facing enforcement, planner logic, or AI behavior in this slice.
- Keep all user-facing/API contract additions covered by the existing contracts and integration test conventions.

## Review Focus

- A high-risk competency must fail closed when supervision is omitted or `NONE`.
- Adult-only supervision must not be representable without explicit adult consent.
- Existing competency payloads without a policy must still parse with the current defaults.
- Arbitrary keys or malformed training codes must not silently become a safety policy.
- The exact JSONB metadata must survive the admin create/list round trip.

---

### Task 1: Contract schema and red/green coverage

**Files:**
- Modify: `packages/contracts/src/curriculum-definitions.ts`
- Modify: `packages/contracts/src/curriculum-definitions.test.ts`

**Interfaces:**
- Produce `competencySafetyPolicySchema` and `CompetencySafetyPolicy` from `@aletheia/contracts`.
- Extend `competencyMetadataSchema` with optional `safetyPolicy`.

- [x] **Step 1: Write failing contract tests** for a valid policy, high-risk missing supervision, adult-only without consent, malformed training code, and an existing competency without policy.
- [x] **Step 2: Run the focused contract test and verify it fails** because `safetyPolicy` is not recognized/validated.
- [x] **Step 3: Implement the minimal strict schema** and cross-field `superRefine` rules in `curriculum-definitions.ts`.
- [x] **Step 4: Run `pnpm --filter @aletheia/contracts test -- curriculum-definitions.test.ts` and verify all focused tests pass.**
- [x] **Step 5: Run `pnpm --filter @aletheia/contracts typecheck`.**
- [x] **Step 6: Commit** with `feat(contracts): validate competency safety policies`.

### Task 2: Real admin API round-trip

**Files:**
- Create: `apps/api/test/competency-safety-policy.integration-spec.ts`

**Interfaces:**
- Consumes the existing `POST/GET /api/v1/admin/curriculum-definitions/competency-definitions` endpoints.
- Produces integration proof that JSONB metadata persists unchanged and invalid safety policies are rejected before persistence.

- [x] **Step 1: Write the integration test** with a platform-admin session, a prerequisite learning domain, and a competency containing a valid high-risk policy; assert the create response and subsequent list response preserve every policy field.
- [x] **Step 2: Add negative requests** for high risk with no supervision and adult-only without consent; assert `400`.
- [x] **Step 3: Run the focused integration test against real Postgres.** Expected: pass in the CI Postgres job; local environments without Postgres should report only the environmental connection failure.
- [x] **Step 4: Commit** with `test(curriculum): cover competency safety policy persistence`.

### Task 3: Repository-wide verification and handoff

**Files:**
- No additional production files expected.

- [x] **Step 1: Run `pnpm --filter @aletheia/api typecheck` and `pnpm --filter @aletheia/api lint`.**
- [x] **Step 2: Run `pnpm --filter @aletheia/api test` and `pnpm --filter @aletheia/contracts test`.**
- [x] **Step 3: Run `pnpm check:boundaries`, `pnpm check:no-sibling-comparison`, `pnpm audit:i18n`, and `git diff --check`.**
- [ ] **Step 4: Run the CI-equivalent integration suite when Postgres is available.** Local execution was attempted and blocked by the unavailable local Postgres; CI remains authoritative for this real-database check.
- [ ] **Step 5: Commit any verification-only correction, push, open the PR using the repository's conventional title/body style, and merge only after all four CI jobs are green.**
