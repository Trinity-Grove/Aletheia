import { Module } from '@nestjs/common';
import { DatabaseModule } from '../platform/database/database.module';
import {
  NoopDependencyProbe,
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
    NoopDependencyProbe,
    {
      provide: POSTGRES_PROBE,
      useExisting: PostgresDependencyProbe,
    },
    {
      provide: REDIS_PROBE,
      useExisting: NoopDependencyProbe,
    },
    {
      provide: OBJECT_STORAGE_PROBE,
      useExisting: NoopDependencyProbe,
    },
  ],
})
export class HealthModule {}
