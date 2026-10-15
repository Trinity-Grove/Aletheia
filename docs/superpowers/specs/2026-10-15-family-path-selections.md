# Family learning-path selections

## Context

Issue #96 requires a family to enable or disable learning paths without changing the platform catalog. The current catalog has published `LearningPath` definitions but no family-scoped selection state.

## Scope

- Add a normalized `FamilyLearningPathSelection` record keyed by `(familyId, pathId)` with an `enabled` flag and timestamps.
- Add a family-protected `PUT` endpoint to enable/disable a published learning path.
- Add a family-protected `GET` endpoint that returns the family's selections with display data for each path.
- Enforce tenant isolation through the existing `JwtAuthGuard` + `FamilyTenantGuard`.
- Preserve platform definitions and learner historical records; disabling a path must not delete or retire existing learner tracking rows.

## Acceptance criteria

1. A family member can enable a published path and receives an enabled selection.
2. The same endpoint is idempotent and can disable the selection without deleting it.
3. A family can list only its own path selections, including path code/name/version/status.
4. Missing or non-published paths cannot be enabled/disabled through this API.
5. A user from another family cannot read or mutate the selection because of the existing tenant guard.
6. The migration is additive and existing catalog/learner flows remain unchanged.

## Non-goals

- Removing competencies already activated for a learner.
- Changing the shared published catalog.
- Automatically filtering existing curriculum-definition or planner responses; a later UI/read-path task can consume this explicit selection API.
