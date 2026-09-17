# Frontend Gap Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the missing frontend experiences in `apps/web` to unlock the rich capabilities already supported by the backend: Learner Access (Student Portal), Privacy Consent Management (Slice 2 of Issue #27), Curriculum Pack Plugins Gallery, Official Attendance Certificates, and Achievement Badges.

**Architecture:** Next.js 16 (Turbopack) client and server components integrated with `@aletheia/ui` design primitives and typed contracts from `@aletheia/contracts`. Multi-tenant and RBAC protected, ensuring guardians control access codes and consents, while learners get dedicated, accessible student interfaces.

**Tech Stack:** Next.js, React 19, TypeScript, `@aletheia/ui`, `@aletheia/contracts`, Vitest, Testing Library.

---

## Global Constraints

- Zero AI attribution trailers (`Co-Authored-By`, `Generated-By`, etc.) in commits, code, or comments.
- Adhere strictly to the Aletheia / Trinity Grove design tokens (`--forest`, `--gold`, `--sage`, `--bg-canvas`, `--font-serif`, etc.).
- Maintain backwards compatibility with existing tests in `apps/web/tests/`.
- Ensure strict multi-tenant boundary: all family routes scope by `familyId` and adhere to guardian permissions.
- Learner access uses dedicated cookie credentials without granting guardian powers.
- Every task follows TDD: write/extend unit tests in `apps/web/tests/`, implement minimal code, verify pass.

---

## Roadmap of Feature Tasks

### Phase 1: Learner Access & Student Portal (Modo Educando)
- **Task 1:** Guardian UI — PIN Access Management on `LearnerCard` (`POST /families/:familyId/learners/:learnerId/access/grant`, `regenerate`, `revoke`) with modal showing PIN & QR instructions.
- **Task 2:** Learner Login Route (`/aluno/login`) — Simple, friendly PIN entry authenticated via `POST /api/v1/learner-access/login`.
- **Task 3:** Learner Daily Agenda & Autonomy Route (`/aluno/agenda`) — Compact, child-friendly agenda displaying today's lessons with "Concluir Lição" button (`POST /api/v1/learner-access/learners/:learnerId/lessons/:lessonId/complete`).

### Phase 2: Privacy & Versioned Consents UI (Slice 2 of Issue #27)
- **Task 4:** Guardian Privacy Center (`/settings/privacy`) — Display published terms (`FAMILY` and `LEARNER` scopes), active consents, and history timestamps.
- **Task 5:** Consent Acceptance & Revocation Modals — Full markdown modal for reading terms and granting/revoking consent for the family and minor learners.
- **Task 6:** Mandatory Compliance Check Banner — Subtle banner/guard alert when new mandatory terms require guardian signature.

### Phase 3: Curriculum Packs & Plugins Gallery
- **Task 7:** Curriculum Packs Explorer (`/curriculum/packs`) — Gallery of official and third-party curriculum pack plugins (Biblical, Trades, Finance, Music, Cooking, etc.) with metadata, domains, and levels.
- **Task 8:** Family Pack Activation & Instance Manager — Enable guardians to install/activate packs into their family curriculum (`POST /api/v1/families/:familyId/curriculum-packs`).

### Phase 4: Official Certificates & Jurisdiction Compliance
- **Task 9:** Official Attendance Certificate Generator (`/reports`) — Button and preview to download the verifiable attendance certificate PDF (`/api/v1/families/:familyId/reports/export/pdf`).
- **Task 10:** Jurisdiction Requirements & 200-Day Progress Bar — Display legal compliance gauges based on country/state jurisdiction rules.

### Phase 5: Achievement Badges & Project Evidences
- **Task 11:** Achievement Badges Wall (`/learners/[id]/achievements` or Learner Card) — Visual showcase of auto-computed badges and milestones unlocked by the student.
- **Task 12:** Project & Link Evidence Upload — Update portfolio evidence submissions to support `PROJECT` (with URL/repo/doc) and `LINK`.
