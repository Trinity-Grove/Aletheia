# Curriculum draft editing

## Context

Issue #96 requires Definition/Version records to support a draft lifecycle. The current admin API can create and transition a `CurriculumDefinition`, but it cannot correct the draft's editable content before publication. Published, deprecated, and archived versions must remain immutable in this slice.

## Scope

- Add a partial update contract for the editable fields of `CurriculumDefinition`: `name`, `description`, `pedagogicalModelDefinitionId`, and `metadata`.
- Add `PATCH /api/v1/admin/curriculum-definitions/curriculum-definitions/:id` behind the existing JWT + platform-admin guards.
- Accept updates only while the exact row is `DRAFT`.
- Keep `code`, `version`, `schemaVersion`, `status`, timestamps, and relationships immutable through this endpoint.
- Record an `UPDATE` operation log with the changed field names and actor.
- Keep the implementation additive; no learner-facing read path changes.

## Acceptance criteria

1. A platform admin can update one or more editable fields on a draft curriculum definition and receives the updated DTO.
2. An empty payload and attempts to send immutable fields are rejected by the contract.
3. A missing definition returns 404.
4. A published, deprecated, or archived definition returns 400 and remains unchanged.
5. Every successful update creates one audit log with operation type `UPDATE`, actor, definition code/version, and changed field names.
6. Existing create, status transition, pack portability, and version-history behavior remains unchanged.

## Explicit non-goals

- Editing published content in place.
- Creating a new version automatically; that is a separate version-authoring workflow.
- Updating join rows through this endpoint; those continue using their dedicated endpoints.
- Editing the other Definition/Version tables in this PR; this is the first vertical slice and establishes the guarded pattern for later types.
