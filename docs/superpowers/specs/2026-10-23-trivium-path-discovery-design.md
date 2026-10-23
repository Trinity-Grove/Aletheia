# Trivium Path Discovery and Learner Adoption

**Issue:** #95 (Trivium Grammar, Logic, Rhetoric checklist items)  
**Branch:** `feat/alet-95-trivium-paths`  
**Status:** Draft for review

## Problem

The catalog currently names Classical Education / Trivium as a pedagogical approach, but does not expose Grammar, Logic, and Rhetoric as published learning paths. The curriculum explorer displays pedagogical-model templates only. The API has family-wide path preferences, but no learner-facing catalog endpoint or UI that consumes them. This leaves families unable to discover the three paths or make a meaningful, learner-specific choice.

## Goals

- Add one published Trivium catalog domain with three distinct paths: Grammar, Logic, and Rhetoric.
- Populate each path with practical, family-neutral competencies and starter objectives that do not duplicate existing subject objectives.
- Expose published path metadata and learner-specific adoption state through family-scoped API endpoints.
- Let an authorized family educator choose a learner and academic year, filter and inspect paths, and adopt or remove a path for that learner/year.
- Keep age and educational-stage values advisory; families control readiness.
- Localize every user-facing string in pt-BR, en-US, and es-ES.

## User flow

1. A family educator opens `/curriculum/explore` from the existing curriculum navigation.
2. They select a learner and academic year (default to the first active learner and current year where available).
3. The page shows the three Trivium paths with purpose, competencies/objective preview, and advisory stage/age guidance.
4. The educator adopts or removes a path for the selected learner and year. The page updates the selected state and gives clear success/error feedback.
5. Changing learner or year reloads that context's selections without changing another learner's plan.
6. If no learner or year exists, the page explains the missing setup and offers the existing curriculum/learner setup route rather than allowing a context-free adoption.

## API and data contract

- Keep the published catalog separate from family state. The catalog is read-only for family users and contains only published paths.
- Add a family-protected catalog read for the `CLASSICAL_EDUCATION` domain that returns path identity, description, metadata, ordered competencies, starter objectives, and the current learner/year adoption state. Do not surface unrelated domains until their discoverability and localized presentation are in scope.
- Add learner/year-scoped enable/disable operations. Validate that the learner and academic year both belong to the route's family before reading or writing state.
- Preserve existing family-wide selection endpoints and records for compatibility; do not silently reinterpret historical selections as learner-specific.
- Persist learner/year path adoption with a normalized record and a unique key across family, learner, academic year, and path. Disabling is a reversible state change and never deletes progress or definitions.
- Reject missing or unpublished paths and invalid/cross-family learner/year identifiers using the existing API error conventions.
- A selection does not yet instantiate objectives or filter the learner's planner. It records an explicit adoption that the explorer can show; planner integration is a separate follow-up unless the existing domain already offers a safe activation operation.

## Catalog design

- Domain code: `CLASSICAL_TRIVIUM` (confirm no existing code collision before implementation).
- Stable path codes: `TRIVIUM.GRAMMAR`, `TRIVIUM.LOGIC`, `TRIVIUM.RHETORIC`.
- Use universal stage codes only (`EARLY_YEARS`, `PRIMARY`, `LOWER_SECONDARY`, `UPPER_SECONDARY`) and advisory age metadata. Do not add country-specific stages or hard age gates.
- Grammar centers on language, attentive reading, vocabulary, memory, and foundational expression; Logic on asking questions, identifying claims/evidence, relationships, and sound reasoning; Rhetoric on audience-aware communication, composing arguments, speaking, and revising.
- Each path has differentiated competencies, a small set of actionable starter objectives, evidence guidance, and prerequisites only where pedagogically meaningful. Do not create rigid progression enforcement between paths.
- Seeding must use existing definition services, stable codes, publish definitions idempotently, and avoid mutating already-published records on every boot.

## Interface and accessibility

- Extend the current `/curriculum/explore` experience and keep the route, `ProductShell`, existing navigation, and Aletheia visual language.
- Add a discoverable Trivium path section alongside pedagogical-model templates; preserve current model-template behavior and filters.
- Reuse `@aletheia/ui` components and existing BEM CSS conventions. No Tailwind utilities in JSX.
- On mobile, context selectors stack, cards use full available width, controls remain touch-friendly, and the page has no horizontal scrolling.
- Use semantic headings, explicit labels, keyboard-operable controls, visible focus, and accessible loading/empty/error/success states.
- Clarify that stage/age are suggestions and that the educator decides readiness.

## Security and permissions

- Read and write routes remain protected by existing JWT and family-tenant guards.
- Adoption mutations require the existing `manage_curriculum` permission.
- Every repository query and mutation is tenant-scoped; never trust learner/year IDs supplied by the browser without ownership checks.

## Out of scope

- Automatically creating LearningObjective rows or changing existing learner progress.
- Redesigning the global navigation or changing the existing pedagogical-model adoption behavior.
- A public marketplace, educator uploads, AI-generated content, or sharing between families.
- A rigid Grammar→Logic→Rhetoric age-based lock.

## Open implementation checks

- Verify domain/path code collisions and available competencies before seeding.
- Confirm the best existing ownership-validation service for learner and academic year IDs.
- Confirm whether the frontend explorer can expose the path gallery as a tab/section without disrupting the current template workflow.
- The Superdesign visual draft is pending: automatic review blocked sending repository code/CSS to the external service. No source was sent. A local-only layout proposal can proceed if external sharing is declined.

## Acceptance criteria

1. Repeated seeding creates no duplicate domain/path/competency rows and leaves existing published definitions unchanged.
2. All three paths are published and their competencies/objectives are discoverable through the family API.
3. A family can adopt/unadopt a path for one learner/year; changing the selection does not affect another learner/year.
4. Cross-family learner/year access, missing paths, and unpublished paths are rejected safely.
5. Existing family-wide selection endpoints and current template adoption continue to behave as before.
6. The explorer consumes the API, shows current adoption state, and updates after successful mutations.
7. All visible copy has matching pt-BR, en-US, and es-ES entries; accessibility and mobile layout requirements are covered.
