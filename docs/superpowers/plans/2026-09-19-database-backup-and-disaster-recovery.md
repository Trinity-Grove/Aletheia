# Database Backup & Disaster Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement automated, cloud-agnostic PostgreSQL backups directly from `@aletheia/api` to S3-compatible object storage with retention, administrative controls, disaster recovery restore script, and verified DR Drill test suite.

**Architecture:** A native `@aletheia/api` module (`BackupModule`) using `@nestjs/schedule` to run daily dumps with `pg_dump -Fc` (added to Alpine runtime container), SHA-256 integrity verification, S3 streaming upload, retention pruning (7 daily, 4 weekly), on-demand admin endpoints, and a standalone restore tool for disaster recovery.

**Tech Stack:** NestJS 11, TypeScript 5.9, `@nestjs/schedule`, `@aws-sdk/client-s3`, `postgresql-client` (`pg_dump`/`pg_restore`), Zod, Jest.

**Spec:** `docs/superpowers/specs/2026-09-19-database-backup-and-disaster-recovery-design.md`

## Global Constraints
- Zero AI attribution trailers in commits/comments (no Co-Authored-By, no generated-by).
- Portability: All backup and restore functionality must work identically on local Docker, Railway, VPS, or Kubernetes using only `DATABASE_URL` and `S3_*` variables.
- Security: Dump streams and files must never expose passwords in logs; process execution must use environment variables (`PGPASSWORD`) rather than CLI flags.
- Immutability & Integrity: Every backup produces a `.dump` and `.meta.json` with computed SHA-256 checksum.

---

### Task 1: Contracts and S3 Client Operations (`packages/contracts` and `apps/api`)

**Files:**
- Create: `packages/contracts/src/backup.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `apps/api/src/platform/storage/object-storage.service.ts`
- Test: `packages/contracts/tests/backup.test.ts`
- Test: `apps/api/src/platform/storage/object-storage.service.spec.ts`

**Interfaces:**
- Consumes: `@aws-sdk/client-s3` (`PutObjectCommand`, `ListObjectsV2Command`, `GetObjectCommand`).
- Produces:
  - `backupMetadataSchema`, `BackupMetadataDto`
  - `backupListResponseSchema`, `BackupListResponseDto`
  - `backupRunResponseSchema`, `BackupRunResponseDto`
  - `ObjectStorageService.putObject(key, buffer, contentType)`
  - `ObjectStorageService.listObjects(prefix)`
  - `ObjectStorageService.getObjectBuffer(key)`

- [ ] **Step 1: Write failing contracts test in `packages/contracts/tests/backup.test.ts`**
- [ ] **Step 2: Implement schemas in `packages/contracts/src/backup.ts` and export in `index.ts`**
- [ ] **Step 3: Build contracts and verify contracts tests pass**
- [ ] **Step 4: Add `putObject`, `listObjects`, and `getObjectBuffer` to `ObjectStorageService` with unit tests**
- [ ] **Step 5: Run tests: `pnpm --filter @aletheia/contracts test && pnpm --filter @aletheia/api test src/platform/storage/`**
- [ ] **Step 6: Commit: `feat(contracts): add database backup schemas and extend object storage service`**

---

### Task 2: Dockerfile & Database Backup Service (`apps/api`)

**Files:**
- Modify: `apps/api/Dockerfile`
- Create: `apps/api/src/modules/backup/database-backup.service.ts`
- Create: `apps/api/src/modules/backup/database-backup.service.spec.ts`

**Interfaces:**
- Consumes: `EnvironmentConfig`, `ObjectStorageService`, `DATABASE_URL`.
- Produces:
  - `DatabaseBackupService.runBackup(): Promise<BackupMetadataDto>`
  - `DatabaseBackupService.listBackups(): Promise<BackupMetadataDto[]>`
  - `DatabaseBackupService.applyRetentionPolicy(): Promise<{ deletedCount: number }>`
  - Scheduled cron task: `@Cron('0 3 * * *')`

- [ ] **Step 1: Update `apps/api/Dockerfile` to install `postgresql-client` in the runtime stage**
- [ ] **Step 2: Write failing unit tests in `database-backup.service.spec.ts` testing connection extraction, dump mock, SHA-256 calculation, and retention filtering (7 daily / 4 weekly)**
- [ ] **Step 3: Implement `DatabaseBackupService` with safe subprocess spawn of `pg_dump -Fc` and S3 upload**
- [ ] **Step 4: Run unit tests and verify they pass: `pnpm --filter @aletheia/api test database-backup.service.spec.ts`**
- [ ] **Step 5: Commit: `feat(backup): add DatabaseBackupService with pg_dump and retention policy`**

---

### Task 3: Database Restore Service & CLI Tool (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/backup/database-restore.service.ts`
- Create: `apps/api/src/modules/backup/database-restore.service.spec.ts`
- Create: `apps/api/src/scripts/restore-database.ts`
- Modify: `apps/api/package.json`

