# Operational Runbook: Database Migration, Roll-Forward & Rollback Procedures

**Document Version:** 1.0.0  
**Effective Date:** 2026-09-20  
**System:** Aletheia API (`@aletheia/api`)  
**Scope:** Prisma ORM Schema Migrations and Rollback Contingencies  

---

## 1. Principles of Safe Database Evolution

All relational schema changes in Aletheia are managed via Prisma Migrations (`prisma/migrations/*`). To ensure high availability and zero data loss, the project adheres to the following principles:

1. **Expand and Contract Pattern:** Destructive schema alterations (dropping columns, renaming columns, changing nullability to required) must never occur in a single deploy. Changes must be phased across multiple releases:
   - **Phase 1 (Expand):** Add new optional columns/tables; deploy code that writes to both old and new columns.
   - **Phase 2 (Backfill):** Populate historical data asynchronously.
   - **Phase 3 (Contract):** Deploy code that reads only the new structure; deprecate and remove old columns.
2. **Pre-Migration Snapshot:** Before applying any non-trivial migration to production, an on-demand database backup must be captured (`POST /api/v1/admin/backups/run`) to guarantee an RPO of < 5 minutes.
3. **Idempotence & Forward Compatibility:** Every migration script must be idempotent and non-blocking where possible.

---

## 2. Pre-Migration Checklist

Before triggering a production deployment that contains database migrations:

- [ ] **Review Migration SQL:** Inspect `prisma/migrations/<migration_name>/migration.sql` for:
  - Exclusive table locks (e.g. `ALTER TABLE ... ADD CONSTRAINT` without `NOT VALID`).
  - Heavy index creation without `CONCURRENTLY`.
  - Unintended `DROP COLUMN` or `DROP TABLE` statements.
- [ ] **Trigger Pre-Migration Backup:**
  Trigger an immediate backup via the admin API or CLI:
  ```bash
  # Via Admin API
  curl -X POST https://api.aletheia.app/api/v1/admin/backups/run \
    -H "Authorization: Bearer <ADMIN_JWT_OR_SESSION>"
  ```
  Confirm HTTP 200 response with generated `fileName` and `sha256Checksum`.
- [ ] **Verify Staging Execution:** Confirm the migration applied cleanly in the staging environment.

---

## 3. Standard Migration Deployment

Migrations are deployed automatically as part of the container start script or CI/CD pipeline:

```bash
pnpm --filter @aletheia/api prisma migrate deploy
```

To verify migration status:
```bash
pnpm --filter @aletheia/api prisma migrate status
```

---

## 4. Rollback Protocols

In the event that a migration fails or causes application degradation, execute the appropriate rollback protocol below.

### Scenario A: Migration Fails During `migrate deploy`
If a migration fails mid-execution, Prisma marks the migration as failed in the `_prisma_migrations` table and halts the deployment.

1. **Inspect Migration Error Logs:**
   Identify the offending SQL statement from the deployment logs.
2. **Resolve the Underlying Cause:**
   - If caused by a transient lock conflict or connection timeout, retry the deployment.
   - If caused by bad data violating a constraint (e.g. `NOT NULL` on a column containing nulls), resolve the violating data via `psql`.
3. **Mark Migration as Resolved (if repaired manually):**
   ```bash
   pnpm --filter @aletheia/api prisma migrate resolve --applied "<migration_name>"
   ```
   Or if rolling back the migration SQL manually:
   ```bash
   pnpm --filter @aletheia/api prisma migrate resolve --rolled-back "<migration_name>"
   ```

---

### Scenario B: Code Rollback Required (Non-Destructive Migration)
If a migration succeeded (e.g. added an optional column or index), but the application code contains a defect requiring a rollback to the previous container image:

1. **Revert Application Deployment:**
   Redeploy the previous stable Docker image / Railway commit.
2. **Leave Schema Intact:**
   Because migrations adhere to the Expand/Contract pattern, old code versions can safely run against a database that has additional optional columns or tables.
3. **Schedule Clean-Up:**
   Address the application bug in code before retrying deployment.

---

### Scenario C: Destructive Migration Rollback (Data Recovery)
If a migration inadvertently corrupted data, dropped vital structures, or created an irrecoverable state:

1. **Halt Application Traffic:**
   Place the application in maintenance mode or scale API instances to 0 to prevent incoming writes.
2. **Locate Pre-Migration Backup:**
   Obtain the key of the backup taken immediately prior to deployment:
   ```bash
   pnpm --filter @aletheia/api db:restore
   ```
3. **Execute Point-in-Time Database Restoration:**
   Follow the [Disaster Recovery Runbook](file:///C:/Users/wende/Projects/Covenant-Grove/Aletheia/docs/runbooks/disaster-recovery.md):
   ```bash
   pnpm --filter @aletheia/api db:restore <pre-migration-backup-key>
   ```
4. **Redeploy Previous Application Version:**
   Point deployment to the previous stable release commit.
5. **Resume Traffic & Post-Incident Review:**
   Perform sanity checks and conduct a post-mortem.
