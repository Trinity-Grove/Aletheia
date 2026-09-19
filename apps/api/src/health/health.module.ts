import { Module } from '@nestjs/common';
import { DatabaseModule } from '../platform/database/database.module';
import { StorageModule } from '../platform/storage/storage.module';
import {
  NotConfiguredDependencyProbe,
  OBJECT_STORAGE_PROBE,
  ObjectStorageDependencyProbe,
  POSTGRES_PROBE,
  PostgresDependencyProbe,
  REDIS_PROBE,
} from './dependency-probe';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    PostgresDependencyProbe,
    ObjectStorageDependencyProbe,
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
      useExisting: ObjectStorageDependencyProbe,
    },
  ],
})
export class HealthModule {}
