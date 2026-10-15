# Spec: Learning domain activation

## Goal

Complete the next unchecked data-driven architecture capability in issue #96: a platform administrator can activate or deactivate a learning domain without changing its editorial lifecycle status.

## Behavior

- Every `LearningDomain` has an explicit `isActive` flag, defaulting to `true` for existing and newly created rows.
- The admin API exposes `PATCH /api/v1/admin/curriculum-definitions/learning-domains/:id/activation` with `{ "isActive": boolean }`.
- The existing JWT + platform-admin guard protects the endpoint.
- The response and domain catalog include `isActive`.
- The operation is auditable through the existing definition operation log as an `UPDATE` with `changedFields: ["isActive"]`.
- Deactivation does not delete the domain, its paths, competencies, curriculum links, or historical records.

## Invariants

- `DRAFT/PUBLISHED/DEPRECATED/ARCHIVED` remains the editorial lifecycle; activation is orthogonal.
- Existing rows remain active after migration.
- A missing domain returns `404`.
- The endpoint is idempotent: setting the current value again succeeds without creating duplicate data.
- No learner-facing filtering is introduced in this slice; consumers can adopt the active flag explicitly.

## Non-goals

- No family-level domain preferences.
- No automatic cascade to learning paths or competencies.
- No deletion or new status enum.
