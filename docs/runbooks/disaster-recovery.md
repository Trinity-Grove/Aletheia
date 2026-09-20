# Operational Runbook: Disaster Recovery & Database Restoration

**Document Version:** 1.0.0  
**Effective Date:** 2026-09-20  
**System:** Aletheia API (`@aletheia/api`)  
**Scope:** PostgreSQL Database Recovery and High Availability Continuity  

---

## 1. Executive Summary & Recovery Objectives

This operational runbook defines the emergency response protocol for restoring the Aletheia PostgreSQL database in the event of catastrophic hardware failure, provider outage, data corruption, or accidental deletion.

### Objectives
- **RPO (Recovery Point Objective):** 
  - Automated Daily Backups: $\le$ 24 hours (executed daily at 03:00 UTC).
  - Pre-Deployment / High-Risk Operations: $\le$ 5 minutes (via on-demand trigger `POST /api/v1/admin/backups/run`).
- **RTO (Recovery Time Objective):** $\le$ 15 minutes to complete restore and resume application traffic.
- **Portability:** Restorations can be performed against any standard PostgreSQL 15+ target (Railway, AWS RDS, Supabase, Neon, self-hosted Docker/VPS) using only standard credentials.

---

## 2. Backup Architecture & Storage Format

Backups are executed natively inside `@aletheia/api` and written to S3-compatible Object Storage (e.g. Tigris / AWS S3 / MinIO).

Each backup generates two immutable artifacts under the key prefix `backups/postgres/YYYY-MM-DD/`:
1. **Binary Dump (`.dump`)**:
   - Generated with `pg_dump -Fc --no-owner --no-privileges`.
   - Compressed, transactionally consistent custom archive format.
2. **Metadata Descriptor (`.meta.json`)**:
   - JSON envelope containing:
     - `key`: S3 key of the `.dump` file.
     - `fileName`: Name of the archive.
     - `sizeBytes`: Size in bytes.
     - `sha256Checksum`: 64-character SHA-256 hash of the `.dump` file.
     - `createdAt`: ISO 8601 UTC timestamp.
     - `database`: Name of the origin database.
     - `durationMs`: Total duration of the dump execution.

### Retention Policy
- **Daily Retention:** Last 7 daily backups are retained unconditionally.
- **Weekly Retention:** For backups older than 7 days, 1 backup per week is retained up to 4 weeks (28 days).
- **Expiration:** Backups older than 28 days are automatically purged during the daily backup run.

---

## 3. Emergency Restoration Procedure

### 3.1. Prerequisites
Ensure the operator or automation runner has:
- Network access to the target PostgreSQL instance.
- Valid environment variables configured:
  ```bash
  DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
  S3_ENDPOINT="https://fly.storage.tigris.dev" # or your S3 endpoint
  S3_ACCESS_KEY="<access-key>"
  S3_SECRET_KEY="<secret-key>"
  S3_BUCKET="<bucket-name>"
  ```
- `postgresql-client` installed on the runner host (or run inside the Docker container).

---

### 3.2. Automated Restoration via CLI Tool (Recommended)

The application provides an automated, self-validating restore command that downloads the target backup, checks SHA-256 integrity, and applies `pg_restore`.

#### A. Restore Latest Available Backup
To restore the most recent backup stored in Object Storage to the database specified in `DATABASE_URL`:
```bash
pnpm --filter @aletheia/api db:restore
```

#### B. Restore a Specific Backup Key
To restore a specific snapshot (e.g. point-in-time recovery before an incident):
```bash
pnpm --filter @aletheia/api db:restore backups/postgres/2026-09-20/2026-09-20T03-00-00-000Z-aletheia.dump
```

#### C. Restore to a Different / Isolated Target Database
Set `TARGET_DATABASE_URL` to prevent overriding the main database:
```bash
TARGET_DATABASE_URL="postgresql://user:pass@dr-host:5432/dr_database" pnpm --filter @aletheia/api db:restore
```

---

### 3.3. Manual Restoration Procedure (Emergency Fallback)

If the Node.js runtime or API container is unavailable, the database can be restored directly with standard UNIX and AWS CLI tools:

1. **List available backups in Object Storage:**
   ```bash
   aws s3 ls s3://$S3_BUCKET/backups/postgres/ --recursive --endpoint-url $S3_ENDPOINT
   ```

2. **Download the target `.dump` and `.meta.json` files:**
   ```bash
   aws s3 cp s3://$S3_BUCKET/backups/postgres/2026-09-20/backup.dump ./backup.dump --endpoint-url $S3_ENDPOINT
   aws s3 cp s3://$S3_BUCKET/backups/postgres/2026-09-20/backup.meta.json ./backup.meta.json --endpoint-url $S3_ENDPOINT
   ```

3. **Verify SHA-256 Checksum:**
   ```bash
   # Linux:
   sha256sum backup.dump
   # Compare output with the "sha256Checksum" value in backup.meta.json
   ```

4. **Execute `pg_restore`:**
   ```bash
   export PGPASSWORD="<database_password>"
   pg_restore \
     --host="<database_host>" \
     --port="<database_port>" \
     --username="<database_user>" \
     --dbname="<database_name>" \
     --clean \
     --if-exists \
     --no-owner \
     --no-privileges \
     backup.dump
   ```

---

## 4. Post-Restoration Verification & Smoke Checks

After restoration completes, immediately run the post-restore verification protocol:

1. **Apply Any Pending Prisma Migrations:**
   ```bash
   pnpm --filter @aletheia/api prisma migrate deploy
   ```
2. **Execute Health Checks:**
   ```bash
   curl -i https://<api-domain>/api/v1/health/ready
   ```
   Confirm all dependency probes (Database, Object Storage) report `"status": "healthy"`.
3. **Inspect Core Table Counts via SQL:**
   ```sql
   SELECT count(*) FROM "User";
   SELECT count(*) FROM "Family";
   SELECT count(*) FROM "Learner";
   SELECT count(*) FROM "ConsentRecord";
   ```
4. **Log into Admin Portal:**
   Verify administrative access at `https://<web-domain>/admin/catalog` or `/admin/users`.

---

## 5. Troubleshooting & Failure Recovery

| Symptom | Cause | Remediation |
|---|---|---|
| `Integrity check failed: checksum mismatch` | Incomplete download or file corruption in S3. | Do not restore. Re-download the file. If persistent, choose the preceding backup snapshot. |
| `FATAL: password authentication failed` | Invalid credentials in `DATABASE_URL`. | Check `DATABASE_URL` password encoding (special characters must be URL-encoded). |
| `pg_restore: error: input file does not appear to be a valid archive` | Corrupted dump or plain text SQL dumped instead of custom `-Fc` format. | Verify that the file was created using `pg_dump -Fc`. |
| `pg_restore: warning: errors ignored on restore: N` | Expected when dropping tables with `--clean --if-exists` on an empty database. | Safe to ignore if exit status is non-fatal and schema exists. |

---

## 6. Disaster Recovery Drill Schedule

To ensure operational preparedness:
- **Frequency:** Drills must be conducted quarterly in staging or in an isolated database environment.
- **Drill Steps:**
  1. Trigger an on-demand backup using `POST /api/v1/admin/backups/run`.
  2. Create a clean temporary PostgreSQL database.
  3. Run `pnpm --filter @aletheia/api db:restore <key>` pointing to the temporary database.
  4. Run automated test suite against the restored database to confirm 100% integrity.
