import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { EnvironmentModule } from '../../platform/config/environment.module.js';
import { FamilySettingsRepository } from './infrastructure/family-settings.repository.js';
import { NotificationRepository } from './infrastructure/notification.repository.js';
import { DataExportRepository } from './infrastructure/data-export.repository.js';
import { FamilySettingsService } from './application/family-settings.service.js';
import { NotificationService } from './application/notification.service.js';
import { DataExportService } from './application/data-export.service.js';
import { SETTINGS_PUBLIC_API, FAMILY_SETTINGS_PUBLIC_API } from './application/public-api.js';
import { FamilySettingsController } from './presentation/family-settings.controller.js';
import { NotificationController } from './presentation/notification.controller.js';
import { DataExportController } from './presentation/data-export.controller.js';

@Module({
  imports: [DatabaseModule, EnvironmentModule],
  controllers: [
    FamilySettingsController,
    NotificationController,
    DataExportController,
  ],
  providers: [
    FamilySettingsRepository,
    NotificationRepository,
    DataExportRepository,
    FamilySettingsService,
    NotificationService,
    DataExportService,
    {
      provide: SETTINGS_PUBLIC_API,
      useExisting: FamilySettingsService,
    },
    {
      provide: FAMILY_SETTINGS_PUBLIC_API,
      useExisting: FamilySettingsService,
    },
  ],
  exports: [
    SETTINGS_PUBLIC_API,
    FAMILY_SETTINGS_PUBLIC_API,
    FamilySettingsRepository,
    NotificationRepository,
    DataExportRepository,
    FamilySettingsService,
    NotificationService,
    DataExportService,
    FamilySettingsController,
    NotificationController,
    DataExportController,
  ],
})
export class SettingsModule {}
