# Seminary Paper Submissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist written work submitted from the seminary module as learner-linked evidence awaiting validation.

**Architecture:** Reuse the family-scoped evidence API, type catalog, and active competency tracking endpoint. Add an optional title field through the existing evidence persistence path, then connect the seminary page and show the title in the existing competency evidence list.

**Tech Stack:** Next.js/React, TypeScript, `@aletheia/contracts` Zod schemas, NestJS, Prisma, PostgreSQL, existing i18n dictionaries and `@aletheia/ui`.

**Spec:** `docs/superpowers/specs/2026-10-23-seminary-paper-submissions-design.md`

## Global Constraints

- Keep submissions `UNVALIDATED`; submission must not create assessment results or alter mastery/progression.
- Use the existing family-scoped APIs and published catalog IDs; do not add seminary-specific API routes or tables.
- Make `title` nullable/optional in the shared evidence contract to preserve compatibility with existing callers and rows.
- Keep new user-facing copy in `pt-BR`, `en-US`, and `es-ES`.
- Do not create or run tests in this implementation unless the user asks for test/verification work.

## Review Focus

- A learner with no active matching seminary competency must not submit a different competency or trigger implicit activation; page provides the `/curriculum` path.
- Missing evidence-type catalog entries must disable submit rather than send a code where the API expects a UUID.
- A request failure must leave title/body intact and make a retry possible; duplicate clicks must not issue concurrent writes.
- Existing submissions with null/missing title and old clients without `title` remain valid.
- An unvalidated submission remains pending and does not create assessment, achievement, or portfolio-promotion side effects.

## File Map

- `apps/api/prisma/schema.prisma` and a new timestamped migration: persist nullable evidence title.
- `packages/contracts/src/evidence-submission.ts`: accept optional title on create and expose nullable title on response.
- `apps/api/src/modules/curriculum/application/evidence-submission.service.ts` and `infrastructure/evidence-submission.repository.ts`: pass title to storage and response.
- `apps/web/app/(dashboard)/curriculum/seminary/page.tsx`: load family, learners, evidence types, and learner-specific tracked competencies; orchestrate submission.
- `apps/web/src/components/curriculum/seminary-module-viewer.tsx` and `seminary-paper-submission-modal.tsx`: collect learner context, map the selected discipline/type, and show save state/feedback.
- `apps/web/src/components/records/competency-tracking-panel.tsx`: render the structured title separately from the body for the existing evidence row.
- `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/curriculum.ts`: add symmetric learner, activation, loading, success, and error copy.

---

### Task 1: Add a backwards-compatible evidence title field

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (`EvidenceSubmission`)
- Create: `apps/api/prisma/migrations/20261023120000_add_evidence_submission_title/migration.sql`
- Modify: `packages/contracts/src/evidence-submission.ts`
- Modify: `apps/api/src/modules/curriculum/infrastructure/evidence-submission.repository.ts`
- Modify: `apps/api/src/modules/curriculum/application/evidence-submission.service.ts`

**Interfaces:**
- Create DTO accepts `title?: string | null`; trim and limit non-empty titles to 200 characters.
- Response DTO exposes `title?: string | null` so older responses remain consumable during rollout.
- Repository create input accepts `title?: string | null` and persists null when omitted.

- [x] Add nullable `title` to `EvidenceSubmission` and a migration using `ALTER TABLE "evidence_submissions" ADD COLUMN "title" TEXT;`.
- [x] Add optional nullable `title` to `createEvidenceSubmissionBaseSchema` and nullable `title` to `evidenceSubmissionResponseSchema`.
- [x] Thread title through the service create input and repository persistence/DTO mapping without changing status defaults or side effects.
- [x] Manually inspect the migration, create/response schema, and every evidence create caller to confirm legacy payloads still work.

### Task 2: Connect seminary learner, competency, and evidence catalogs

**Files:**
- Modify: `apps/web/app/(dashboard)/curriculum/seminary/page.tsx`
- Modify: `apps/web/src/components/curriculum/seminary-module-viewer.tsx`
- Modify: `apps/web/src/components/curriculum/seminary-paper-submission-modal.tsx`
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/curriculum.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/curriculum.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/curriculum.ts`

**Interfaces:**
- Page data: `LearnerSummaryDto[]`, `EvidenceTypeCatalogEntryDto[]`, and `LearnerCompetencyTrackingResponseDto[]` for the selected learner.
- Match discipline by `tracking.competency.code === discipline.competencyCode`; submit `tracking.competencyDefinitionId`.
- Match evidence type by catalog `entry.code === data.evidenceTypeCode`; submit `entry.id`.
- POST payload: `{ learnerId, evidenceTypeId, competencies: [{ competencyDefinitionId }], title, textContent, fileUrl }`.

- [x] Load learners and evidence-type catalog for the active family; handle no-family, loading, and request-error states.
- [x] Select the first available learner initially and allow changing learner explicitly; reload active tracking when learner changes.
- [x] Gate submission on a learner, published evidence type, and matching active seminary competency; show a `/curriculum` link when the competency is not active.
- [x] Connect `onSubmitPaper` to the family evidence-submission endpoint and retain modal values on failure.
- [x] On success, close/reset the modal and show a translated message that the work is awaiting validation.
- [x] Add matching keys and natural user-facing copy in all three locale files.
- [x] Manually inspect data transitions for family changes, learner changes, missing catalog entries, and repeated clicks.

### Task 3: Show the title in the existing evidence list

**Files:**
- Modify: `apps/web/src/components/records/competency-tracking-panel.tsx`
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/records.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/records.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/records.ts`

**Interfaces:**
- Read optional `EvidenceSubmissionResponseDto.title` and preserve the existing status badge and validation actions.

- [x] Render a non-empty title as the evidence row heading and the existing text/file URL as supporting content.
- [x] For legacy submissions without a title, retain the current text/file fallback.
- [x] Keep `UNVALIDATED` status and existing review actions visible; do not add a second list or automatic promotion.
- [x] Add only any required fallback/accessibility copy symmetrically across locales.
- [x] Manually inspect the evidence row for title present/absent, body present/absent, and each validation status.

## Self-review

- Spec coverage: persistence/title compatibility (Task 1), family and learner loading, identifier mapping, blocked states, save/error behavior, i18n (Task 2), and visible pending evidence (Task 3).
- Type consistency: the page maps seminary codes to evidence-type catalog UUIDs and active competency UUIDs before constructing `CreateEvidenceSubmissionDto`.
- Scope: no assessment/rubric flow, new route, new table, tests, or implicit curriculum activation.
