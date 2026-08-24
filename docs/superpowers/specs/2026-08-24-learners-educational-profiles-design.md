# Aletheia — Plan 03: Learners & Educational Profiles Design

**Status:** Approved  
**Version:** 1.0  
**Date:** 2026-08-24  
**Author:** Covenant Grove & Antigravity  

---

## 1. Overview and Principles

Plan 03 establishes the **Learners & Educational Profiles** foundation in Aletheia. In accordance with the product principles:
1. **Guardians retain complete authority:** Minor learners are educational profiles managed by family guardians and do NOT have separate user accounts by default.
2. **Pedagogical and jurisdictional flexibility:** Educational stages support both classical Trivium/stages (`EARLY_YEARS`, `PRIMARY_GRAMMAR`, `MIDDLE_LOGIC`, `HIGH_RHETORIC`, `OTHER`) and customizable series/grade notations.
3. **Data preservation and integrity:** Learner profiles use soft deletion (`archivedAt`) to protect educational history, assessments, and portfolios against accidental data loss.
4. **Strict multi-tenant family isolation:** A guardian can only view, create, edit, or archive learner profiles associated with their active family.
5. **Contextual Focus in UX:** The application navigation shell allows guardians to view activities for "All Family" or focus on an individual learner.

---

## 2. Architecture and Data Models

### 2.1 Contracts (`packages/contracts`)
- **Enums & Types:**
  - `EducationalStage`: `'EARLY_YEARS' | 'PRIMARY_GRAMMAR' | 'MIDDLE_LOGIC' | 'HIGH_RHETORIC' | 'OTHER'`
- **DTOs & Zod Schemas:**
  - `CreateLearnerDto`:
    - `firstName`: string (1..100)
    - `lastName`: string optional (0..100)
    - `preferredName`: string optional (0..100)
    - `birthDate`: ISO date string (e.g. `YYYY-MM-DD`)
    - `stage`: `EducationalStage`
    - `customGrade`: string optional (e.g. "3º Ano", "Grade 5")
    - `avatarColor`: string optional (hex color or preset identifier)
    - `specialNeeds`: string optional
    - `notes`: string optional
  - `UpdateLearnerDto`: Partial fields of `CreateLearnerDto`
  - `LearnerResponseDto`: Full learner summary including `id`, `familyId`, `firstName`, `lastName`, `preferredName`, `birthDate`, `stage`, `customGrade`, `avatarColor`, `specialNeeds`, `notes`, `archivedAt`, `createdAt`, `updatedAt`.
  - `LearnerSummaryDto`: Token-efficient representation for selection headers and summaries (`id`, `displayName`, `stage`, `customGrade`, `avatarColor`, `isArchived`).

### 2.2 Database Schema (`apps/api/prisma/schema.prisma`)
```prisma
enum EducationalStage {
  EARLY_YEARS
  PRIMARY_GRAMMAR
  MIDDLE_LOGIC
  HIGH_RHETORIC
  OTHER
}

model Learner {
  id            String           @id @default(uuid()) @db.Uuid
  familyId      String           @map("family_id") @db.Uuid
  firstName     String           @map("first_name")
  lastName      String?          @map("last_name")
  preferredName String?          @map("preferred_name")
  birthDate     DateTime         @map("birth_date") @db.Date
  stage         EducationalStage @default(PRIMARY_GRAMMAR)
  customGrade   String?          @map("custom_grade")
  avatarColor   String?          @map("avatar_color")
  specialNeeds  String?          @map("special_needs")
  notes         String?
  archivedAt    DateTime?        @map("archived_at") @db.Timestamptz(6)
  createdAt     DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)

  family        Family           @relation(fields: [familyId], references: [id], onDelete: Cascade)

  @@index([familyId])
  @@index([familyId, archivedAt])
  @@map("learners")
}
```

---

## 3. Backend Module (`@modules/learners`)

### 3.1 Domain
- `LearnerEntity`: Encapsulates invariants, display name resolution (`preferredName || firstName`), age calculation, and archive/reactivation lifecycle.

### 3.2 Application & Public API
- `LearnerService`:
  - `createLearner(familyId: string, dto: CreateLearnerDto): Promise<LearnerResponseDto>`
  - `getFamilyLearners(familyId: string, includeArchived?: boolean): Promise<LearnerResponseDto[]>`
  - `getLearnerById(familyId: string, learnerId: string): Promise<LearnerResponseDto>`
  - `updateLearner(familyId: string, learnerId: string, dto: UpdateLearnerDto): Promise<LearnerResponseDto>`
  - `archiveLearner(familyId: string, learnerId: string): Promise<LearnerResponseDto>`
  - `reactivateLearner(familyId: string, learnerId: string): Promise<LearnerResponseDto>`
- `LEARNERS_PUBLIC_API` / `LearnersPublicApi`:
  - `findLearnerById(familyId: string, learnerId: string): Promise<LearnerSummaryDto | null>`
  - `listActiveLearners(familyId: string): Promise<LearnerSummaryDto[]>`

### 3.3 Presentation & Endpoints
- `LearnerController` (`/api/v1/families/:familyId/learners`):
  - `POST /` — Create learner in family (Guards: `JwtAuthGuard`, `FamilyTenantGuard`)
  - `GET /` — List learners in family (Query: `includeArchived=true|false`)
  - `GET /:id` — Get learner details
  - `PATCH /:id` — Update learner details
  - `POST /:id/archive` — Soft-delete / archive learner
  - `POST /:id/reactivate` — Restore archived learner

---

## 4. Frontend & User Experience (`@aletheia/web`)

1. **Learner Focus Switcher (`LearnerFocusSwitcher`):**
   - Located in the global top header and persistent shell.
   - Allows switching between:
     - 👨‍👩‍👧‍👦 **Toda a Família** (all learners aggregate view)
     - 🎓 **Individual Learner** (focused learner with avatar badge and educational stage).
   - Syncs active learner context in client state and URL state (`?learnerId=...` where applicable).

2. **Learner Management Page (`/family/learners` or `/learners`):**
   - Cards showing each learner with birthdate, calculated age, stage, and grade tag.
   - Quick action to edit learner profile.
   - Tab / filter for Active and Archived learners.
   - "Adicionar Educando" modal with complete validation.

---

## 5. Verification Strategy

1. **Boundary & Lint Checks:**
   - Zero modular boundary violations (`pnpm check:boundaries`).
   - Clean ESLint across contracts, api, and web packages.
2. **Unit & Contract Tests:**
   - Contract validation in `packages/contracts/src/learner.test.ts`.
   - Domain entity & service tests in `apps/api/src/modules/learners/`.
3. **Multi-Tenant Isolation & E2E Tests:**
   - `test/learners.e2e-spec.ts`: Complete lifecycle of learner creation, modification, listing, archiving, and reactivating.
   - Cross-family multi-tenant authorization tests verifying Guardian A cannot read or mutate Guardian B's learner profiles.
4. **Web Frontend Testing:**
   - Vitest component tests for `LearnerFocusSwitcher`, `LearnerCard`, and `LearnerFormModal`.
   - Next.js clean production build with static generation.
