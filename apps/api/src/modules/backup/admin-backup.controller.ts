import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type {
  DatabaseBackupListResponseDto,
  DatabaseBackupRunResponseDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, PlatformAdminGuard } from '../../platform/auth/index.js';
import { DatabaseBackupService } from './database-backup.service.js';

@ApiTags('Database Backups (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller({ path: 'admin/backups', version: '1' })
export class AdminBackupController {
  constructor(private readonly backupService: DatabaseBackupService) {}

  @Get()
  @ApiOperation({ summary: 'List all database backups stored in object storage' })
  @ApiResponse({ status: 200, description: 'List of backup metadata entries.' })
  async listBackups(): Promise<DatabaseBackupListResponseDto> {
    const backups = await this.backupService.listBackups();
    return {
      backups,
      totalCount: backups.length,
    };
  }

  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger an on-demand database backup' })
  @ApiResponse({ status: 200, description: 'The executed backup metadata.' })
  async runBackup(): Promise<DatabaseBackupRunResponseDto> {
    const backup = await this.backupService.runBackup();
    return {
      success: true,
      message: `Database backup completed successfully: ${backup.fileName}`,
      backup,
    };
  }
}
