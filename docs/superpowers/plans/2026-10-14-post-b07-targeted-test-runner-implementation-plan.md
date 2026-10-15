# Post-B07 Targeted Workspace Test Runner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Add a safe root command for targeted workspace tests so verification commands do not forward unrelated filenames to every package.

**Architecture:** A small Node ESM dispatcher owns target-to-package resolution and child-process orchestration. The existing package test scripts remain the source of truth for how each package runs tests. The existing full-suite root scripts remain untouched.

**Tech Stack:** Node.js ESM, `node:test`, pnpm workspace filters, existing Vitest/Jest package runners.

**Spec:** `docs/superpowers/specs/2026-10-14-post-b07-targeted-test-runner-design.md`

## Global constraints

- Execute only after ALET-B07 is merged or in a dedicated follow-up branch based on the merged main.
- Do not touch B07 production files or another agent's worktree.
- Preserve `pnpm test` and `pnpm test:ci` as full-suite commands.
- Use argument arrays for child processes; never build an unescaped shell command from test targets.
- Keep routing deterministic and fail closed for unknown or ambiguous targets.
- Add tests before implementation for every behavior in the spec.

## Task 1: Specify and test pure target routing

**Files:**

- Create `scripts/run-targeted-tests.test.mjs`.
- Create the routing module chosen by the implementation, preferably `scripts/run-targeted-tests.mjs` with exported pure helpers.

**RED:**

- Add `node:test` cases for the B07 target set mapping to web, API, and contracts.
- Verify targets are grouped in deterministic package order.
- Verify package-local target order is preserved.
- Verify unknown targets fail clearly.
- Verify an ambiguous target fails clearly instead of guessing.

**GREEN:**

- Implement explicit package ownership rules and pure `resolveTargets`/`partitionTargets` helpers.
- Keep the resolver independent from process spawning so the tests remain fast and platform-neutral.

**Verify:**

```text
node --test scripts/run-targeted-tests.test.mjs
```

**Commit:** `test: define targeted workspace test routing`

## Task 2: Implement the dispatcher and root command

**Files:**

- Update `scripts/run-targeted-tests.mjs` with the child-process orchestration.
- Update the root `package.json` with `test:targeted`.

**RED:**

- Add process-level coverage for no arguments, invalid targets, child failure propagation, and stop-on-first-failure behavior. Use injectable spawn/executable resolution where possible so unit tests do not depend on a live package test suite.

**GREEN:**

- Invoke the existing package test command through pnpm workspace filters, passing only that package's resolved targets.
- Select `pnpm.cmd` on Windows and `pnpm` elsewhere.
- Preserve the first failing exit code and signal termination.
- Print the package and targets being executed so CI/local failures are diagnosable.
- Add the documented command as `pnpm test:targeted -- ...` without changing the existing `test` or `test:ci` script values.

**Verify:**

```text
pnpm test:targeted -- curriculum-explore.test.tsx curriculum.service.spec.ts curriculum.repository.spec.ts pedagogical-model-definition.test.ts
```

The command must not invoke `@aletheia/ui`.

**Commit:** `feat: add targeted workspace test runner`

## Task 3: Validate integration and document operating rules

**Files:**

- Update the spec if implementation details require clarification.
- Update the relevant contributor/verification documentation only if an existing location already documents root test commands.
- Do not add a second competing command description.

**Verify:**

```text
node --test scripts/run-targeted-tests.test.mjs
pnpm test:targeted -- curriculum-explore.test.tsx curriculum.service.spec.ts curriculum.repository.spec.ts pedagogical-model-definition.test.ts
pnpm lint
pnpm typecheck
pnpm test
```

If the full suite is too costly for the local environment, report it as an explicit verification limitation; do not replace it with `--passWithNoTests`.

**Commit:** `docs: document targeted test verification`

## Handoff checklist

- [ ] ALET-B07 is already merged into the base branch.
- [ ] The targeted command passes for the original B07 verification set.
- [ ] The full suite still runs all workspaces.
- [ ] Invalid and ambiguous targets fail before spawning tests.
- [ ] Windows and POSIX invocation paths are covered or manually verified.
- [ ] No B07 behavior or unrelated worktree was changed.
