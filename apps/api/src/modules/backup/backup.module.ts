import { Module } from '@nestjs/common';
import { StorageModule } from '../../platform/storage/storage.module.js';
import { DatabaseBackupService } from './database-backup.service.js';
import { DatabaseRestoreService } from './database-restore.service.js';
import { AdminBackupController } from './admin-backup.controller.js';

@Module({
  imports: [StorageModule],
  controllers: [AdminBackupController],
  providers: [DatabaseBackupService, DatabaseRestoreService],
  exports: [DatabaseBackupService, DatabaseRestoreService],
})
export class BackupModule {}
