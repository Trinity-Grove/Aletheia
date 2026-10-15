# Activity safety policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend `ActivityDefinition.metadata` with the shared validated safety policy while preserving existing activity fields and behavior.

**Architecture:** Extract the policy schema already used by competency definitions into a shared contract export, then compose it into activity metadata. Prove persistence and validation through the existing admin create/list API.

**Spec:** `docs/superpowers/specs/2026-10-15-activity-safety-policy.md`

## Global constraints

- No migration or new table; the policy remains JSONB metadata.
- Preserve `riskLevel` and `supervisionRequired` exactly as existing fields.
- Keep the policy optional so current catalog rows and seeders remain valid.
- No learner-facing, planner, or AI behavior changes.
- Keep the schema strict and fail closed.

## Review focus

- There must be one shared policy schema, not separate competency/activity copies.
- Legacy activity payloads must still parse.
- Invalid combinations must be rejected before persistence.
- The exact policy object must survive the admin create/list round trip.

### Task 1: Shared contract extraction and activity composition

**Files:**
- Modify: `packages/contracts/src/curriculum-definitions.ts`
- Modify: `packages/contracts/src/activity-definition.ts`
- Modify: `packages/contracts/src/activity-definition.test.ts`
- Modify: `packages/contracts/src/curriculum-definitions.test.ts`

- [x] Write RED tests for valid activity policy, invalid combinations, unknown fields, and legacy fields.
- [x] Extract/export the shared policy schema without breaking the competency API.
- [x] Add optional `metadata.safetyPolicy` to activity metadata.
- [x] Run focused contracts tests and typecheck.
- [x] Commit `feat(contracts): share activity safety policies`.

### Task 2: Admin API round trip

**Files:**
- Create: `apps/api/test/activity-safety-policy.integration-spec.ts`

- [x] Add a real-Postgres admin create/list round-trip for an activity policy.
- [x] Add negative high-risk and adult-only requests asserting `400`.
- [x] Commit `test(curriculum): cover activity safety policy persistence`.

### Task 3: Verification and handoff

- [x] Run API/contracts typechecks, API unit tests, full contracts tests, lint, boundaries, no-sibling, i18n, and diff checks.
- Local integration was attempted and blocked by unavailable Postgres; CI is authoritative for the real-database round trip.
- [ ] Push, open the conventional PR, and merge only after all CI jobs are green.
