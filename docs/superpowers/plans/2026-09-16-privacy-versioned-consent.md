# Privacy: Versioned Consents & Immutable Records Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement versioned privacy consent definitions (`ConsentDefinition`) and immutable family/learner consent records (`ConsentRecord`) for Aletheia, delivering Slice 1 of Issue #27 with strict multi-tenant isolation and LGPD compliance.

**Architecture:** A catalog-driven versioned definitions architecture (`ConsentDefinition`) paired with an append-only, immutable event log (`ConsentRecord`). Pure state-machine transition functions govern definition lifecycles. A new `PrivacyModule` in NestJS exposes administrative, public, and family-scoped endpoints with IP and user-agent context auditing.

**Tech Stack:** TypeScript, NestJS, Fastify, Prisma, PostgreSQL, Zod, Jest, Vitest, Supertest.

**Spec:** [2026-09-16-privacy-versioned-consent-design.md](../specs/2026-09-16-privacy-versioned-consent-design.md)

## Global Constraints

- Never mutate or delete `ConsentRecord` entries; all actions are strictly append-only (`GRANTED` or `REVOKED`).
- Enforce strict family multi-tenancy via `FamilyTenantGuard`; cross-family operations must return 403 Forbidden.
- For `LEARNER` scoped consents, verify that `learner.familyId === familyId`; mismatched learner IDs must return 400 Bad Request.
- Never add `Co-Authored-By: Claude ...` or any AI-attribution trailers to commit messages, PR descriptions, or code comments.
- Mandatory terms cannot be individually revoked via the revocation endpoint.
- Keep `tsc --noEmit` and all unit/integration test suites green throughout development.

---

### Task 1: Contracts & Zod Schemas (`@aletheia/contracts`)

**Files:**
- Create: `packages/contracts/src/consent-definition.ts`
- Create: `packages/contracts/src/consent-definition.test.ts`
- Modify: `packages/contracts/src/index.ts`

**Interfaces:**
- Produces:
  - Enums: `ConsentScope` (`FAMILY`, `LEARNER`), `ConsentAction` (`GRANTED`, `REVOKED`), `ConsentStatus` (`ACTIVE`, `OUTDATED`, `REVOKED`, `PENDING`)
  - Schemas & DTOs:
    - `createConsentDefinitionSchema`, `CreateConsentDefinitionDto`
    - `updateConsentDefinitionStatusSchema`, `UpdateConsentDefinitionStatusDto`
    - `grantConsentSchema`, `GrantConsentDto`
    - `revokeConsentSchema`, `RevokeConsentDto`
    - `ConsentDefinitionResponseDto`, `ConsentRecordResponseDto`, `FamilyConsentOverviewDto`, `ConsentComplianceCheckDto`

- [ ] **Step 1: Write the failing tests in `packages/contracts/src/consent-definition.test.ts`**