**Interfaces:**
- Consumes: `ObjectStorageService`, `DatabaseBackupService`.
- Produces:
  - `DatabaseRestoreService.restoreFromBackup(key?: string, targetDatabaseUrl?: string): Promise<{ success: boolean; key: string; durationMs: number }>`
  - CLI script: `pnpm run db:restore [key]`

- [ ] **Step 1: Write failing unit tests in `database-restore.service.spec.ts` testing checksum validation and `pg_restore` execution**
- [ ] **Step 2: Implement `DatabaseRestoreService` with checksum verification and safe subprocess spawn of `pg_restore --clean --if-exists --no-owner --no-privileges`**
- [ ] **Step 3: Implement CLI script `apps/api/src/scripts/restore-database.ts` with CLI arguments parsing and exit code reporting**
- [ ] **Step 4: Add `"db:restore": "node dist/scripts/restore-database.js"` to `apps/api/package.json`**
- [ ] **Step 5: Run tests and verify: `pnpm --filter @aletheia/api test database-restore.service.spec.ts`**
- [ ] **Step 6: Commit: `feat(backup): add DatabaseRestoreService and CLI restore script`**

---

### Task 4: Admin Backup Controller & Module Integration (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/backup/admin-backup.controller.ts`
- Create: `apps/api/src/modules/backup/backup.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/src/modules/backup/admin-backup.controller.spec.ts`

**Interfaces:**
- Consumes: `DatabaseBackupService`, `JwtAuthGuard`, `PlatformAdminGuard`.
- Produces:
  - `GET /api/v1/admin/backups` -> returns `BackupMetadataDto[]`
  - `POST /api/v1/admin/backups/run` -> executes on-demand backup and returns `BackupRunResponseDto`
  - `BackupModule` wired into `AppModule`

- [ ] **Step 1: Write unit tests in `admin-backup.controller.spec.ts` ensuring platform admin authorization and correct response formats**
- [ ] **Step 2: Implement `AdminBackupController` with `@UseGuards(JwtAuthGuard, PlatformAdminGuard)`**
- [ ] **Step 3: Create `BackupModule` and register in `AppModule`**
- [ ] **Step 4: Run module tests and typecheck: `pnpm --filter @aletheia/api test admin-backup.controller.spec.ts && pnpm --filter @aletheia/api typecheck`**
- [ ] **Step 5: Commit: `feat(backup): add AdminBackupController and wire BackupModule into AppModule`**

---

### Task 5: Disaster Recovery Drill Integration Test & Runbooks (`apps/api` & `docs/runbooks`)

**Files:**
- Create: `apps/api/test/disaster-recovery.integration-spec.ts`
- Create: `docs/runbooks/disaster-recovery.md`
- Create: `docs/runbooks/database-migration-rollback.md`

**Interfaces:**
- Consumes: Real PostgreSQL database, real/mock object storage.
- Produces:
  - End-to-end integration test verifying backup creation, storage persistence, and full restore into a clean test database.
  - Comprehensive operational runbooks with RPO/RTO guidance.

- [ ] **Step 1: Implement `disaster-recovery.integration-spec.ts` testing the complete roundtrip (seed -> backup -> restore -> verify)**
- [ ] **Step 2: Create `docs/runbooks/disaster-recovery.md` documenting emergency restore steps, RPO/RTO, and troubleshooting**
- [ ] **Step 3: Create `docs/runbooks/database-migration-rollback.md` documenting safe migration practices and roll-forward/rollback procedures**
- [ ] **Step 4: Run full test suites across repo: contracts, api, web**
- [ ] **Step 5: Commit: `test(backup): add disaster recovery drill integration test and operational runbooks (issue #30)`**
