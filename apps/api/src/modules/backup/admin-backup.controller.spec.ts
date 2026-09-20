import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import {
  databaseBackupListResponseSchema,
  databaseBackupRunResponseSchema,
  type DatabaseBackupMetadataDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, PlatformAdminGuard } from '../../platform/auth/index.js';
import { AdminBackupController } from './admin-backup.controller.js';
import type { DatabaseBackupService } from './database-backup.service.js';

describe('AdminBackupController', () => {
  let controller: AdminBackupController;
  let mockBackupService: jest.Mocked<DatabaseBackupService>;

  const sampleBackup: DatabaseBackupMetadataDto = {
    key: 'backups/postgres/2026-09-20/2026-09-20T03-00-00-000Z-aletheia.dump',
    fileName: '2026-09-20T03-00-00-000Z-aletheia.dump',
    sizeBytes: 1048576,
    sha256Checksum: 'a'.repeat(64),
    createdAt: '2026-09-20T03:00:00.000Z',
    database: 'aletheia',
    durationMs: 1250,
  };

  beforeEach(() => {
    mockBackupService = {
      listBackups: jest.fn(),
      runBackup: jest.fn(),
    } as unknown as jest.Mocked<DatabaseBackupService>;

    controller = new AdminBackupController(mockBackupService);
  });

  it('has JwtAuthGuard and PlatformAdminGuard applied to the controller class', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AdminBackupController);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(PlatformAdminGuard);
  });

  describe('GET /admin/backups', () => {
    it('returns the list of backups and totalCount conforming to databaseBackupListResponseSchema', async () => {
      mockBackupService.listBackups.mockResolvedValue([sampleBackup]);

      const result = await controller.listBackups();

      expect(mockBackupService.listBackups).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        backups: [sampleBackup],
        totalCount: 1,
      });

      const parsed = databaseBackupListResponseSchema.safeParse(result);
      expect(parsed.success).toBe(true);
    });

    it('returns empty list when no backups exist', async () => {
      mockBackupService.listBackups.mockResolvedValue([]);

      const result = await controller.listBackups();

      expect(result).toEqual({
        backups: [],
        totalCount: 0,
      });
      expect(databaseBackupListResponseSchema.safeParse(result).success).toBe(true);
    });
  });

  describe('POST /admin/backups/run', () => {
    it('triggers on-demand backup and returns response conforming to databaseBackupRunResponseSchema', async () => {
      mockBackupService.runBackup.mockResolvedValue(sampleBackup);

      const result = await controller.runBackup();

      expect(mockBackupService.runBackup).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.message).toContain(sampleBackup.fileName);
      expect(result.backup).toEqual(sampleBackup);

      const parsed = databaseBackupRunResponseSchema.safeParse(result);
      expect(parsed.success).toBe(true);
    });
  });
});
