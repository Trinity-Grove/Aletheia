# Spec: typed activity materials

## Problem

`ActivityDefinition` already stores `metadata.materials`, but the response contract exposes only an opaque JSON object. Catalog consumers must know an internal JSON shape to show the materials required by an activity.

## Decision

Expose `materials: string[]` as a stable, top-level response field. The application maps only a valid string array from `metadata.materials`; missing, malformed, or legacy metadata becomes `[]`. The existing `metadata` field remains unchanged for backward compatibility.

## Scope

- Update the response contract and its tests.
- Map the field in the definitions application service for create/list/detail responses.
- Add service tests for populated and legacy metadata.
- Keep storage in the existing JSONB column; no migration.
- Keep materials informational: they do not override age, risk, supervision, or evidence policies.

## Non-goals

- Family/community authoring of catalog activities.
- A new material table, inventory, shopping list, or safety engine.
- Changing activity versioning, status transitions, or authorization.

## Compatibility

Old rows and clients remain valid. The new response field is always present and defaults to an empty list. `metadata` is still returned exactly as before.
