# Automatic Competency Achievements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Record an immutable, idempotent achievement when validated evidence satisfies the fixed EVIDENCE_COUNT policy of a learner tracking, and append a review event when later rejection affects that achievement.

**Architecture:** Activation pins `progressionPolicyId` and its exact `policyVersion` on each tracking row. Evidence validation and achievement reconciliation run inside one repeatable-read transaction locked per learner. `LearnerCompetencyAchievement` stores exact learner/tracking/competency/curriculum/policy snapshots and a unique tracking key; `LearnerCompetencyAchievementReview` records later review-needed events without deleting the original award.

**Tech Stack:** Prisma/PostgreSQL, NestJS services/repositories, shared Zod contracts, Jest integration tests.

**Spec:** `docs/superpowers/specs/2026-09-12-profile-progression-design.md` and the approved automatic-achievement decision in the session.

## Global Constraints

- Only `EVIDENCE_COUNT` policy rules are automated in this slice.
- A policy is fixed at activation; evaluations use the pinned id/version and accept published, deprecated, or archived snapshots.
- Evidence must be human validated before it contributes; rejection never deletes an original achievement.
- `MASTERED` requires the pinned policy threshold and every direct prerequisite to be `MASTERED`; otherwise the evaluator's existing `NOT_STARTED`, `IN_PROGRESS`, and `BLOCKED` states remain authoritative.
- Award creation is idempotent under retries and concurrent validation requests.
- All reads and writes are family/learner tenant scoped; no client-supplied actor or policy can override snapshots.
- Existing activation/evaluation clients remain compatible by allowing no policy only for legacy tracking; automatic awards require a pinned policy.

---

### Task 1: Persist policy bindings and immutable achievement history

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260913210000_automatic_competency_achievements/migration.sql`
- Modify: `packages/contracts/src/learner-competency-tracking.ts`
- Create: `packages/contracts/src/learner-competency-achievement.ts`
- Modify: `packages/contracts/src/index.ts`

- [ ] Add nullable tracking policy id/version fields and achievement plus review models with unique tracking award key and evidence snapshot fields.
- [ ] Add activation input `progressionPolicyId` optional and response fields; add achievement/review response schemas.
- [ ] Generate Prisma and run contracts tests.

### Task 2: Pin policy during activation

**Files:**
- Modify: `apps/api/src/modules/curriculum/infrastructure/learner-competency-tracking.repository.ts`
- Modify: `apps/api/src/modules/curriculum/application/learner-competency-tracking.service.ts`
- Modify: `apps/api/src/modules/curriculum/presentation/learner-competency-tracking.controller.ts`
- Test: `apps/api/test/learner-competency-tracking.integration-spec.ts`

- [ ] Validate supplied policy is published, supported EVIDENCE_COUNT, and scoped to the curriculum/competency before activation.
- [ ] Persist the policy id and exact version only when creating rows; reject conflicting policy on an existing tracking.
- [ ] Return the binding and cover tenant, scope, idempotency, and deprecated-policy history cases.

### Task 3: Reconcile awards in evidence validation

**Files:**
- Create: `apps/api/src/modules/curriculum/infrastructure/achievement.repository.ts`
- Create: `apps/api/src/modules/curriculum/application/achievement.service.ts`
- Modify: `apps/api/src/modules/curriculum/application/evidence-submission.service.ts`
- Modify: `apps/api/src/modules/curriculum/infrastructure/evidence-submission.repository.ts`
- Modify: `apps/api/src/modules/curriculum/curriculum.module.ts`
- Test: `apps/api/test/automatic-achievement.integration-spec.ts`

- [ ] Update validation and reconcile affected active/retired trackings in one transaction locked by learner.
- [ ] Evaluate pinned policy prerequisites and exact evidence versions; create one immutable award with validated evidence/actor/time snapshot when MASTERED.
- [ ] On later rejection append one review event per affected award, preserving award history; repeated validation is idempotent.
- [ ] Cover concurrent retries, prerequisites, exact version changes, rejection, and family isolation.

### Task 4: Verification and review

- [ ] Run contracts, API unit/integration, typecheck, lint, boundaries, and diff checks.
- [ ] Obtain task and whole-branch code review; fix all important findings.
- [ ] Commit, push branch, and open a PR after verification.
