import { Module } from '@nestjs/common';
import { DatabaseModule } from '../platform/database/database.module';
import {
  NotConfiguredDependencyProbe,
  OBJECT_STORAGE_PROBE,
  POSTGRES_PROBE,
  PostgresDependencyProbe,
  REDIS_PROBE,
} from './dependency-probe';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    PostgresDependencyProbe,
    NotConfiguredDependencyProbe,
    {
      provide: POSTGRES_PROBE,
      useExisting: PostgresDependencyProbe,
    },
    {
      provide: REDIS_PROBE,
      useExisting: NotConfiguredDependencyProbe,
    },
    {
      provide: OBJECT_STORAGE_PROBE,
      useExisting: NotConfiguredDependencyProbe,
    },
  ],
})
export class HealthModule {}
