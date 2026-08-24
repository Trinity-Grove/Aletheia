import { Module } from '@nestjs/common';
import { EnvironmentModule } from './platform/config/environment.module.js';
import { DatabaseModule } from './platform/database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { FamiliesModule } from './modules/families/families.module.js';

@Module({
  imports: [EnvironmentModule, DatabaseModule, HealthModule, IdentityModule, FamiliesModule],
})
export class AppModule {}