```typescript
import { describe, expect, it } from 'vitest';
import {
  createConsentDefinitionSchema,
  grantConsentSchema,
  revokeConsentSchema,
  updateConsentDefinitionStatusSchema,
} from './consent-definition.js';

describe('Consent Definition Contracts', () => {
  it('validates valid consent definition creation input', () => {
    const valid = {
      code: 'TERMS_OF_SERVICE',
      version: 1,
      scope: 'FAMILY',
      mandatory: true,
      title: 'Termos de Uso da Plataforma',
      content: 'Texto completo dos termos...',
      purposes: ['Acesso ao sistema e processamento de rotinas'],
    };
    const parsed = createConsentDefinitionSchema.parse(valid);
    expect(parsed.code).toBe('TERMS_OF_SERVICE');
    expect(parsed.scope).toBe('FAMILY');
    expect(parsed.mandatory).toBe(true);
  });

  it('rejects invalid scope or missing required fields in definition', () => {
    expect(() =>
      createConsentDefinitionSchema.parse({
        code: 'INVALID',
        scope: 'UNKNOWN_SCOPE',
        title: 'Title',
        content: 'Content',
        purposes: [],
      }),
    ).toThrow();
  });

  it('validates grant consent payload', () => {
    const valid = {
      consentDefinitionId: '11111111-1111-1111-1111-111111111111',
      learnerId: '22222222-2222-2222-2222-222222222222',
    };
    const parsed = grantConsentSchema.parse(valid);
    expect(parsed.consentDefinitionId).toBe(valid.consentDefinitionId);
    expect(parsed.learnerId).toBe(valid.learnerId);
  });

  it('validates revoke consent payload without learnerId for family scope', () => {
    const valid = {
      consentDefinitionId: '11111111-1111-1111-1111-111111111111',
    };
    const parsed = revokeConsentSchema.parse(valid);
    expect(parsed.consentDefinitionId).toBe(valid.consentDefinitionId);
    expect(parsed.learnerId).toBeUndefined();
  });

  it('validates status transition payload', () => {
    const valid = { status: 'PUBLISHED' };
    const parsed = updateConsentDefinitionStatusSchema.parse(valid);
    expect(parsed.status).toBe('PUBLISHED');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @aletheia/contracts test src/consent-definition.test.ts`
Expected: FAIL with module/file not found.

- [ ] **Step 3: Implement `packages/contracts/src/consent-definition.ts` and export from `index.ts`**

```typescript
import { z } from 'zod';
import { definitionStatusSchema, type DefinitionStatus } from './curriculum-definition.js';

export const consentScopeSchema = z.enum(['FAMILY', 'LEARNER']);
export type ConsentScope = z.infer<typeof consentScopeSchema>;

export const consentActionSchema = z.enum(['GRANTED', 'REVOKED']);
export type ConsentAction = z.infer<typeof consentActionSchema>;

export const consentStatusSchema = z.enum(['ACTIVE', 'OUTDATED', 'REVOKED', 'PENDING']);
export type ConsentStatus = z.infer<typeof consentStatusSchema>;

export const createConsentDefinitionSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[A-Z0-9_]+$/, 'Code must contain uppercase letters, numbers, and underscores'),
  version: z.number().int().positive().default(1),
  scope: consentScopeSchema.default('FAMILY'),
  mandatory: z.boolean().default(false),
  title: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
  content: z.string().min(10),
  purposes: z.array(z.string().min(3)).min(1),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateConsentDefinitionDto = z.infer<typeof createConsentDefinitionSchema>;

export const updateConsentDefinitionStatusSchema = z.object({
  status: definitionStatusSchema,
});

export type UpdateConsentDefinitionStatusDto = z.infer<typeof updateConsentDefinitionStatusSchema>;

export const grantConsentSchema = z.object({
  consentDefinitionId: z.string().uuid(),
  learnerId: z.string().uuid().optional(),
});

export type GrantConsentDto = z.infer<typeof grantConsentSchema>;

export const revokeConsentSchema = z.object({
  consentDefinitionId: z.string().uuid(),
  learnerId: z.string().uuid().optional(),
});

export type RevokeConsentDto = z.infer<typeof revokeConsentSchema>;

export interface ConsentDefinitionResponseDto {
  id: string;
  code: string;
  version: number;
  status: DefinitionStatus;
  schemaVersion: number;
  scope: ConsentScope;
  mandatory: boolean;
  title: string;
  description: string | null;
  content: string;
  purposes: string[];
  metadata: Record<string, unknown> | null;
  publishedAt: string | null;
  deprecatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentRecordResponseDto {
  id: string;
  familyId: string;
  learnerId: string | null;
  consentDefinitionId: string;
  action: ConsentAction;
  consentedByUserId: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface LearnerConsentStatusDto {
  learnerId: string;
  learnerName: string;
  status: ConsentStatus;
  lastRecord: ConsentRecordResponseDto | null;
}

export interface TermConsentOverviewDto {
  definition: ConsentDefinitionResponseDto;
  status: ConsentStatus;
  familyStatus?: ConsentStatus;
  learnerStatuses?: LearnerConsentStatusDto[];
  lastRecord?: ConsentRecordResponseDto | null;
}

export interface FamilyConsentOverviewDto {
  familyId: string;
  terms: TermConsentOverviewDto[];
}

export interface ConsentComplianceCheckDto {
  compliant: boolean;
  pendingMandatoryTerms: ConsentDefinitionResponseDto[];
}
```

