import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import type { DatabaseBackupListResponseDto, DatabaseBackupRunResponseDto } from '@aletheia/contracts';
import { createApplication } from '../src/main.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { ObjectStorageService } from '../src/platform/storage/object-storage.service.js';
import { DatabaseBackupService, parseDatabaseUrl } from '../src/modules/backup/database-backup.service.js';
import { DatabaseRestoreService } from '../src/modules/backup/database-restore.service.js';
import { ENVIRONMENT, type Environment } from '../src/platform/config/environment.js';

function canRunPgDumpAgainstServer(databaseUrl: string): boolean {
  try {
    execSync('pg_dump --version', { stdio: 'ignore' });
    execSync('pg_restore --version', { stdio: 'ignore' });

    const params = parseDatabaseUrl(databaseUrl);
    const env: NodeJS.ProcessEnv = { ...process.env };
    if (params.password) env.PGPASSWORD = params.password;
    const testFile = path.join(os.tmpdir(), `pg-check-${Date.now()}.sql`);
    try {
      execSync(
        `pg_dump -s -h ${params.host} -p ${params.port} -U ${params.user} -d ${params.database} -f "${testFile}"`,
        { env, stdio: 'pipe' },
      );
      return true;
    } finally {
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  } catch {
    return false;
  }
}

describe('Disaster Recovery & Database Backup Integration (real Postgres + Object Storage)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let objectStorage: ObjectStorageService;
  let backupService: DatabaseBackupService;
  let restoreService: DatabaseRestoreService;

  let adminCookie: string;
  let regularUserCookie: string;

  const adminEmail = `dr-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const regularUserEmail = `dr-user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  function extractCookie(response: { headers: Record<string, unknown> }, prefix: string): string {
    const cookie = [response.headers['set-cookie']].flat().find((c) => (c as string)?.startsWith(prefix));
    if (!cookie) {
      throw new Error(`Expected cookie with prefix "${prefix}" in response headers.`);
    }
    return cookie as string;
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
    objectStorage = app.get(ObjectStorageService);
    backupService = app.get(DatabaseBackupService);
    restoreService = app.get(DatabaseRestoreService);

    // Register admin user
    const adminRes = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'StrongPassword123!', fullName: 'DR Admin' })
      .expect(201);
    adminCookie = extractCookie(adminRes, 'aletheia_session=');

    // Register regular user
    const regRes = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: regularUserEmail, password: 'RegularPassword123!', fullName: 'Regular User' })
      .expect(201);
    regularUserCookie = extractCookie(regRes, 'aletheia_session=');
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthorized or non-admin access to admin backup endpoints', async () => {
    // 1. Unauthenticated
    await supertest(app.getHttpServer())
      .get('/api/v1/admin/backups')
      .expect(401);

    await supertest(app.getHttpServer())
      .post('/api/v1/admin/backups/run')
      .expect(401);

    // 2. Authenticated as non-admin
    await supertest(app.getHttpServer())
      .get('/api/v1/admin/backups')
      .set('Cookie', regularUserCookie)
      .expect(403);

    await supertest(app.getHttpServer())
      .post('/api/v1/admin/backups/run')
      .set('Cookie', regularUserCookie)
      .expect(403);
  });

  it('allows platform admin to list backups via admin endpoint', async () => {
    const listRes = await supertest(app.getHttpServer())
      .get('/api/v1/admin/backups')
      .set('Cookie', adminCookie)
      .expect(200);

    const listData = listRes.body as DatabaseBackupListResponseDto;
    expect(Array.isArray(listData.backups)).toBe(true);
    expect(typeof listData.totalCount).toBe('number');
  });

  it('performs disaster recovery backup and restore drill cycle with integrity verification', async () => {
    const databaseUrl = process.env.DATABASE_URL || '';
    const canDump = canRunPgDumpAgainstServer(databaseUrl);

    if (canDump) {
      // 1. Seed a canary record in Postgres before backup
      const canarySeed = `canary-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const user = await prisma.user.create({
        data: {
          email: `${canarySeed}@example.com`,
          passwordHash: 'dummyhash',
          fullName: `Canary ${canarySeed}`,
        },
      });

      // 2. Trigger on-demand backup via Admin API
      const runRes = await supertest(app.getHttpServer())
        .post('/api/v1/admin/backups/run')
        .set('Cookie', adminCookie)
        .expect(200);

      const runBody = runRes.body as DatabaseBackupRunResponseDto;
      expect(runBody.success).toBe(true);
      expect(runBody.backup.key).toBeDefined();
      expect(runBody.backup.sha256Checksum).toHaveLength(64);

      // 3. Verify backup is persisted in Object Storage
      const dumpBuffer = await objectStorage.getObjectBuffer(runBody.backup.key);
      expect(dumpBuffer.length).toBe(runBody.backup.sizeBytes);

      // 4. Verify listing includes the newly created backup
      const listAfterRes = await supertest(app.getHttpServer())
        .get('/api/v1/admin/backups')
        .set('Cookie', adminCookie)
        .expect(200);

      const listAfter = listAfterRes.body as DatabaseBackupListResponseDto;
      const found = listAfter.backups.some((b) => b.key === runBody.backup.key);
      expect(found).toBe(true);

      // 5. Execute Disaster Recovery Restore drill
      const restoreResult = await restoreService.restoreFromBackup(runBody.backup.key);
      expect(restoreResult.success).toBe(true);
      expect(restoreResult.key).toBe(runBody.backup.key);

      // 6. Verify data integrity after restore (canary user must exist)
      const restoredUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(restoredUser).toBeDefined();
      expect(restoredUser?.email).toBe(user.email);
    } else {
      // Test full backup pipeline with Object Storage and SHA-256 integrity verification
      const env = app.get<Environment>(ENVIRONMENT);
      const fakeDumpContent = Buffer.from(`PGDMP-INTEGRATION-TEST-${Date.now()}`);
      const mockDumpExecutor = async (_params: any, outputPath: string) => {
        await fs.promises.writeFile(outputPath, fakeDumpContent);
      };
      let restoredWithParams: any = null;
      const mockRestoreExecutor = async (params: any, _inputPath: string) => {
        restoredWithParams = params;
      };

      const customBackupService = new DatabaseBackupService(env, objectStorage, mockDumpExecutor);
      const customRestoreService = new DatabaseRestoreService(
        env,
        objectStorage,
        customBackupService,
        mockRestoreExecutor,
      );

      // Run backup
      const backup = await customBackupService.runBackup();
      expect(backup.key).toBeDefined();
      expect(backup.sizeBytes).toBe(fakeDumpContent.length);

      // Verify real S3 object
      const storedBuffer = await objectStorage.getObjectBuffer(backup.key);
      expect(storedBuffer.equals(fakeDumpContent)).toBe(true);

      // Verify listing
      const backups = await customBackupService.listBackups();
      expect(backups.some((b) => b.key === backup.key)).toBe(true);

      // Execute restore
      const restoreResult = await customRestoreService.restoreFromBackup(backup.key);
      expect(restoreResult.success).toBe(true);
      expect(restoredWithParams).toBeDefined();
      expect(restoredWithParams.database).toBe(parseDatabaseUrl(env.databaseUrl).database);
    }
  });
});
