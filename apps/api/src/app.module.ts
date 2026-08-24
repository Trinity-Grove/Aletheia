import { Module } from '@nestjs/common';
import { ConfigModule } from './platform/config/config.module.js';
import { DatabaseModule } from './platform/database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { FamiliesModule } from './modules/families/families.module.js';

@Module({
  imports: [ConfigModule, DatabaseModule, HealthModule, IdentityModule, FamiliesModule],
})
export class AppModule {}
