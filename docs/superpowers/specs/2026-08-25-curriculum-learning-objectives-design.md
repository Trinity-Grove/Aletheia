# Aletheia — Plan 05: Curriculum, Pedagogical Frameworks & Learning Objectives Design

**Status:** Approved  
**Version:** 1.0  
**Date:** 2026-08-25  
**Author:** Covenant Grove & Antigravity  

---

## 1. Overview and Principles

The **Curriculum & Learning Objectives** module enables homeschooling families to design, organize, and track their academic roadmap across subjects, pedagogical frameworks, and academic years.

Core principles:
1. **Freedom of Pedagogical Approach:** Supports Classical Education (Trivium), Charlotte Mason, Traditional, Unit Studies, or fully Custom/Eclectic methodologies.
2. **Mastery & Competencies over Standardization:** Learning objectives track progress (Not Started, In Progress, Achieved) without rigid grade rankings or high-stakes stress.
3. **Template Accelerators with Full Customization:** Families can apply curated pedagogical frameworks with starter subjects and objectives, or craft their own curriculum completely from scratch.
4. **Learner & Academic Year Scoping:** Curricula and objectives are tied to specific learners and academic years (e.g. \"Ano Letivo 2026\"), maintaining clear historical records as students progress through stages.
5. **Strict Multi-Tenant Isolation:** All curriculum plans, subjects, and objectives are strictly scoped to the family tenant boundary.

---

## 2. Contracts and Data Schema

### 2.1 Contracts (`packages/contracts`)
- **Enums:**
  - `PedagogicalFramework`: `\"CLASSICAL_TRIVIUM\" | \"CHARLOTTE_MASON\" | \"TRADITIONAL\" | \"UNIT_STUDIES\" | \"CUSTOM\"`
  - `ObjectiveStatus`: `\"NOT_STARTED\" | \"IN_PROGRESS\" | \"ACHIEVED\"`
- **Academic Year DTOs:**
  - `CreateAcademicYearDto`: `{ year: number; title: string; startDate?: string; endDate?: string; isCurrent?: boolean }`
  - `AcademicYearResponseDto`: Full academic year record.
- **Subject DTOs:**
  - `CreateSubjectDto`: `{ name: string; color?: string; icon?: string; description?: string }`
  - `UpdateSubjectDto`: Partial subject fields.
  - `SubjectResponseDto`: Full subject record.
- **Learner Plan DTOs:**
  - `UpsertLearnerPlanDto`: `{ learnerId: string; academicYearId: string; pedagogicalFramework: PedagogicalFramework; notes?: string }`
  - `LearnerPlanResponseDto`: Full learner plan record.
- **Learning Objective DTOs:**
  - `CreateObjectiveDto`: `{ learnerId: string; subjectId: string; academicYearId: string; title: string; description?: string; targetDate?: string }`
  - `UpdateObjectiveDto`: `{ title?: string; description?: string; status?: ObjectiveStatus; targetDate?: string; order?: number }`
  - `ObjectiveResponseDto`: Full objective record with `status`, `achievedAt`, etc.
- **Template Application DTO:**
  - `ApplyCurriculumTemplateDto`: `{ learnerId: string; academicYearId: string; template: PedagogicalFramework }`

### 2.2 Database Schema (`apps/api/prisma/schema.prisma`)
```prisma
enum PedagogicalFramework {
  CLASSICAL_TRIVIUM
  CHARLOTTE_MASON
  TRADITIONAL
  UNIT_STUDIES
  CUSTOM
}

enum ObjectiveStatus {
  NOT_STARTED
  IN_PROGRESS
  ACHIEVED
}

model AcademicYear {
  id        String    @id @default(uuid()) @db.Uuid
  familyId  String    @map(\"family_id\") @db.Uuid
  year      Int
  title     String
  startDate DateTime? @map(\"start_date\") @db.Date
  endDate   DateTime? @map(\"end_date\") @db.Date
  isCurrent Boolean   @default(false) @map(\"is_current\")
  createdAt DateTime  @default(now()) @map(\"created_at\") @db.Timestamptz(6)
  updatedAt DateTime  @updatedAt @map(\"updated_at\") @db.Timestamptz(6)

  family    Family    @relation(fields: [familyId], references: [id], onDelete: Cascade)
  plans     LearnerCurriculumPlan[]
  objectives LearningObjective[]

  @@unique([familyId, year])
  @@index([familyId])
  @@map(\"academic_years\")
}

model Subject {
  id          String    @id @default(uuid()) @db.Uuid
  familyId    String    @map(\"family_id\") @db.Uuid
  name        String
  color       String?   @default(\"#3B82F6\")
  icon        String?
  description String?
  archivedAt  DateTime? @map(\"archived_at\") @db.Timestamptz(6)
  createdAt   DateTime  @default(now()) @map(\"created_at\") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map(\"updated_at\") @db.Timestamptz(6)

  family      Family    @relation(fields: [familyId], references: [id], onDelete: Cascade)
  objectives  LearningObjective[]

  @@unique([familyId, name])
  @@index([familyId])
  @@map(\"subjects\")
}

model LearnerCurriculumPlan {
  id                   String               @id @default(uuid()) @db.Uuid
  familyId             String               @map(\"family_id\") @db.Uuid
  learnerId            String               @map(\"learner_id\") @db.Uuid
  academicYearId       String               @map(\"academic_year_id\") @db.Uuid
  pedagogicalFramework PedagogicalFramework @default(CUSTOM) @map(\"pedagogical_framework\")
  notes                String?
  createdAt            DateTime             @default(now()) @map(\"created_at\") @db.Timestamptz(6)
  updatedAt            DateTime             @updatedAt @map(\"updated_at\") @db.Timestamptz(6)

  family               Family               @relation(fields: [familyId], references: [id], onDelete: Cascade)
  learner              Learner              @relation(fields: [learnerId], references: [id], onDelete: Cascade)
  academicYear         AcademicYear         @relation(fields: [academicYearId], references: [id], onDelete: Cascade)

  @@unique([familyId, learnerId, academicYearId])
  @@index([familyId])
  @@map(\"learner_curriculum_plans\")
}

model LearningObjective {
  id             String          @id @default(uuid()) @db.Uuid
  familyId       String          @map(\"family_id\") @db.Uuid
  learnerId      String          @map(\"learner_id\") @db.Uuid
  subjectId      String          @map(\"subject_id\") @db.Uuid
  academicYearId String          @map(\"academic_year_id\") @db.Uuid
  title          String
  description    String?
  status         ObjectiveStatus @default(NOT_STARTED)
  targetDate     DateTime?       @map(\"target_date\") @db.Date
  achievedAt     DateTime?       @map(\"achieved_at\") @db.Timestamptz(6)
  order          Int             @default(0)
  createdAt      DateTime        @default(now()) @map(\"created_at\") @db.Timestamptz(6)
  updatedAt      DateTime        @updatedAt @map(\"updated_at\") @db.Timestamptz(6)

  family         Family          @relation(fields: [familyId], references: [id], onDelete: Cascade)
  learner        Learner         @relation(fields: [learnerId], references: [id], onDelete: Cascade)
  subject        Subject         @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  academicYear   AcademicYear    @relation(fields: [academicYearId], references: [id], onDelete: Cascade)

  @@index([familyId, learnerId, academicYearId])
  @@index([familyId, subjectId])
  @@map(\"learning_objectives\")
}
```

---

## 3. Backend Module (`@modules/curriculum`)

### 3.1 Services & Repositories
- `CurriculumService`:
  - Academic Years CRUD (`createAcademicYear`, `listAcademicYears`, `getOrCreateCurrentYear`)
  - Subjects CRUD (`createSubject`, `listSubjects`, `updateSubject`, `archiveSubject`)
  - Learner Plans (`upsertLearnerPlan`, `getLearnerPlan`)
  - Templates Application (`applyTemplate(familyId, dto)` creates standard subjects and seed objectives for the learner)
- `ObjectiveService`:
  - `createObjective(familyId, dto)`
  - `updateObjective(familyId, id, dto)` (handles automatic `achievedAt` timestamp when status transitions to `ACHIEVED`)
  - `listObjectives(familyId, filter: { learnerId?, subjectId?, academicYearId?, status? })`
  - `deleteObjective(familyId, id)`
- `CURRICULUM_PUBLIC_API` / `CurriculumPublicApi`:
  - `getLearnerCurriculumSummary(familyId: string, learnerId: string): Promise<{ totalObjectives: number; achievedObjectives: number; framework: string }>`

### 3.2 Presentation Controllers
- `CurriculumController` (`/api/v1/families/:familyId/curriculum`):
  - `GET /academic-years` & `POST /academic-years`
  - `GET /subjects` & `POST /subjects` & `PATCH /subjects/:id`
  - `GET /plans?learnerId=...&academicYearId=...` & `PUT /plans`
  - `POST /templates/apply`
- `ObjectiveController` (`/api/v1/families/:familyId/curriculum/objectives`):
  - `POST /`
  - `GET /`
  - `PATCH /:id`
  - `DELETE /:id`

---

## 4. Web User Interface (`@aletheia/web`)

1. **Curriculum Page (`/curriculum`):**
   - Header with Academic Year dropdown (e.g. \"2026\") and active learner indicator (synchronized with `LearnerFocusSwitcher`).
   - Pedagogical Framework Badge with button: **Aplicar Template Pedagógico** (Clássica, Charlotte Mason, Tradicional).
   - Subject Cards Grid: Displays each subject with color accent, objective count, and completion progress bar (% Concluído).
   - Objectives Management Drawer/List: List of learning objectives with clickable status toggles (⚪ Não iniciado -> 🟡 Em andamento -> 🟢 Concluído), edit and delete actions.
   - Modals for **Nova Disciplina**, **Novo Objetivo** and **Aplicar Template**.

---

## 5. Verification Strategy

1. **Modular Boundaries:** 0 violations (`check:boundaries`).
2. **Contract & Unit Tests:** Unit tests for curriculum and objective services.
3. **E2E & Multi-Tenant Tests:** Multi-tenant security boundary validation in `curriculum.e2e-spec.ts`.
4. **Web Frontend Tests:** Vitest component tests in `curriculum.test.tsx` verifying subject listing, template applying, and objective status toggling.
