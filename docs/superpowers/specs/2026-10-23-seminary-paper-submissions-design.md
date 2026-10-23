# Seminary Paper Submissions Design

## Intent

Let a family educator submit academic work from `/curriculum/seminary` and have it saved as evidence for the selected learner and matching seminary competency. The educator must receive confirmation that the evidence is awaiting review. This closes the persistence gap recorded in issue #95 without implying that submission itself proves mastery.

## Goals

- Connect the existing seminary submission modal to the family-scoped evidence API.
- Require an explicit learner and an active tracked competency matching the selected discipline.
- Resolve evidence type and competency IDs from existing family-facing catalogs/tracking data; never send seminary codes as database IDs.
- Persist the work title, body, optional external document URL, selected learner, evidence type, and competency association.
- Keep the new evidence `UNVALIDATED`; only a separate validation action may validate or reject it.
- Show clear success, loading, and recoverable error states, with interface copy in `pt-BR`, `en-US`, and `es-ES`.

## Non-goals

- Building a reviewer inbox, rubric scoring UI, oral-defense scheduling, or approval workflow.
- Automatically validating evidence, creating assessment results, or changing competency mastery/progression.
- Uploading files; the existing modal accepts an optional external URL.
- Changing the seminary curriculum content or marking all academic-production checklist items in #95 complete. This slice covers only persisted written submissions.

## Approaches considered

1. **Use the existing EvidenceSubmission API and extend it with a nullable title (recommended).** Load learners, published evidence types, and active tracked competencies through existing family routes. Add a nullable title field to the evidence contract and persistence model so the title is preserved as structured data; existing callers remain compatible. This reuses current family authorization, privacy audit, status, and portfolio integration.
2. **Create a seminary-specific submission endpoint and table.** This could model discipline codes directly, but duplicates the existing evidence lifecycle and creates another review/status path.
3. **Pack the title into `textContent` and use the existing API unchanged.** This avoids a migration, but loses the distinction between title and work body in portfolio and evidence consumers.

Approach 1 is selected because seminary work is already an evidence submission, while the existing contract has no title field. A nullable schema addition keeps current clients compatible and avoids encoding presentation data into the body.

## User flow and behavior

1. The page loads the active family, that family's learners, published evidence-type catalog, and (when a learner is selected) active competency tracking.
2. The educator selects the learner. The first active learner may be selected initially; the selection remains explicit and changeable.
3. The educator selects a seminary discipline and opens the existing modal. Submission is enabled only when the selected learner has an active tracked competency whose `competency.code` equals the discipline's `competencyCode`, and the chosen evidence-type code exists in the published catalog.
4. If no learner exists, explain that a learner must be added. If the seminary competency is not active for that learner, explain that the family must activate the seminary curriculum first and link to `/curriculum`. Do not create tracking or activate a curriculum as a side effect.
5. On save, submit `POST /api/v1/families/:familyId/curriculum/evidence-submissions` with `learnerId`, catalog `evidenceTypeId`, `{ competencyDefinitionId }` for the matched active competency, `title`, `textContent`, and optional `fileUrl`.
6. On success, close/reset the modal and confirm that the work was saved and is awaiting validation. The evidence remains `UNVALIDATED`; it must be visible in the learner's evidence/portfolio list with its title and status.
7. On API failure, keep the modal open, retain form values, and show a translated error. Prevent duplicate submissions while the request is pending.

If family/catalog/tracking data fails to load, show a recoverable error and disable submission rather than guessing IDs or silently dropping the work.

## Data and API constraints

- Existing endpoint: `GET /api/v1/families/:familyId/learners`.
- Existing endpoint: `GET /api/v1/families/:familyId/curriculum/evidence-types/catalog`; map `code` to the real `id`.
- Existing endpoint: `GET /api/v1/families/:familyId/curriculum/competency-tracking?learnerId=:learnerId&status=ACTIVE`; map `competency.code` to `competencyDefinitionId`.
- Existing write endpoint: `POST /api/v1/families/:familyId/curriculum/evidence-submissions`; its service derives author, verifies family ownership, audits sensitive-data creation, and creates evidence as `UNVALIDATED`.
- Add nullable `title` to `EvidenceSubmission`, Prisma migration, create/response contracts, repository mapping, and API service mapping. Existing submissions and callers without a title remain valid.
- Do not add seminary-specific database tables or new API routes.
- Keep all added UI strings symmetric across the three supported locales and use existing UI/design-system patterns.

## Acceptance criteria

- A seminary paper submission is persisted through the existing API, survives reload, and is associated with the chosen learner, published evidence type, and matching active seminary competency.
- The title remains a distinct persisted field and is shown with the evidence in the learner's portfolio/evidence list.
- The API response and UI show `UNVALIDATED`; submission never creates validation, assessment, achievement, or mastery changes.
- No-learner, no-active-seminary-competency, loading, and request-failure states guide the educator without sending malformed requests.
- Existing evidence submissions without a title continue to work.
- New user-facing strings have parity in `pt-BR`, `en-US`, and `es-ES`.

## Implementation calls left to the builder

- Follow the repository's current Prisma migration and family-page data-loading patterns.
- Keep the existing modal API shape where practical; add only the learner/evidence identifiers required to submit safely.
- Use the existing portfolio/evidence rendering path to expose the title and pending status; do not build a second list in the seminary page.
