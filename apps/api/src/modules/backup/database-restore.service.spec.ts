import { createHash } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { DatabaseRestoreService, type RestoreExecutor } from './database-restore.service.js';
import type { DatabaseBackupService } from './database-backup.service.js';
import type { Environment } from '../../platform/config/environment.js';
import type { ObjectStorageService } from '../../platform/storage/object-storage.service.js';
import type { DatabaseBackupMetadataDto } from '@aletheia/contracts';

describe('DatabaseRestoreService', () => {
  const environment: Environment = {
    nodeEnv: 'test',
    logLevel: 'silent',
    databaseUrl: 'postgresql://restore_user:restore_pass@localhost:5432/aletheia_target?schema=public',
    redisUrl: null,
    jwtSecret: 'test_jwt_secret_1234567890',
    learnerSessionJwtSecret: 'test_learner_jwt_secret_1234567890',
    mfaEncryptionKey: '0000000000000000000000000000000000000000000000000000000000000000',
    corsOrigins: ['http://localhost:3000'],
    platformAdminEmails: [],
    platformAdminDomains: [],
    resendApiKey: null,
    mailFromAddress: 'test@example.com',
    webOrigin: 'http://localhost:3000',
    objectStorage: {
      endpoint: 'https://s3.example.com',
      accessKey: 'key',
      secretKey: 'secret',
      bucket: 'aletheia-backups',
    },
  };

  let mockStorage: jest.Mocked<ObjectStorageService>;
  let mockBackupService: jest.Mocked<DatabaseBackupService>;
  let mockExecutor: jest.Mock;
  let service: DatabaseRestoreService;

  const validDumpBuffer = Buffer.from('RESTORE-TEST-DUMP-CONTENT');
  const validChecksum = createHash('sha256').update(validDumpBuffer).digest('hex');

  const sampleMeta: DatabaseBackupMetadataDto = {
    key: 'backups/postgres/2026-09-20/test.dump',
    fileName: 'test.dump',
    sizeBytes: validDumpBuffer.length,
    sha256Checksum: validChecksum,
    createdAt: '2026-09-20T03:00:00.000Z',
    database: 'aletheia_source',
    durationMs: 400,
  };

  beforeEach(() => {
    mockStorage = {
      getObjectBuffer: jest.fn(async (key: string) => {
        if (key.endsWith('.meta.json')) {
          return Buffer.from(JSON.stringify(sampleMeta));
        }
        if (key.endsWith('.dump')) {
          return validDumpBuffer;
        }
        throw new Error(`Not found: ${key}`);
      }),
    } as unknown as jest.Mocked<ObjectStorageService>;

    mockBackupService = {
      listBackups: jest.fn(async () => [sampleMeta]),
    } as unknown as jest.Mocked<DatabaseBackupService>;

    mockExecutor = jest.fn(async () => {});

    service = new DatabaseRestoreService(
      environment,
      mockStorage,
      mockBackupService,
      mockExecutor as RestoreExecutor,
    );
  });

  it('restores latest backup when no key is specified', async () => {
    const result = await service.restoreFromBackup();

    expect(result.success).toBe(true);
    expect(result.key).toBe(sampleMeta.key);
    expect(result.database).toBe('aletheia_target');

    expect(mockExecutor).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'localhost',
        port: '5432',
        user: 'restore_user',
        password: 'restore_pass',
        database: 'aletheia_target',
      }),
      expect.stringContaining('test.dump'),
    );
  });

  it('throws NotFoundException when no backups exist to restore', async () => {
    mockBackupService.listBackups.mockResolvedValueOnce([]);

    await expect(service.restoreFromBackup()).rejects.toThrow(NotFoundException);
  });

  it('throws an error if sha256 checksum does not match metadata', async () => {
    mockStorage.getObjectBuffer.mockImplementation(async (key: string) => {
      if (key.endsWith('.meta.json')) {
        return Buffer.from(JSON.stringify({ ...sampleMeta, sha256Checksum: '0000000000000000000000000000000000000000000000000000000000000000' }));
      }
      return validDumpBuffer;
    });

    await expect(service.restoreFromBackup()).rejects.toThrow(
      'Integrity check failed: checksum mismatch',
    );
    expect(mockExecutor).not.toHaveBeenCalled();
  });

  it('restores to a custom target database URL if supplied', async () => {
    const customUrl = 'postgresql://dr_user:dr_pass@dr-host:5439/aletheia_dr';
    const result = await service.restoreFromBackup(sampleMeta.key, customUrl);

    expect(result.success).toBe(true);
    expect(result.database).toBe('aletheia_dr');

    expect(mockExecutor).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'dr-host',
        port: '5439',
        user: 'dr_user',
        password: 'dr_pass',
        database: 'aletheia_dr',
      }),
      expect.any(String),
    );
  });
});
