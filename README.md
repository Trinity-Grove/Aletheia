# Aletheia

> **A parent-first platform for faithful, thoughtful home education.**

Aletheia is an open, sovereign, and deeply pedagogical platform designed to serve homeschooling families across the globe. Built from the ground up on strict hexagonal architecture and multi-tenant family boundary isolation, Aletheia combines daily Christian devotionals, customizable educational frameworks (*Classical, Charlotte Mason, Traditional*), flexible lesson and routine planning, qualitative mastery tracking, legal attendance compliance, official transcripts generation, and complete data portability.

---

## 🏛️ Architecture & Tech Stack

Aletheia is structured as a high-performance **pnpm monorepo** with strict architectural boundaries:

```
aletheia/
├── apps/
│   ├── api/          # Backend API (NestJS 11 + Fastify adapter, Prisma ORM, PostgreSQL)
│   └── web/          # Frontend Web (Next.js 15 App Router, React 19, Tailwind CSS)
├── packages/
│   ├── contracts/    # Shared Domain Contracts, DTOs & Zod Schemas
│   ├── eslint-config/# Shared ESLint Configurations
│   └── tsconfig/     # Strict TypeScript Base Configurations
├── docs/             # Architecture specifications, domain models & ADRs
└── scripts/          # Architecture boundary verification & CI checks
```

- **Runtime & Language:** Node.js 22+ / 24, TypeScript 5.9 (with `exactOptionalPropertyTypes: true` & `noImplicitAny`).
- **Backend Framework:** NestJS with Fastify HTTP adapter.
- **Database & ORM:** PostgreSQL 16+ with Prisma ORM and automated migrations.
- **Frontend Framework:** Next.js 15 (App Router, Turbopack), React 19, Tailwind CSS, Lucide Icons.
- **Testing:** Vitest (contracts and frontend component testing), Jest (backend unit testing), Supertest (Fastify E2E testing), Playwright (E2E browser testing).

---

## 🌟 Core Modules & Capabilities

### 1. Identity, Families & Multi-Tenant RBAC
- Multi-tenant architecture ensuring complete data isolation per family.
- Secure JWT authentication with HTTP-only cookies.
- Role-Based Access Control (`GUARDIAN`, `EDUCATOR`, `STUDENT`) and co-educator invitations.

### 2. Learners & Educational Profiles
- Individual pedagogical profiles for each child (educational stages: *Early Years*, *Primary/Grammar*, *Middle/Logic*, *High/Rhetoric*).
- Learning styles, developmental adaptations, custom grades, and avatar customization.
- Global **Learner Focus Context** in the navigation shell.

### 3. Family Devotionals, Prayer Journal & Scripture Integration
- Daily family devotional journal with reflection notes and prayer requests.
- Integrated scripture lookup with chapter-and-verse referencing (YouVersion scripture engine).
- Interactive prayer request board with tags, active requests, and praise/answered prayer tracking.

### 4. Curriculum, Pedagogical Frameworks & Learning Objectives
- Pedagogical framework support:
  - **Classical Education:** Trivium stages, memory work, rhetoric.
  - **Charlotte Mason:** Living books, narration, habits, nature study.
  - **Traditional / Eclectic:** Standard subjects, competency milestones.
- Multi-year curriculum management by Academic Year and Subject catalogs.
- Hierarchical learning objective trees with mastery tracking.

### 5. Lesson Planning, Weekly Routine & Daily Schedule Agenda
- Flexible weekly routine planner by recurring time slots and days of the week.
- Interactive daily schedule checklist with multi-learner lesson assignment.
- Lesson rescheduling and duration logging without losing historical progress.

### 6. Learning Records, Qualitative Mastery & Evidence Portfolio
- Chronological learning journal for planned lessons and spontaneous life experiences.
- Non-punitive qualitative mastery progression (*Exposure*, *Developing*, *With Assistance*, *Autonomous*, *Mastered*).
- Character and habit practice observations.
- Multimedia evidence portfolio gallery (photos, audio narrations, video demonstrations, documents, certificates) with tagging and highlight favorites.

### 7. Compliance, Attendance Tracking & Academic Transcripts
- Legal attendance logging with customizable status (*Present*, *Excused*, *Unexcused*, *Holiday*, *Field Trip*, *Sick*).
- Regulatory compliance progress gauges against annual targets (e.g. 200 instructional days / 800 hours).
- Official Academic Transcript generator with multi-grading scale converter (*Mastery Qualitative*, *Letter Grades A–F*, *Numeric 0–10 / 0–100*, *Narrative*).
- Print-ready official layout with homeschool organization header and CSV data export.

### 8. Family Settings, Notification Center & Data Sovereignty
- Homeschool identity customization (Organization Name, Motto, Timezone, Pedagogical Defaults).
- In-app notification center and reminder preferences for devotionals and attendance.
- **Complete Family Data Backup Export (JSON):** 100% data sovereignty and GDPR/LGPD compliance allowing families to download their entire history in a single structured file.

---

## 🛡️ Pedagogical & Ethical Guardrails

Aletheia is intentionally designed around human dignity and the sacred nature of family education:
- **No Sibling Ranking / Comparisons:** Comparison graphs and sibling ranking are strictly prohibited across all services and components.
- **Non-Punitive Assessment:** Qualitative mastery and constructive growth feedback replace anxiety-inducing grading shaming.
- **Absolute Data Privacy:** Family educational records, children profiles, and devotional reflections are private and sovereign.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js:** `>= 22.0.0`
- **pnpm:** `>= 9.0.0` (`corepack enable pnpm`)
- **PostgreSQL:** `>= 16.0`

### 1. Installation

```bash
git clone git@github.com:Trinity-Grove/Aletheia.git
cd Aletheia
corepack pnpm install
```

### 2. Environment Setup

Configure your environment variables in `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aletheia?schema=public"
JWT_SECRET="your-secure-jwt-secret-key"
PORT=3333
NODE_ENV=development
```

### 3. Database Migration & Prisma Generation

```bash
# Generate Prisma Client
corepack pnpm prisma:generate

# Apply database migrations
corepack pnpm --filter @aletheia/api prisma:migrate
```

### 4. Running the Development Servers

```bash
# Run both Frontend (port 3000) and Backend (port 3333) in parallel:
corepack pnpm dev
```

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **API Backend:** [http://localhost:3333](http://localhost:3333)
- **Swagger API Documentation:** [http://localhost:3333/api/docs](http://localhost:3333/api/docs)

---

## 🧪 Testing & Quality Gates

The monorepo enforces 100% type safety and strict hexagonal architectural boundaries:

```bash
# Run complete verification quality gate (boundaries, lint, typecheck, unit, e2e, build)
corepack pnpm verify

# Architecture boundaries check
corepack pnpm check:boundaries

# Linting across all workspace packages
corepack pnpm lint

# TypeScript compilation checks
corepack pnpm typecheck

# Unit tests
corepack pnpm test

# API E2E tests (Fastify Supertest)
corepack pnpm --filter @aletheia/api test:e2e

# Web Frontend component tests (Vitest)
corepack pnpm --filter @aletheia/web test
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
