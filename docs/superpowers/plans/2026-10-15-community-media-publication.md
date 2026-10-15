# ALET-B09 — Mídias na publicação comunitária Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transfer family curriculum-pack media into an isolated, idempotent community-media namespace during publication and expose it only after approval.

**Architecture:** Add a public `CurriculumPackMedia` model with provenance and a unique publication-origin field on `CurriculumPack`. The publication service preflights/copies uploads, imports the pack, and atomically persists public media with compensating cleanup; a public media endpoint resolves signed URLs only for approved packs.

**Tech Stack:** NestJS, Prisma/PostgreSQL, Zod contracts, S3-compatible `ObjectStorageService`, Jest, Vitest, Next.js.

**Spec:** `docs/superpowers/specs/2026-10-15-community-media-publication.md`

## Global Constraints

- Preserve private family storage keys; public DTOs never expose `storageKey` or `sourceFamilyMediaId`.
- Only `PUBLISHED` + `APPROVED` packs are visible through the public media endpoint.
- Uploads must remain within the existing allowed MIME types and 25 MiB limit.
- Repeated publication of the same family snapshot is idempotent.
- Keep external links HTTPS-only and run existing prompt/content validation.
- Preserve all existing family-media and community-pack behavior.

## Review Focus

- Missing or unconfirmed upload: publication fails before import and deletes any copied objects; test in the family publication service.
- External URL: copied without storage access and returned only after approval; test in media service/controller.
- Repeated publication: returns the existing origin-linked pack and creates no duplicate media; test in publication service/repository.
- Storage namespace: public copy key is opaque/community-scoped and never the family key; test the object-storage key/copy calls.
- Public visibility: draft, pending, rejected, and suspended packs return not found; test the public media endpoint.

---

### Task 1: Contracts, Prisma schema, and migration

**Files:**
- Create: `packages/contracts/src/curriculum-pack-media.ts`
- Create: `packages/contracts/src/curriculum-pack-media.test.ts`
- Modify: `packages/contracts/src/curriculum-pack.ts`
- Modify: `packages/contracts/src/index.ts` only if the new contract is not exported elsewhere
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_add_community_curriculum_pack_media/migration.sql`

- [ ] Write failing contract tests for the public response schema and the rule that storage/provenance fields are not part of the DTO.
- [ ] Run the focused contracts test and confirm it fails because the schema/model export is absent.
- [ ] Add `curriculumPackMediaResponseSchema`, enum types, and `CurriculumPackMediaResponseDto`; add nullable unique `originFamilyCurriculumPackId` and the public media relation in Prisma.
- [ ] Add the SQL migration for the origin column, FK, public enum values, public media table, uniqueness, and indexes without changing existing family rows.
- [ ] Generate Prisma client and run the focused contracts tests to green.

### Task 2: Storage copy primitive and public-media repository

**Files:**
- Modify: `apps/api/src/platform/storage/object-storage.service.ts`
- Create: `apps/api/src/modules/curriculum/infrastructure/curriculum-pack-media.repository.ts`
- Create: `apps/api/src/modules/curriculum/infrastructure/curriculum-pack-media.repository.spec.ts`
- Modify: `apps/api/src/modules/curriculum/infrastructure/curriculum-pack.repository.ts`

- [ ] Write failing tests for deterministic community key generation, copy, origin lookup, atomic media insertion, and cleanup.
- [ ] Run the focused API tests and confirm the missing methods fail.
- [ ] Implement `buildCommunityCurriculumPackMediaStorageKey(sourceMediaId, fileName)`, `copyObject(sourceKey, targetKey, contentType)`, and repository methods `findPackByOriginFamilyPackId`, `createPackMedia`, `listPublicMedia`, and `deleteCommunityPack`.
- [ ] Ensure repository insertion uses `createMany`/transaction semantics and `skipDuplicates` only for the same `(packId, sourceFamilyMediaId)` identity.
- [ ] Run focused tests and API typecheck.

### Task 3: Publication transfer and idempotency

**Files:**
- Modify: `apps/api/src/modules/curriculum/application/family-curriculum-pack.service.ts`
- Modify: `apps/api/src/modules/curriculum/application/family-curriculum-pack.service.spec.ts`
- Modify: `apps/api/src/modules/curriculum/application/curriculum-pack-import.service.ts`
- Modify: `apps/api/src/modules/curriculum/infrastructure/curriculum-pack.repository.ts`

- [ ] Add RED tests for external-link transfer, confirmed-upload copy, missing upload failure before import, cleanup after copy failure, and repeated origin publication.
- [ ] Extend `importPack` with an optional origin-family-pack identifier and pass it through `createPack`.
- [ ] Preflight family media, copy uploads to deterministic community keys, call import with origin provenance, and atomically persist public media rows.
- [ ] On any failure after copying, delete copied keys and remove the just-created community pack; on an existing origin, return it without copying/importing.
- [ ] Run all family curriculum-pack service tests and the API typecheck.

### Task 4: Public media API

**Files:**
- Create: `apps/api/src/modules/curriculum/application/curriculum-pack-media.service.ts`
- Create: `apps/api/src/modules/curriculum/application/curriculum-pack-media.service.spec.ts`
- Create: `apps/api/src/modules/curriculum/presentation/curriculum-pack-media.controller.ts`
- Create: `apps/api/src/modules/curriculum/presentation/curriculum-pack-media.controller.spec.ts`
- Modify: `apps/api/src/modules/curriculum/curriculum.module.ts`

- [ ] Write RED tests for external and upload DTO mapping and for rejecting non-approved packs.
- [ ] Implement `listPublic(packId)` with approved/public visibility, external URLs, and presigned URLs for public uploads.
- [ ] Register the unauthenticated `GET /api/v1/curriculum-packs/:packId/media` route and preserve the existing authenticated family-media route.
- [ ] Run focused controller/service tests and API lint/typecheck.

### Task 5: Public detail interaction and i18n

**Files:**
- Modify: `apps/web/src/components/curriculum/curriculum-pack-detail-modal.tsx`
- Modify: `apps/web/tests/curriculum-pack-detail.test.tsx`
- Modify: `apps/web/src/lib/i18n/dictionaries/pt-BR/curriculum.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/en-US/curriculum.ts`
- Modify: `apps/web/src/lib/i18n/dictionaries/es-ES/curriculum.ts`

- [ ] Add a user-triggered public-materials section that loads the media endpoint only when requested, shows loading/error/empty states, and renders safe external/upload links.
- [ ] Add tests for loading an external link and a signed upload URL without changing existing modal behavior.
- [ ] Add all copy symmetrically in the three locales and run the i18n audit.

### Task 6: Verification and handoff

- [ ] Run contracts tests and lint.
- [ ] Run API tests, typecheck, and lint.
- [ ] Run web tests, typecheck, and lint.
- [ ] Run `pnpm audit:i18n`, `node scripts/check-module-boundaries.mjs`, and `git diff --check`.
- [ ] Review the diff, commit with `feat(community): preserve media during publication`, push, open a PR titled with the conventional style, and wait for all four CI checks before merging.
