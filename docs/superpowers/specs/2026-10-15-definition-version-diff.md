# Definition version diff — ALET-96 first lifecycle slice

## Problem

Definition/Version rows are immutable after publication and already support
rollback and controlled migration, but administrators cannot see what changed
between two versions before deciding which version to publish or roll back.

## Scope

Add a read-only, platform-admin endpoint that compares two versions of any
allowlisted Definition/Version entity by `code`.

The response reports only changed content fields. Generated identity and audit
timestamps (`id`, `createdAt`, `updatedAt`, `publishedAt`, `deprecatedAt`) are
excluded because they change for every version and do not explain the content
difference. Lifecycle `status` and `schemaVersion` remain comparable fields.

Out of scope:

- changing or publishing definitions;
- comparing relations or historical learner records;
- semantic/legal interpretation of field values;
- exposing non-admin access.

## Acceptance criteria

1. The endpoint accepts only allowlisted entity types, a code, and two distinct
   positive versions.
2. Missing versions return a not-found error; equal versions are rejected.
3. The response lists changed fields with `from` and `to` values and returns an
   empty list when the versions are equivalent apart from generated metadata.
4. The endpoint is protected by the existing JWT + platform-admin guards.

