import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { EnvironmentModule } from './platform/config/environment.module';

@Module({
  imports: [EnvironmentModule, HealthModule],
})
export class AppModule {}