- [ ] **Step 4: Export in `packages/contracts/src/index.ts` & build contracts**

Add:
```typescript
export * from './consent-definition.js';
```
Run: `pnpm --filter @aletheia/contracts build && pnpm --filter @aletheia/contracts test`
Expected: PASS (all 42 test files passing).

- [ ] **Step 5: Commit**

```bash
git -C Aletheia add packages/contracts/src/consent-definition.ts packages/contracts/src/consent-definition.test.ts packages/contracts/src/index.ts
git -C Aletheia commit -m "feat(contracts): add schemas and DTOs for versioned consent definitions (issue #27)"
```

---

### Task 2: Prisma Schema & Database Migration (`apps/api`)

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260916100000_add_versioned_consent_and_records/migration.sql`

**Interfaces:**
- Consumes: Prisma schema, PostgreSQL
- Produces: `prisma.consentDefinition`, `prisma.consentRecord` client models

- [ ] **Step 1: Add models and enums to `apps/api/prisma/schema.prisma`**

```prisma
enum ConsentScope {
  FAMILY
  LEARNER
}

enum ConsentAction {
  GRANTED
  REVOKED
}

model ConsentDefinition {
  id              String           @id @default(uuid())
  code            String
  version         Int              @default(1)
  status          DefinitionStatus @default(DRAFT)
  schemaVersion   Int              @default(1)
  scope           ConsentScope     @default(FAMILY)
  mandatory       Boolean          @default(false)
  title           String
  description     String?
  content         String           @db.Text
  purposes        String[]
  metadata        Json?
  publishedAt     DateTime?
  deprecatedAt    DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  records         ConsentRecord[]

  @@unique([code, version])
  @@index([status, code])
}

model ConsentRecord {
  id                    String            @id @default(uuid())
  familyId              String
  learnerId             String?
  consentDefinitionId   String
  action                ConsentAction     @default(GRANTED)
  consentedByUserId     String
  ipAddress             String?
  userAgent             String?
  createdAt             DateTime          @default(now())

  family                Family            @relation(fields: [familyId], references: [id], onDelete: Cascade)
  learner               Learner?          @relation(fields: [learnerId], references: [id], onDelete: Cascade)
  consentDefinition     ConsentDefinition @relation(fields: [consentDefinitionId], references: [id], onDelete: Restrict)
  consentedByUser       User              @relation(fields: [consentedByUserId], references: [id], onDelete: Restrict)

  @@index([familyId, learnerId, consentDefinitionId, createdAt(sort: Desc)])
  @@index([consentedByUserId, createdAt])
}
```
Also update `Family`, `Learner`, and `User` models with relation fields:
- In `Family`: `consentRecords ConsentRecord[]`
- In `Learner`: `consentRecords ConsentRecord[]`
- In `User`: `consentRecords ConsentRecord[]`

- [ ] **Step 2: Generate Prisma migration SQL**

Create migration file `apps/api/prisma/migrations/20260916100000_add_versioned_consent_and_records/migration.sql`:
```sql
CREATE TYPE "ConsentScope" AS ENUM ('FAMILY', 'LEARNER');
CREATE TYPE "ConsentAction" AS ENUM ('GRANTED', 'REVOKED');

