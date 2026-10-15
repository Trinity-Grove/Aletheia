# Spec: Competency safety policy metadata

## Goal

Complete the next independent data-driven capability in issue #96: a competency can declare a structured safety policy that is versioned with the competency definition and safe to consume by future activity/planner flows.

## Design

Add an optional `safetyPolicy` object to `CompetencyMetadata`. Keep it in the existing JSONB metadata because it is definition configuration, not a relational identity or a learner event. The object is explicit and validated rather than an unbounded record:

- `riskLevel`: `LOW`, `MODERATE`, `HIGH`, or `CRITICAL`.
- `supervision`: `NONE`, `RECOMMENDED`, `REQUIRED`, or `ADULT_ONLY`.
- `minimumAge`: optional integer from 0 through 120.
- `requiresAdultConsent`: boolean, default `false`.
- `requiredTrainingCodes`: up to 20 stable uppercase/dot-case codes.
- `instructions`: optional safety guidance up to 2,000 characters.

Cross-field validation fails closed:

- `HIGH` and `CRITICAL` risk require `REQUIRED` or `ADULT_ONLY` supervision.
- `ADULT_ONLY` supervision requires `requiresAdultConsent: true`.

The policy is returned through the existing competency metadata response and is persisted by the existing repository unchanged. No new table or migration is needed.

## Boundaries

- This slice defines and validates catalog data; it does not yet enforce the policy in learner-facing activity assignment, planner, or AI recommendation paths.
- It does not replace `ActivityDefinition`'s existing `riskLevel`/`supervisionRequired` fields. A future resolver may combine competency and activity policies, but that merge is a separate decision.
- Existing competencies without `safetyPolicy` remain valid and unchanged.
- Platform-admin authorization and definition versioning remain provided by the existing endpoints and lifecycle.

## Acceptance criteria

1. A valid competency safety policy is accepted, returned, and round-trips through the existing admin create/list API.
2. High-risk policies without required supervision are rejected with the normal contract validation response.
3. Adult-only supervision without adult consent is rejected.
4. Existing competency payloads without the optional policy continue to pass all existing tests and seeders.
5. No learner-facing behavior changes in this slice.
