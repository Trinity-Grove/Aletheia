# Aletheia — Plan 04: Family Devotional & YouVersion Scripture Integration Design

**Status:** Approved  
**Version:** 1.1  
**Date:** 2026-08-24  
**Author:** Covenant Grove & Antigravity  

---

## 1. Overview and Principles

The **Family Devotional** is the spiritual center of the homeschool day in Aletheia, supporting scripture reading, reflection, memory verses, discussion, hymnody, and prayer journal.

Core principles:
1. **Guardians Lead:** Guardians have complete authority over devotional passages, reflections, memory verses, and prayer topics.
2. **YouVersion Platform Integration with Local Fallback:**
   - Supports live Bible passage text and metadata retrieval via the official **YouVersion Platform REST API / SDK** (`https://api.youversion.com/v1`) using `YOUVERSION_APP_KEY` (`X-YVP-App-Key`).
   - Resilient design: If no key is set or the network is unavailable, the application gracefully provides manual scripture text input.
3. **Faith is Narrated, Never Scored:** Spirituality, prayer frequency, and devotional completions receive NO numerical grading or ranking.
4. **Integrated Family Prayer Journal:** Petitions and praise/gratitude items persist across sessions, allowing families to celebrate answered prayers.
5. **Strict Multi-Tenant Isolation:** Family devotionals and prayers are strictly scoped by `FamilyTenantGuard`.

---

## 2. Contracts and Data Schema

### 2.1 Contracts (`packages/contracts`)
- **YouVersion / Scripture DTOs:**
  - `BibleVersionDto`: `{ id: string; name: string; language: string; abbreviation: string }`
  - `BiblePassageDto`: `{ reference: string; versionId: string; content: string; copyright?: string }`
- **Devotional DTOs:**
  - `UpsertDailyDevotionalDto`:
    - `date`: string (`YYYY-MM-DD`)
    - `bibleReference`: string (e.g. "João 14:1-6", "Salmo 23")
    - `bibleVersionId`: string optional (e.g. YouVersion Bible ID or "ARA")
    - `passageText`: string optional
    - `reflection`: string optional
    - `memoryVerse`: string optional
    - `hymnOrSong`: string optional
    - `discussionQuestions`: string array or optional string
    - `practicalApplication`: string optional
  - `DailyDevotionalResponseDto`: Full daily devotional record.
- **Prayer DTOs:**
  - `PrayerType`: `"PETITION" | "GRATITUDE"`
  - `CreatePrayerDto`:
    - `type`: `PrayerType`
    - `title`: string (1..200)
    - `description`: string optional
    - `learnerId`: string uuid optional
  - `UpdatePrayerDto`: Partial fields of `CreatePrayerDto`
  - `AnswerPrayerDto`:
    - `answeredNote`: string optional
  - `PrayerResponseDto`: Full prayer record.

### 2.2 Database Schema (`apps/api/prisma/schema.prisma`)
```prisma
enum PrayerType {
  PETITION
  GRATITUDE
}

model DailyDevotional {
  id                  String   @id @default(uuid()) @db.Uuid
  familyId            String   @map("family_id") @db.Uuid
  date                DateTime @db.Date
  bibleReference      String   @map("bible_reference")
  bibleVersionId      String?  @map("bible_version_id")
  passageText         String?  @map("passage_text")
  reflection          String?
  memoryVerse         String?  @map("memory_verse")
  hymnOrSong          String?  @map("hymn_or_song")
  discussionQuestions String?  @map("discussion_questions")
  practicalApplication String? @map("practical_application")
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  family              Family   @relation(fields: [familyId], references: [id], onDelete: Cascade)

  @@unique([familyId, date])
  @@index([familyId])
  @@map("daily_devotionals")
}

model PrayerRequest {
  id           String     @id @default(uuid()) @db.Uuid
  familyId     String     @map("family_id") @db.Uuid
  learnerId    String?    @map("learner_id") @db.Uuid
  type         PrayerType @default(PETITION)
  title        String
  description  String?
  isAnswered   Boolean    @default(false) @map("is_answered")
  answeredAt   DateTime?  @map("answered_at") @db.Timestamptz(6)
  answeredNote String?    @map("answered_note")
  archivedAt   DateTime?  @map("archived_at") @db.Timestamptz(6)
  createdAt    DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  family       Family     @relation(fields: [familyId], references: [id], onDelete: Cascade)
  learner      Learner?   @relation(fields: [learnerId], references: [id], onDelete: SetNull)

  @@index([familyId])
  @@index([familyId, isAnswered])
  @@map("prayer_requests")
}
```

---

## 3. Backend Module (`@modules/devotional`)

### 3.1 Services & Providers
- `YouVersionService`:
  - Consumes `YOUVERSION_APP_KEY` from `EnvironmentService`.
  - `fetchPassage(reference: string, versionId?: string): Promise<BiblePassageDto | null>`
  - `getAvailableBibles(): Promise<BibleVersionDto[]>`
- `DevotionalService`:
  - `upsertDailyDevotional(familyId: string, dto: UpsertDailyDevotionalDto): Promise<DailyDevotionalResponseDto>`
  - `getDevotionalByDate(familyId: string, date: string): Promise<DailyDevotionalResponseDto | null>`
  - `listDevotionals(familyId: string, limit?: number): Promise<DailyDevotionalResponseDto[]>`
- `PrayerService`:
  - `createPrayer(familyId: string, dto: CreatePrayerDto): Promise<PrayerResponseDto>`
  - `listPrayers(familyId: string, filter?: { isAnswered?: boolean }): Promise<PrayerResponseDto[]>`
  - `markPrayerAnswered(familyId: string, id: string, dto: AnswerPrayerDto): Promise<PrayerResponseDto>`
  - `archivePrayer(familyId: string, id: string): Promise<PrayerResponseDto>`
- `DEVOTIONAL_PUBLIC_API` / `DevotionalPublicApi`:
  - `getTodayDevotionalSummary(familyId: string): Promise<{ hasDevotional: boolean; bibleReference?: string; memoryVerse?: string }>`

### 3.2 Presentation Controllers
- `DevotionalController` (`/api/v1/families/:familyId/devotionals`):
  - `GET /by-date?date=YYYY-MM-DD`
  - `PUT /by-date`
  - `GET /history`
  - `GET /scripture/lookup?reference=JHN.3.16&versionId=3034` (Queries YouVersion API with local fallback)
- `PrayerController` (`/api/v1/families/:familyId/prayers`):
  - `POST /`
  - `GET /`
  - `PATCH /:id`
  - `POST /:id/answer`
  - `POST /:id/archive`

---

## 4. Web Frontend (`@aletheia/web`)

1. **Devotional Page (`/devotional`):**
   - Header with Date Picker (Ontem, Hoje, Amanhã).
   - Scripture Card with YouVersion Lookup button (busca automática do texto do versículo/passagem) e editor manual.
   - Reflection & Discussion questions.
   - Memory Verse & Hymn of the day.
   - Prayer Journal drawer/tab (Active petitions, praise/gratitude, mark answered).
2. **Dashboard Highlight (`/today` or `/`):**
   - Devotional banner with today's scripture and quick prayer count.

---

## 5. Verification Strategy

1. **Modular Boundaries:** 0 violations (`check:boundaries`).
2. **Unit Tests:** Mock YouVersion API responses, tests for Devotional and Prayer services.
3. **E2E Tests:** Complete multi-tenant verification in `devotional.e2e-spec.ts`.
4. **Web Tests:** Component tests for Devotional page, Scripture lookup, and Prayer modal.