CREATE TABLE "ConsentDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "DefinitionStatus" NOT NULL DEFAULT 'DRAFT',
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "scope" "ConsentScope" NOT NULL DEFAULT 'FAMILY',
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "purposes" TEXT[],
    "metadata" JSONB,
    "publishedAt" TIMESTAMP(3),
    "deprecatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "learnerId" TEXT,
    "consentDefinitionId" TEXT NOT NULL,
    "action" "ConsentAction" NOT NULL DEFAULT 'GRANTED',
    "consentedByUserId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConsentDefinition_code_version_key" ON "ConsentDefinition"("code", "version");
CREATE INDEX "ConsentDefinition_status_code_idx" ON "ConsentDefinition"("status", "code");
CREATE INDEX "ConsentRecord_familyId_learnerId_consentDefinitionId_createdAt_idx" ON "ConsentRecord"("familyId", "learnerId", "consentDefinitionId", "createdAt" DESC);
CREATE INDEX "ConsentRecord_consentedByUserId_createdAt_idx" ON "ConsentRecord"("consentedByUserId", "createdAt");

ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_consentDefinitionId_fkey" FOREIGN KEY ("consentDefinitionId") REFERENCES "ConsentDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_consentedByUserId_fkey" FOREIGN KEY ("consentedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

- [ ] **Step 3: Run migration and prisma generate**

Run:
```bash
pnpm --filter @aletheia/api prisma migrate deploy
pnpm --filter @aletheia/api prisma:generate
```
Expected: Migration applied and client generated cleanly.

- [ ] **Step 4: Commit**

```bash
git -C Aletheia add apps/api/prisma/schema.prisma apps/api/prisma/migrations/20260916100000_add_versioned_consent_and_records/migration.sql
git -C Aletheia commit -m "feat(api): add ConsentDefinition and ConsentRecord Prisma models and migration (issue #27)"
```

---

### Task 3: Consent Definitions Catalog Service & Admin API (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/privacy/application/definition-status-transition.ts`
- Create: `apps/api/src/modules/privacy/application/definition-status-transition.spec.ts`
- Create: `apps/api/src/modules/privacy/infrastructure/consent-definitions.repository.ts`
- Create: `apps/api/src/modules/privacy/application/consent-definitions.service.ts`
- Create: `apps/api/src/modules/privacy/application/consent-definitions.service.spec.ts`
- Create: `apps/api/src/modules/privacy/presentation/consent-definitions.controller.ts`
- Create: `apps/api/src/modules/privacy/presentation/public-consent-definitions.controller.ts`

**Interfaces:**
- Consumes: Prisma client, `@aletheia/contracts`
- Produces:
  - `computeStatusTransition(current, target)`
  - `ConsentDefinitionsService.create(dto)`
  - `ConsentDefinitionsService.updateStatus(id, targetStatus)`
  - `ConsentDefinitionsService.getPublishedDefinitions(scope?)`

- [ ] **Step 1: Write failing tests for definition status transitions in `apps/api/src/modules/privacy/application/definition-status-transition.spec.ts`**

```typescript
import { describe, expect, it } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { computeStatusTransition } from './definition-status-transition.js';

describe('Consent Definition Status Transitions', () => {
  it('allows DRAFT -> PUBLISHED', () => {
    const { nextStatus, publishedAt, deprecatedAt } = computeStatusTransition('DRAFT', 'PUBLISHED');
    expect(nextStatus).toBe('PUBLISHED');
    expect(publishedAt).toBeInstanceOf(Date);
    expect(deprecatedAt).toBeUndefined();
  });

  it('allows PUBLISHED -> DEPRECATED', () => {
    const { nextStatus, deprecatedAt } = computeStatusTransition('PUBLISHED', 'DEPRECATED');
    expect(nextStatus).toBe('DEPRECATED');
    expect(deprecatedAt).toBeInstanceOf(Date);
  });

  it('allows DEPRECATED -> ARCHIVED', () => {
    const { nextStatus } = computeStatusTransition('DEPRECATED', 'ARCHIVED');
    expect(nextStatus).toBe('ARCHIVED');
  });

  it('rejects invalid backward transitions', () => {
    expect(() => computeStatusTransition('PUBLISHED', 'DRAFT')).toThrow(BadRequestException);
    expect(() => computeStatusTransition('ARCHIVED', 'PUBLISHED')).toThrow(BadRequestException);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @aletheia/api test src/modules/privacy/application/definition-status-transition.spec.ts`
