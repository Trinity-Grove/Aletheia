# Jurisdiction profile integration — ALET-248 second slice

## Scope

Connect the metadata-only `PrivacyProfileCode` catalog to the existing,
versioned `JurisdictionDefinition` metadata and family jurisdiction response.

## Constraints

- no database migration: the existing JSONB metadata is versioned with each
  jurisdiction definition;
- no consent decision, legal conclusion, or data-residency enforcement is
  derived from this field;
- existing responses remain valid when older rows have no profile metadata;
- seeded profiles are descriptive and must be reviewed before being used as
  compliance controls.

## Acceptance criteria

1. Jurisdiction metadata validates an optional privacy profile code.
2. BR, UY, US-FL, and US-TX seeds carry the profile selected by the catalog.
3. The family jurisdiction endpoint returns the profile when available and
   `null` for legacy rows without it.
4. The national fallback remains safe and explicit.

