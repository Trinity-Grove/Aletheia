# Spec: Activity safety policy metadata

## Goal

Close the next free data-driven safety gap in issue #96: an `ActivityDefinition` can carry a structured, validated safety policy that survives the existing admin create/list flow.

## Design

Reuse the validated safety-policy contract introduced for competency metadata. The shared policy contains:

- `riskLevel`: `LOW`, `MODERATE`, `HIGH`, or `CRITICAL`.
- `supervision`: `NONE`, `RECOMMENDED`, `REQUIRED`, or `ADULT_ONLY`.
- `minimumAge`: optional integer from 0 through 120.
- `requiresAdultConsent`: boolean, default `false`.
- `requiredTrainingCodes`: up to 20 stable uppercase/dot-case codes.
- `instructions`: optional safety guidance up to 2,000 characters.

The existing activity fields remain compatible and are not removed:

- `riskLevel` stays as the legacy activity-level catalog field.
- `supervisionRequired` stays as the legacy boolean used by current consumers.
- The new `metadata.safetyPolicy` is the structured source for future policy-aware planners and AI flows.

Cross-field validation remains fail-closed:

- `HIGH` and `CRITICAL` risk require `REQUIRED` or `ADULT_ONLY` supervision.
- `ADULT_ONLY` supervision requires `requiresAdultConsent: true`.
- Unknown policy fields and malformed training codes are rejected.

## Boundaries

- Reuse the existing JSONB metadata; no migration or new table.
- No learner-facing enforcement or planner/AI behavior in this slice.
- Do not silently derive or overwrite the legacy `riskLevel` and `supervisionRequired` fields; reconciliation is a separate policy-resolution decision.
- Existing activity payloads without the policy remain valid.

## Acceptance criteria

1. An activity with a valid structured policy is accepted and the policy round-trips through admin create/list.
2. High/critical risk without required supervision is rejected with `400`.
3. Adult-only supervision without adult consent is rejected with `400`.
4. Existing activity payloads and the legacy safety fields remain valid.
5. The shared policy contract has one implementation, avoiding divergence between competencies and activities.
