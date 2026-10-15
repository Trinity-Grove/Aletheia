# Post-B07 Targeted Workspace Test Runner Design

**Status:** Implemented on `chore/targeted-test-runner`

**Related issue:** B07 verification caveat

## Problem

The B07 package-scoped tests all pass, but the root command used in the implementation plan was not a valid workspace-level targeted-test invocation:

```text
pnpm --workspace-concurrency=1 test -- curriculum-explore.test.tsx curriculum.service.spec.ts curriculum.repository.spec.ts pedagogical-model-definition.test.ts
```

Because the root `test` script recursively invokes every workspace, pnpm forwards every filename to packages that do not own it. `@aletheia/ui` then exits with `No test files found`, even though the relevant API, web, and contracts tests pass.

This is a tooling/verification problem, not a B07 product defect.

## Goal

Provide one explicit root command for targeted tests that routes each target only to the workspace that owns it, while preserving the existing full-suite behavior of `pnpm test` and `pnpm test:ci`.

The intended command is:

```text
pnpm test:targeted -- <test-file-or-pattern> [...more-targets]
```

For the B07 verification set, this command must finish successfully without invoking unrelated workspaces:

```text
pnpm test:targeted -- curriculum-explore.test.tsx curriculum.service.spec.ts curriculum.repository.spec.ts pedagogical-model-definition.test.ts
```

## Functional requirements

1. Accept one or more test filenames or supported Vitest/Jest patterns after `--`.
2. Partition targets by package before spawning test commands.
3. Route targets to the current package test runners without duplicating test-runner logic:
   - `@aletheia/web` for web `.test.tsx`/`.test.ts` targets.
   - `@aletheia/api` for API `.spec.ts` targets.
   - `@aletheia/contracts` for contracts `.test.ts` targets.
   - Other workspaces must not receive a target they do not own.
4. Preserve target order within each package and run packages deterministically.
5. Return the first non-zero child exit code and stop subsequent package runs.
6. Reject an unknown or ambiguous target with a short actionable error that names the accepted locations or asks for an explicit package-qualified target.
7. Work on Windows and POSIX environments by invoking the platform-appropriate pnpm executable.
8. Keep `pnpm test` and `pnpm test:ci` as full workspace-suite commands; this change must not silently narrow CI coverage.

## Non-goals

- No changes to B07 API, contracts, database migration, or UI behavior.
- No changes to package-level `test` scripts unless the dispatcher proves they are required.
- No renaming or moving existing tests.
- No blanket `--passWithNoTests` workaround for unrelated packages.
- No automatic modification of CI workflows in this follow-up unless a separate requirement is approved.

## Routing model

Prefer an explicit, testable resolver over shell globbing or assumptions based only on filename suffixes. The implementation should expose pure routing logic so it can be tested without spawning processes. If a filename can belong to more than one package, fail with an ambiguity message instead of guessing.

The dispatcher should pass the resolved targets to the package command using the package's existing runner. It must not concatenate user input into a shell command; use argument arrays and child-process APIs.

## Platform invocation notes

On POSIX systems the dispatcher invokes `pnpm --filter <package> test -- <targets...>`. On Windows, `.cmd` shims cannot be spawned directly with Node's shell-disabled process API in this environment, so the dispatcher invokes `ComSpec /d /s /c pnpm.cmd --filter <package> test <targets...>` using an argument array. The Windows form intentionally omits pnpm's script separator: passing it through `ComSpec` makes Vitest receive a literal `--` and run the full suite instead of the requested target.

The root `test` and `test:ci` scripts remain recursive full-suite commands. The new `test:targeted` command is the explicit opt-in path for focused verification.

## Acceptance criteria

- The B07 targeted command above exits `0`.
- The command does not emit `@aletheia/ui`'s `No test files found` failure.
- A target belonging to one package is not forwarded to another package.
- Unknown and ambiguous targets fail before any test process starts.
- Existing full-suite commands remain unchanged and documented as the authoritative CI path.
- Dispatcher unit tests cover routing, deterministic ordering, failure propagation, and invalid input.
- Lint, typecheck, and the relevant package test suites pass.

