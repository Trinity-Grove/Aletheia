# Profile Integrity and Progression Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or executing-plans. Follow test-first cycles.

**Goal:** Validate family profiles, preserve attributable concurrent history, and compute evidence-based progression.
**Architecture:** Existing NestJS curriculum module, shared Zod contracts and Prisma/PostgreSQL repositories. New read-only progression service uses existing versioned definitions and evidence.
**Tech Stack:** TypeScript, NestJS, Zod, Prisma, Jest, PostgreSQL.
**Spec:** ../specs/2026-09-12-profile-progression-design.md

## Global constraints
Work only in this worktree. Reuse family guards and authenticated actor. Keep historical rows readable. No domain-specific engine branches, deployment, or merge.

## Task 1: Profile reference integrity
Files: curriculum profiles.service.ts, profiles.repository.ts, profile contracts, test/profiles.integration-spec.ts.
- [ ] Establish baseline and seed published definitions in profile integration fixtures.
- [ ] Add failing API tests: unknown/draft models, unknown traditions, mismatched position topics, duplicate secondary models; history is unchanged after rejection.
- [ ] Query published definitions by code, validate all references before create, preserve cross-tradition overrides.
- [ ] Run profile integration and contract suites.

## Task 2: Attributable concurrent profile history
Files: schema.prisma, new additive SQL migration, profiles controller/service/repository/contracts, profile integration tests.
- [ ] Add failing tests asserting session actor, spoof prevention, and parallel successful writes with distinct consecutive versions.
- [ ] Add nullable createdByUserId relation for historical rows; pass CurrentUser to writes and serialize in responses.
- [ ] Lock family row within transaction before allocating/inserting version; validate references in the transaction.
- [ ] Apply migration to isolated test database; run profile tests and typecheck.

## Task 3: Executable progression
Files: new progression evaluation contract, service/repository/controller and tests, curriculum.module.ts, contracts/index.ts.
- [ ] Define strict EVIDENCE_COUNT rule and evaluation request/response; write failing tests for actual counts and prerequisite decisions.
- [ ] Implement snapshot-consistent family-scoped evaluation over validated evidence and exact definition versions.
- [ ] Validate scopes, publication, unsupported schemas/types, missing/cyclic prerequisites and bounded traversal.
- [ ] Wire endpoint with existing family guards; run unit/integration tests and typecheck.

## Completion
- [ ] Review entire diff for spec coverage and regressions.
- [ ] Run relevant contracts, curriculum integration, API typecheck/lint and boundaries.
- [ ] Commit scoped changes and report evidence and remaining limitations.
