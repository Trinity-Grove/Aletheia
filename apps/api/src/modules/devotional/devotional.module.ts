import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { EnvironmentModule } from '../../platform/config/environment.module.js';
import { DevotionalController } from './presentation/devotional.controller.js';
import { PrayerController } from './presentation/prayer.controller.js';
import { DevotionalRepository } from './infrastructure/devotional.repository.js';
import { PrayerRepository } from './infrastructure/prayer.repository.js';
import { YouVersionService } from './infrastructure/youversion.service.js';
import { DevotionalService } from './application/devotional.service.js';
import { PrayerService } from './application/prayer.service.js';
import { DEVOTIONAL_PUBLIC_API } from './application/public-api.js';

@Module({
  imports: [DatabaseModule, EnvironmentModule],
  controllers: [DevotionalController, PrayerController],
  providers: [
    YouVersionService,
    DevotionalRepository,
    PrayerRepository,
    DevotionalService,
    PrayerService,
    {
      provide: DEVOTIONAL_PUBLIC_API,
      useExisting: DevotionalService,
    },
  ],
  exports: [DEVOTIONAL_PUBLIC_API, DevotionalService, PrayerService],
})
export class DevotionalModule {}
