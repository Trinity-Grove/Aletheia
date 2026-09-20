import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { promisify } from 'node:util';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  databaseBackupMetadataSchema,
  type DatabaseBackupMetadataDto,
} from '@aletheia/contracts';
import { ENVIRONMENT, type Environment } from '../../platform/config/environment.js';
import { ObjectStorageService } from '../../platform/storage/object-storage.service.js';

const execFileAsync = promisify(execFile);

export interface DatabaseConnectionParams {
  host: string;
  port: string;
  user: string;
  password?: string | undefined;
  database: string;
}

export type DumpExecutor = (
  params: DatabaseConnectionParams,
  outputPath: string,
) => Promise<void>;

export function parseDatabaseUrl(databaseUrl: string): DatabaseConnectionParams {
  const parsed = new URL(databaseUrl);
  return {
    host: parsed.hostname || 'localhost',
    port: parsed.port || '5432',
    user: decodeURIComponent(parsed.username || 'postgres'),
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'aletheia',
  };
}

const defaultDumpExecutor: DumpExecutor = async (params, outputPath) => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
  };
  if (params.password) {
    env.PGPASSWORD = params.password;
  }

  const args = [
    '-Fc',
    '--no-owner',
    '--no-privileges',
    '-h',
    params.host,
    '-p',
    params.port,
    '-U',
    params.user,
    '-d',
    params.database,
    '-f',
    outputPath,
  ];

  await execFileAsync('pg_dump', args, { env });
};

@Injectable()
export class DatabaseBackupService {
  private readonly logger = new Logger(DatabaseBackupService.name);
  private readonly dumpExecutor: DumpExecutor;

  constructor(
    @Inject(ENVIRONMENT) private readonly environment: Environment,
    private readonly objectStorage: ObjectStorageService,
    @Optional() dumpExecutor?: DumpExecutor,
  ) {
    this.dumpExecutor = dumpExecutor ?? defaultDumpExecutor;
  }

  @Cron('0 3 * * *')
  async handleScheduledBackup(): Promise<void> {
    if (this.environment.nodeEnv === 'test') {
      return;
    }
    if (!this.environment.objectStorage) {
      this.logger.warn(
        'Scheduled database backup skipped: Object storage is not configured.',
      );
      return;
    }

    try {
      this.logger.log('Starting scheduled database backup...');
      const metadata = await this.runBackup();
      this.logger.log(
        `Scheduled database backup completed: ${metadata.fileName} (${metadata.sizeBytes} bytes, ${metadata.durationMs}ms)`,
      );
    } catch (error) {
      this.logger.error(
        'Scheduled database backup failed',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async runBackup(): Promise<DatabaseBackupMetadataDto> {
    const startTime = Date.now();
    const connParams = parseDatabaseUrl(this.environment.databaseUrl);
    const now = new Date();
    const dateSegment = now.toISOString().slice(0, 10);
    const timeSegment = now.toISOString().replace(/[:.]/g, '-');
    const fileName = `${timeSegment}-${connParams.database}.dump`;
    const metaFileName = `${timeSegment}-${connParams.database}.meta.json`;
    const dumpKey = `backups/postgres/${dateSegment}/${fileName}`;
    const metaKey = `backups/postgres/${dateSegment}/${metaFileName}`;

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aletheia-backup-'));
    const tempDumpPath = path.join(tempDir, fileName);

    try {
      await this.dumpExecutor(connParams, tempDumpPath);

      const dumpBuffer = await fs.readFile(tempDumpPath);
      const sizeBytes = dumpBuffer.length;
      const sha256Checksum = createHash('sha256').update(dumpBuffer).digest('hex');
      const durationMs = Date.now() - startTime;

      const metadata: DatabaseBackupMetadataDto = {
        key: dumpKey,
        fileName,
        sizeBytes,
        sha256Checksum,
        createdAt: now.toISOString(),
        database: connParams.database,
        durationMs,
      };

      await this.objectStorage.putObject(dumpKey, dumpBuffer, 'application/octet-stream');

      const metaBuffer = Buffer.from(JSON.stringify(metadata, null, 2), 'utf-8');
      await this.objectStorage.putObject(metaKey, metaBuffer, 'application/json');

      await this.applyRetentionPolicy(now);

      return metadata;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  async listBackups(): Promise<DatabaseBackupMetadataDto[]> {
    const objects = await this.objectStorage.listObjects('backups/postgres/');
    const metaObjects = objects.filter((obj) => obj.key.endsWith('.meta.json'));

    const backups: DatabaseBackupMetadataDto[] = [];
    for (const obj of metaObjects) {
      try {
        const buffer = await this.objectStorage.getObjectBuffer(obj.key);
        const parsed = JSON.parse(buffer.toString('utf-8'));
        const validated = databaseBackupMetadataSchema.parse(parsed);
        backups.push(validated);
      } catch (err) {
        this.logger.warn(
          `Failed to parse backup metadata at key ${obj.key}: ${(err as Error).message}`,
        );
      }
    }

    return backups.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async applyRetentionPolicy(referenceDate = new Date()): Promise<{ deletedCount: number }> {
    const backups = await this.listBackups();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const fourWeeksMs = 28 * 24 * 60 * 60 * 1000;
    const refTime = referenceDate.getTime();

    let deletedCount = 0;
    const keptWeeklyKeys = new Set<string>();

    for (const backup of backups) {
      const backupTime = new Date(backup.createdAt).getTime();
      const ageMs = refTime - backupTime;

      // Rule 1: Backups newer than 7 days are always kept.
      if (ageMs <= sevenDaysMs) {
        continue;
      }

      // Rule 2: Older than 28 days are deleted.
      if (ageMs > fourWeeksMs) {
        await this.deleteBackupFiles(backup.key);
        deletedCount++;
        continue;
      }

      // Rule 3: Between 7 and 28 days, keep at most one backup per week.
      const weekKey = `${backup.createdAt.slice(0, 4)}-W${Math.floor(ageMs / (7 * 24 * 60 * 60 * 1000))}`;
      if (!keptWeeklyKeys.has(weekKey)) {
        keptWeeklyKeys.add(weekKey);
      } else {
        await this.deleteBackupFiles(backup.key);
        deletedCount++;
      }
    }

    return { deletedCount };
  }

  private async deleteBackupFiles(dumpKey: string): Promise<void> {
    const metaKey = dumpKey.replace(/\.dump$/, '.meta.json');
    await this.objectStorage.deleteObject(dumpKey).catch(() => {});
    await this.objectStorage.deleteObject(metaKey).catch(() => {});
  }
}
