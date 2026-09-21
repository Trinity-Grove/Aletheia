# Spec: Learner Activity Completion with Automated Attendance, Incremental Diary & Parental Override

**Date:** 2026-09-20  
**Status:** Approved  
**Author:** Pair Programming Session

---

## 1. Overview & Problem Statement

In the Aletheia homeschool platform, learners can log in autonomously to their portal (`/aluno`) to view their daily agenda and mark assigned lessons as completed.

Currently, completing a lesson marks `lessonPlanLearner.completed = true` and updates the lesson status to `COMPLETED` (or `IN_PROGRESS`). However:
1. **Attendance is not automatically registered:** Parents must manually navigate to the attendance module to record presence for the day, even if the student completed all their scheduled activities.
2. **Learning diary is not automatically updated:** Completed lessons do not automatically appear in the family's "Diário de Aprendizagem" (`LearningRecord`), requiring manual data entry for portfolio and daily journal tracking.
3. **Parental Authority & Anti-Cheating Control:** Homeschool students may click "complete" without actually performing the work ("fake delivery"). Parents need absolute authority to:
   - Reopen / uncomplete any lesson, immediately reverting it to pending in the learner's portal and expunging the corresponding entry from the daily diary.
   - Override attendance (e.g. marking `UNEXCUSED_ABSENCE`), with a guard (`isAutoLogged: false`) ensuring that subsequent learner activity completions on that date do not override the parent's manual disciplinary decision.

---

## 2. Core Requirements & User Stories

### User Story 1: Automated Daily Attendance on Activity Completion
* When a learner marks any lesson complete for date $D$ (defaults to today):
  * Check if an `AttendanceRecord` exists for `(familyId, learnerId, date)`.
  * If no record exists:
    * Create an `AttendanceRecord` with:
      * `status: 'PRESENT'`
      * `isAutoLogged: true`
      * `hoursSpent: lessonDurationHours` (e.g. `actualDurationMinutes / 60` or `durationMinutes / 60`, minimum 0.25h)
      * `notes: 'Presença registrada automaticamente pela conclusão de atividade na agenda.'`
  * If a record exists:
    * If `isAutoLogged === true` and `status === 'PRESENT'`:
      * Increment `hoursSpent` by the lesson duration if available.
    * If `isAutoLogged === false`:
      * **Do not touch `status`**. Respect the parent's manual override.

### User Story 2: Incremental Learning Record in the Homeschool Diary
* When a learner completes a lesson:
  * Check if a `LearningRecord` already exists for `(familyId, learnerId, lessonPlanId)`.
  * If it does not exist:
    * Create a `LearningRecord` with:
      * `familyId`, `learnerId`
      * `subjectId`: lesson plan's `subjectId`
      * `academicYearId`: lesson plan's `academicYearId`
      * `lessonPlanId`: lesson plan's `id`
      * `type: 'PLANNED_LESSON'`
      * `title`: lesson plan's `title`
      * `description`: lesson plan's `description`
      * `date`: lesson completion date (`YYYY-MM-DD`)
      * `durationMinutes`: `actualDurationMinutes` ?? lesson plan's `durationMinutes`
      * `notes`: learner notes or lesson notes
      * `objectiveIds`: objective IDs associated with the lesson plan
  * In the web interface, the diary ([`RecordsJournalView`](file:///C:/Users/wende/Projects/Covenant-Grove/Aletheia/apps/web/src/components/records/records-journal-view.tsx)) immediately displays each completed activity incrementally.

### User Story 3: Reopen Lesson & Evict Fake Diary Entry
* Parents can reopen an activity (`POST /api/v1/families/:familyId/lessons/:id/reopen` with optional `?learnerId=...`):
  * Updates `lessonPlanLearner.completed = false`.
  * Updates `lessonPlan.status`:
    * If other learners on the lesson are still completed: `IN_PROGRESS`.
    * If no learners are completed: `PLANNED` and `completedAt: null`.
  * Deletes any `LearningRecord` associated with `(familyId, lessonPlanId, learnerId)`.
  * The activity immediately reappears as pending on the learner's portal agenda.

### User Story 4: Parental Attendance Override Protection
* When a parent logs attendance via `AttendanceService.logAttendance`:
  * If not explicitly specified, `isAutoLogged` defaults to `false`.
  * The automated attendance hook checks `existingAttendance.isAutoLogged`:
    * If `existingAttendance.isAutoLogged === false`, the hook never alters `status`.

---

## 3. Architecture & Module Boundaries

All cross-module interactions strictly follow [`check-module-boundaries.mjs`](file:///C:/Users/wende/Projects/Covenant-Grove/Aletheia/scripts/check-module-boundaries.mjs):
* `LearnerAccessModule` orchestrates lesson completion by:
  1. Invoking `LessonPlanPublicApi.completeLesson(...)`.
  2. Invoking `LearningRecordsPublicApi.createRecord(...)` (idempotent).
  3. Invoking `ComplianceReportsPublicApi.logAttendance(...)` (with manual-override preservation).
* `LessonsModule` exposes `reopenLesson` on `LessonPlanPublicApi`:
  1. Reopens the lesson in `LessonPlanRepository`.
  2. Invokes `LearningRecordsPublicApi.deleteByLessonPlanId(familyId, lessonPlanId, learnerId)`.
* `RecordsModule` exports `LEARNING_RECORDS_PUBLIC_API` with:
  - `createRecord(familyId, dto)`
  - `deleteByLessonPlanId(familyId, lessonPlanId, learnerId?)`
* `ReportsModule` exports `COMPLIANCE_REPORTS_PUBLIC_API` with:
  - `logAttendance(familyId, dto)`
  - `listAttendance(familyId, filter)`