Expected: FAIL with file not found.

- [ ] **Step 3: Implement `definition-status-transition.ts`**

```typescript
import { BadRequestException } from '@nestjs/common';
import type { DefinitionStatus } from '@aletheia/contracts';

const VALID_TRANSITIONS: Record<DefinitionStatus, DefinitionStatus[]> = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['DEPRECATED', 'ARCHIVED'],
  DEPRECATED: ['ARCHIVED'],
  ARCHIVED: [],
};

export function computeStatusTransition(
  current: DefinitionStatus,
  target: DefinitionStatus,
): { nextStatus: DefinitionStatus; publishedAt?: Date; deprecatedAt?: Date } {
  if (current === target) {
    return { nextStatus: current };
  }

  const allowed = VALID_TRANSITIONS[current] || [];
  if (!allowed.includes(target)) {
    throw new BadRequestException(
      `Invalid status transition from ${current} to ${target}. Allowed: ${allowed.join(', ') || 'none'}`,
    );
  }

  const now = new Date();
  return {
    nextStatus: target,
    publishedAt: target === 'PUBLISHED' ? now : undefined,
    deprecatedAt: target === 'DEPRECATED' ? now : undefined,
  };
}
```

- [ ] **Step 4: Implement repository and service with unit tests**

Implement `consent-definitions.repository.ts`, `consent-definitions.service.ts`, and test with `consent-definitions.service.spec.ts`.
Run: `pnpm --filter @aletheia/api test src/modules/privacy/application/consent-definitions.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Implement admin and public controllers**

`consent-definitions.controller.ts` (Admin `/api/v1/admin/consent-definitions`) and `public-consent-definitions.controller.ts` (`/api/v1/consent-definitions/published`).

- [ ] **Step 6: Commit**

```bash
git -C Aletheia add apps/api/src/modules/privacy/application/ apps/api/src/modules/privacy/infrastructure/ apps/api/src/modules/privacy/presentation/
git -C Aletheia commit -m "feat(privacy): add ConsentDefinitionsService and controllers (issue #27)"
```

---

### Task 4: Family Consent Service, Immutability & Module Integration (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/privacy/infrastructure/family-consent.repository.ts`
- Create: `apps/api/src/modules/privacy/application/family-consent.service.ts`
- Create: `apps/api/src/modules/privacy/application/family-consent.service.spec.ts`
- Create: `apps/api/src/modules/privacy/presentation/family-consent.controller.ts`
- Create: `apps/api/src/modules/privacy/privacy.module.ts`
- Create: `apps/api/src/modules/privacy/application/public-api.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Produces:
  - `FamilyConsentService.grantConsent(familyId, userId, dto, context)`
  - `FamilyConsentService.revokeConsent(familyId, userId, dto, context)`
  - `FamilyConsentService.getFamilyConsentOverview(familyId)`
  - `FamilyConsentService.checkMandatoryCompliance(familyId, learnerId?)`
  - `PRIVACY_PUBLIC_API` export

- [ ] **Step 1: Write failing tests in `family-consent.service.spec.ts`**

Cover:
1. Granting consent creates an append-only `ConsentRecord` with `GRANTED`, IP, and userAgent.
2. Granting learner-scoped consent fails if `learner.familyId !== familyId`.
3. Revoking mandatory consent throws `BadRequestException`.
4. Revoking optional consent creates a new row with `REVOKED`.
5. Resolving active state takes the latest record.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @aletheia/api test src/modules/privacy/application/family-consent.service.spec.ts`
Expected: FAIL with service not found.

