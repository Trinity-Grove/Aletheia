import * as fs from 'node:fs/promises';
import {
  DatabaseBackupService,
  parseDatabaseUrl,
  type DumpExecutor,
} from './database-backup.service.js';
import type { Environment } from '../../platform/config/environment.js';
import type { ObjectStorageService } from '../../platform/storage/object-storage.service.js';

describe('DatabaseBackupService', () => {
  const environment: Environment = {
    nodeEnv: 'development',
    logLevel: 'silent',
    databaseUrl: 'postgresql://test_user:secret_pass@db.example.com:5433/aletheia_prod?schema=public',
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

  describe('parseDatabaseUrl', () => {
    it('correctly extracts connection details from standard URL', () => {
      const conn = parseDatabaseUrl('postgresql://myuser:mypass@postgres.internal:5432/aletheiadb');
      expect(conn).toEqual({
        host: 'postgres.internal',
        port: '5432',
        user: 'myuser',
        password: 'mypass',
        database: 'aletheiadb',
      });
    });

    it('handles encoded characters and missing password', () => {
      const conn = parseDatabaseUrl('postgresql://user%40domain@localhost/simpledb');
      expect(conn).toEqual({
        host: 'localhost',
        port: '5432',
        user: 'user@domain',
        password: undefined,
        database: 'simpledb',
      });
    });
  });

  describe('runBackup & listBackups', () => {
    let mockStorage: jest.Mocked<ObjectStorageService>;
    let storageMap: Map<string, Buffer>;

    beforeEach(() => {
      storageMap = new Map();
      mockStorage = {
        putObject: jest.fn(async (key: string, body: Buffer | Uint8Array) => {
          storageMap.set(key, Buffer.isBuffer(body) ? body : Buffer.from(body));
        }),
        getObjectBuffer: jest.fn(async (key: string) => {
          const val = storageMap.get(key);
          if (!val) throw new Error(`Not found: ${key}`);
          return val;
        }),
        listObjects: jest.fn(async (prefix: string) => {
          return Array.from(storageMap.keys())
            .filter((k) => k.startsWith(prefix))
            .map((k) => ({
              key: k,
              size: storageMap.get(k)!.length,
              lastModified: new Date(),
            }));
        }),
        deleteObject: jest.fn(async (key: string) => {
          storageMap.delete(key);
        }),
      } as unknown as jest.Mocked<ObjectStorageService>;
    });

    it('executes dump, computes checksum, and uploads dump and metadata', async () => {
      const dumpContent = Buffer.from('FAKE-PG-DUMP-BINARY-CONTENT');
      const mockDumpExecutor: DumpExecutor = async (_params, outputPath) => {
        await fs.writeFile(outputPath, dumpContent);
      };

      const service = new DatabaseBackupService(
        environment,
        mockStorage,
        mockDumpExecutor,
      );

      const metadata = await service.runBackup();

      expect(metadata.database).toBe('aletheia_prod');
      expect(metadata.sizeBytes).toBe(dumpContent.length);
      expect(metadata.sha256Checksum).toHaveLength(64);
      expect(metadata.key).toContain('backups/postgres/');
      expect(metadata.fileName).toContain('.dump');

      expect(mockStorage.putObject).toHaveBeenCalledWith(
        metadata.key,
        dumpContent,
        'application/octet-stream',
      );

      const metaKey = metadata.key.replace(/\.dump$/, '.meta.json');
      expect(mockStorage.putObject).toHaveBeenCalledWith(
        metaKey,
        expect.any(Buffer),
        'application/json',
      );

      const listed = await service.listBackups();
      expect(listed).toHaveLength(1);
      expect(listed[0]!.key).toBe(metadata.key);
    });

    it('applies retention policy: deletes backups older than 28 days and thins out between 7-28 days', async () => {
      const service = new DatabaseBackupService(
        environment,
        mockStorage,
        async () => {},
      );

      const refDate = new Date('2026-09-20T03:00:00.000Z');
      const createMeta = (daysAgo: number, id: string) => {
        const createdAt = new Date(refDate.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
        const dateSegment = createdAt.slice(0, 10);
        const dumpKey = `backups/postgres/${dateSegment}/${id}.dump`;
        const metaKey = `backups/postgres/${dateSegment}/${id}.meta.json`;
        const meta = {
          key: dumpKey,
          fileName: `${id}.dump`,
          sizeBytes: 1000,
          sha256Checksum: '0000000000000000000000000000000000000000000000000000000000000000',
          createdAt,
          database: 'aletheia_prod',
          durationMs: 500,
        };
        storageMap.set(dumpKey, Buffer.from('dump'));
        storageMap.set(metaKey, Buffer.from(JSON.stringify(meta)));
      };

      // 3 recent backups (<= 7 days): kept
      createMeta(1, 'backup-1day');
      createMeta(3, 'backup-3days');
      createMeta(6, 'backup-6days');

      // 2 backups in the second week (e.g. 10 and 12 days ago): 1 kept, 1 deleted
      createMeta(10, 'backup-10days');
      createMeta(12, 'backup-12days');

      // 1 backup > 28 days ago (e.g. 35 days ago): deleted
      createMeta(35, 'backup-35days');

      const result = await service.applyRetentionPolicy(refDate);

      // Expecting 2 deleted: 1 from week 2 duplicate, 1 from > 28 days
      expect(result.deletedCount).toBe(2);

      const remaining = await service.listBackups();
      const remainingKeys = remaining.map((r) => r.fileName);
      expect(remainingKeys).toContain('backup-1day.dump');
      expect(remainingKeys).toContain('backup-3days.dump');
      expect(remainingKeys).toContain('backup-6days.dump');
      expect(remainingKeys).not.toContain('backup-35days.dump');
      // Exactly 4 remaining (3 recent + 1 weekly)
      expect(remaining).toHaveLength(4);
    });
  });
});
