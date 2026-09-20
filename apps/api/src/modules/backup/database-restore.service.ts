import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { promisify } from 'node:util';
import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { databaseBackupMetadataSchema } from '@aletheia/contracts';
import { ENVIRONMENT, type Environment } from '../../platform/config/environment.js';
import { ObjectStorageService } from '../../platform/storage/object-storage.service.js';
import {
  DatabaseBackupService,
  parseDatabaseUrl,
  type DatabaseConnectionParams,
} from './database-backup.service.js';

const execFileAsync = promisify(execFile);

export type RestoreExecutor = (
  params: DatabaseConnectionParams,
  inputPath: string,
) => Promise<void>;

const defaultRestoreExecutor: RestoreExecutor = async (params, inputPath) => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
  };
  if (params.password) {
    env.PGPASSWORD = params.password;
  }

  const args = [
    '--clean',
    '--if-exists',
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
    inputPath,
  ];

  try {
    await execFileAsync('pg_restore', args, { env });
  } catch (error: unknown) {
    // pg_restore returns exit code 1 if there were non-fatal warnings
    // (such as "table does not exist" during initial --clean drop).
    // If stdout/stderr contains fatal error, we rethrow.
    const err = error as { code?: number; stderr?: string };
    if (err.stderr && err.stderr.toLowerCase().includes('fatal:')) {
      throw error;
    }
  }
};

export interface RestoreResult {
  success: boolean;
  key: string;
  durationMs: number;
  database: string;
}

@Injectable()
export class DatabaseRestoreService {
  private readonly logger = new Logger(DatabaseRestoreService.name);
  private readonly restoreExecutor: RestoreExecutor;

  constructor(
    @Inject(ENVIRONMENT) private readonly environment: Environment,
    private readonly objectStorage: ObjectStorageService,
    private readonly backupService: DatabaseBackupService,
    @Optional() restoreExecutor?: RestoreExecutor,
  ) {
    this.restoreExecutor = restoreExecutor ?? defaultRestoreExecutor;
  }

  async restoreFromBackup(
    specificKey?: string,
    targetDatabaseUrl?: string,
  ): Promise<RestoreResult> {
    const startTime = Date.now();

    let dumpKey = specificKey;
    if (!dumpKey) {
      const backups = await this.backupService.listBackups();
      if (backups.length === 0) {
        throw new NotFoundException('No backups found in object storage to restore.');
      }
      dumpKey = backups[0]!.key;
    }

    const metaKey = dumpKey.replace(/\.dump$/, '.meta.json');
    this.logger.log(`Fetching backup metadata for key: ${dumpKey}`);

    const metaBuffer = await this.objectStorage.getObjectBuffer(metaKey);
    const parsedMeta = JSON.parse(metaBuffer.toString('utf-8'));
    const metadata = databaseBackupMetadataSchema.parse(parsedMeta);

    this.logger.log(`Downloading dump file (${metadata.sizeBytes} bytes)...`);
    const dumpBuffer = await this.objectStorage.getObjectBuffer(dumpKey);

    const actualChecksum = createHash('sha256').update(dumpBuffer).digest('hex');
    if (actualChecksum.toLowerCase() !== metadata.sha256Checksum.toLowerCase()) {
      throw new Error(
        `Integrity check failed: checksum mismatch for ${dumpKey}. Expected ${metadata.sha256Checksum}, got ${actualChecksum}.`,
      );
    }

    const effectiveDbUrl = targetDatabaseUrl || this.environment.databaseUrl;
    const connParams = parseDatabaseUrl(effectiveDbUrl);

    this.logger.log(`Restoring into target database: ${connParams.database} on ${connParams.host}:${connParams.port}...`);

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aletheia-restore-'));
    const tempDumpPath = path.join(tempDir, metadata.fileName);

    try {
      await fs.writeFile(tempDumpPath, dumpBuffer);
      await this.restoreExecutor(connParams, tempDumpPath);
      const durationMs = Date.now() - startTime;

      this.logger.log(
        `Database restore completed successfully in ${durationMs}ms from ${dumpKey}`,
      );

      return {
        success: true,
        key: dumpKey,
        durationMs,
        database: connParams.database,
      };
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