- [ ] **Step 3: Implement `family-consent.repository.ts` & `family-consent.service.ts`**

Implement repository methods:
- `createRecord(familyId, userId, dto, ip, userAgent)`
- `findLatestRecord(familyId, definitionId, learnerId?)`
- `findAllLatestRecordsForFamily(familyId)`
Implement service business rules and status calculation.

- [ ] **Step 4: Run unit tests to verify they pass**

Run: `pnpm --filter @aletheia/api test src/modules/privacy`
Expected: PASS across all privacy module unit tests.

- [ ] **Step 5: Implement `family-consent.controller.ts`, `privacy.module.ts` and wire into `app.module.ts`**

Add routes:
- `GET /api/v1/families/:familyId/consents`
- `POST /api/v1/families/:familyId/consents/grant`
- `POST /api/v1/families/:familyId/consents/revoke`
- `GET /api/v1/families/:familyId/consents/compliance`
Export `PRIVACY_PUBLIC_API` and import `PrivacyModule` into `app.module.ts`.

- [ ] **Step 6: Commit**

```bash
git -C Aletheia add apps/api/src/modules/privacy/ apps/api/src/app.module.ts
git -C Aletheia commit -m "feat(privacy): add FamilyConsentService, controller, and wire PrivacyModule (issue #27)"
```

---

### Task 5: Integration Tests & Multi-Tenant Security Verification (`apps/api`)

**Files:**
- Create: `apps/api/test/privacy-consent.integration-spec.ts`

**Interfaces:**
- Consumes: NestJS Fastify application, real PostgreSQL database, Supertest

- [ ] **Step 1: Write integration tests in `apps/api/test/privacy-consent.integration-spec.ts`**

Test scenarios against real Postgres:
1. **Lifecycle & Grant:**
   - Admin creates and publishes `TERMS_OF_SERVICE` (mandatory, FAMILY scope) and `AI_TUTOR_SHARING` (optional, LEARNER scope).
   - Guardian grants both consents.
   - Assert in DB: `ipAddress`, `userAgent`, and `consentedByUserId` are stored correctly.
2. **Immutability & Revocation:**
   - Guardian revokes `AI_TUTOR_SHARING` for Learner 1.
   - Guardian re-grants it.
   - Assert in DB: exactly 3 distinct chronological records exist for this pair, none updated.
3. **Strict Multi-Tenant Isolation (Critical Security Test):**
   - Guardian A (Family A) attempts to access `POST /api/v1/families/${familyBId}/consents/grant` $\to$ expects `403 Forbidden`.
   - Guardian A attempts to list `GET /api/v1/families/${familyBId}/consents` $\to$ expects `403 Forbidden`.
   - Guardian A attempts to pass `learnerBId` (child of Family B) in `POST /api/v1/families/${familyAId}/consents/grant` $\to$ expects `400 Bad Request` (cross-family child spoofing blocked).
4. **Compliance Check & Version Upgrade:**
   - Query `/compliance` returns `compliant: true` when mandatory v1 is consented.
   - Admin publishes v2 of `TERMS_OF_SERVICE`.
   - Query `/compliance` returns `compliant: false` with `pendingMandatoryTerms` listing v2 until accepted.

- [ ] **Step 2: Run integration tests**

Run: `pnpm --filter @aletheia/api test:integration test/privacy-consent.integration-spec.ts`
Expected: PASS (all tests passing).

- [ ] **Step 3: Run full typecheck and contracts suite**

Run:
```bash
pnpm --filter @aletheia/contracts build
pnpm --filter @aletheia/contracts test
pnpm --filter @aletheia/api typecheck
```
Expected: PASS clean with zero errors.

- [ ] **Step 4: Commit**

```bash
git -C Aletheia add apps/api/test/privacy-consent.integration-spec.ts
git -C Aletheia commit -m "test(privacy): add real Postgres integration tests and multi-tenant isolation verification (issue #27)"
```
