# Aletheia — Plan 04: Family Devotional & Prayer Journal Design

**Status:** Approved  
**Version:** 1.0  
**Date:** 2026-08-24  
**Author:** Covenant Grove & Antigravity  

---

## 1. Overview and Principles

The **Family Devotional** is the spiritual heart of the daily homeschool routine in Aletheia, opening each day with intentional scripture reading, discussion, prayer, and worship.

Core principles:
1. **Guardians Lead:** Guardians have complete authority over devotional plans, bible translations, reflections, and prayers.
2. **Faith is Narrated, Never Scored:** In alignment with Aletheia core principles, spirituality and prayer receive NO numerical ranking or grading.
3. **Integrated Family Prayer Journal:** Prayer petitions and praises/gratitudes persist across days, allowing the family to record when and how prayers were answered as a testament to God's faithfulness.
4. **Multi-Tenant Family Isolation:** Devotional and prayer records are private to each family and strictly isolated by `FamilyTenantGuard`.

---

## 2. Contracts and Data Schema

### 2.1 Contracts (`packages/contracts`)
- **Devotional DTOs:**
  - `UpsertDailyDevotionalDto`:
    - `date`: string (`YYYY-MM-DD`)
    - `bibleReference`: string (1..200, e.g. "Salmo 23:1-6")
    - `bibleTranslation`: string (1..50, default "ARA")
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
    - `learnerId`: string uuid optional (if prayer is on behalf of or requested by a specific learner)
  - `UpdatePrayerDto`: Partial update of prayer fields.
  - `AnswerPrayerDto`:
    - `answeredNote`: string optional (testimony of answered prayer)
  - `PrayerResponseDto`: Full prayer record including `isAnswered`, `answeredAt`, `answeredNote`.

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
  bibleTranslation    String   @default("ARA") @map("bible_translation")
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

### 3.1 Domain & Services
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
  - `PUT /by-date` (upserts devotional for specified date)
  - `GET /history`
- `PrayerController` (`/api/v1/families/:familyId/prayers`):
  - `POST /` (create prayer petition or gratitude)
  - `GET /` (list active prayers/gratitudes)
  - `POST /:id/answer` (mark as answered with note)
  - `POST /:id/archive` (soft-delete / archive)

---

## 4. Web User Interface (`@aletheia/web`)

1. **Devotional Page (`/devotional`):**
   - Header with Date Picker and quick navigators (⬅️ Ontem, Hoje, ➡️ Amanhã).
   - Card: **Leitura Bíblica** (Referência, Versão, Texto).
   - Card: **Reflexão & Conversa Familiar** (Perguntas de reflexão).
   - Card: **Versículo para Memorização**.
   - Card: **Hino / Cântico do Dia**.
   - Drawer / Section: **Caderno de Oração & Gratidão** (Adicionar pedido, marcar orações respondidas).
2. **Dashboard Integration (`/` or `/today`):**
   - Highlight widget displaying today's devotional passage, memory verse, and active prayer count.

---

## 5. Verification Strategy

1. **Boundary & Lint Checks:**
   - 0 boundary violations (`check:boundaries`).
   - Clean ESLint across workspace.
2. **Contract & Unit Tests:**
   - `packages/contracts/src/devotional.test.ts` & `prayer.test.ts`.
   - `apps/api/src/modules/devotional/application/*.spec.ts`.
3. **E2E & Multi-Tenant Tests:**
   - `apps/api/test/devotional.e2e-spec.ts` (Validating CRUD and tenant boundary isolation).
4. **Web Frontend Tests:**
   - Vitest component tests for Devotional view, form editors, and Prayer Journal.
   - Clean Next.js static build.
