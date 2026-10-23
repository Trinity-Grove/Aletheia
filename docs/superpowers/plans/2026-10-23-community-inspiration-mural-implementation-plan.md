# ALET-290 Community Hub Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finish the already merged community mural by repairing seed adoption, requiring explicit anonymous-sharing consent, and preventing private metadata from reaching the public catalog.

**Architecture:** Keep the existing `/community` mural and B09 `FamilyActivity` APIs. Adopt curated seeds by creating a private family activity snapshot; adopt published items through the existing family-scoped adoption endpoint. Enforce publication consent in the shared Zod contract and allowlist metadata in the community response mapper.

**Tech Stack:** React/Next.js, NestJS, Zod, `@aletheia/ui`, i18n dictionaries, Jest/Vitest.

**Spec:** `docs/superpowers/specs/2026-10-16-community-hub-inspiration-mural-design.md`

## Global Constraints

- Keep family, learner, author, and source identifiers out of public catalog DTOs.
- New and adopted family activities default to `PRIVATE`.
- Public creation or publication requires explicit acknowledgment of anonymous sharing.
- Keep i18n keys symmetric in pt-BR, en-US, es-ES and use `@aletheia/ui` with BEM/tokens.
- Preserve the existing `/community` and `/comunidade` routes and `/curriculum/community` resource management flow.
- TDD: write a failing test before each behavior fix and verify the expected failure.

## Review Focus

- A seed ID is not present in the database; adoption must still create a usable private copy.
- A failed network response must not look like a successful share/adoption or close the form.
- Arbitrary metadata can contain identifying fields even when the top-level DTO is anonymous.
- Editing a previously public activity must require fresh explicit consent.

---

### Task 1: Enforce consent and sanitize public activity metadata

**Files:**
- Modify `packages/contracts/src/activity-definition.ts`, `community-activity.ts`, `family-activity.ts`, and their tests.
- Modify `apps/api/src/modules/curriculum/application/family-activity.service.ts`.
- Create `apps/api/src/modules/curriculum/application/family-activity.service.spec.ts`.

**Interfaces:**
- Extend validated activity metadata with `theme`, `materials`, `seasonalPeriod`, `steps`, and `isSeed`; keep `CommunityIdeaTheme` defined without a circular contract import. Add optional input `anonymousSharingConsent?: boolean`; require `true` whenever `visibility === 'PUBLIC'`.
- Community metadata allowlist: `theme`, `materials`, `seasonalPeriod`, `steps` only; curated seed status is never accepted from public submissions. omit malformed or all other properties.

- [ ] Contract test: PRIVATE remains valid without consent; PUBLIC fails without consent and passes with consent.
- [x] API service test: public response excludes `familyId`, `origin`, `learnerId`, `authorName`, arbitrary metadata; it preserves valid theme/material/step fields.
- [x] Run focused contract/API tests and observe RED.
- [x] Implement validation and allowlisted public DTO mapping.
- [x] Run focused tests and API typecheck.
- [ ] Commit `fix: require consent and sanitize community activity metadata`.

### Task 2: Make mural share/adopt flows truthful and complete

**Files:**
- Modify `apps/web/src/components/community/community-hub-view.tsx`, `share-idea-modal.tsx`, `adopt-idea-modal.tsx` if retained.
- Modify `apps/web/src/components/curriculum/family-activity-modal.tsx`.
- Modify `apps/web/tests/community-hub-view.test.tsx`, `community-modals.test.tsx`; add focused family activity modal coverage if needed.
- Add symmetric translations in `apps/web/src/lib/i18n/dictionaries/{pt-BR,en-US,es-ES}/community.ts` and `curriculum.ts`.

- [ ] Test: seed adoption sends a PRIVATE family activity create request carrying only the idea snapshot; community adoption uses the existing `/families/:familyId/activities/adopt` endpoint.
- [ ] Test: adoption/share API errors show an error and preserve a retryable UI; success is announced and links to the family activity library.
- [ ] Test: share form requires explicit anonymous-sharing consent; PUBLIC activity create/edit submits consent, and a PRIVATE activity does not require it.
- [ ] Run focused web/contract tests and observe RED.
- [ ] Implement one-click adoption without a nonfunctional learner selector; preserve the family-private copy and show feedback.
- [ ] Add a required consent checkbox for mural sharing and for public family-activity visibility; block submission until checked.
- [ ] Check non-OK responses, keep the form open on failure, and show localized status feedback.
- [ ] Run focused web tests, web typecheck, and i18n audit.
- [ ] Commit `fix: complete community mural share and adopt flows`.

### Task 3: End-to-end focused verification and review

- [ ] Run contracts, API, and web suites relevant to community and family activities.
- [ ] Run i18n coverage, module boundaries, API/web typechecks, and `git diff --check`.
- [ ] Inspect final public DTO and all public-create/update call sites against the consent contract.
- [ ] Keep #290 closed: original implementation is merged by PR #356 and the mural by PR #362; report this as a follow-up correction rather than attempting to close it again.
