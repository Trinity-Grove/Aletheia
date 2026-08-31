import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ENVIRONMENT, type Environment } from './platform/config/environment.js';
import { EnvironmentModule } from './platform/config/environment.module.js';
import { DatabaseModule } from './platform/database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { FamiliesModule } from './modules/families/families.module.js';
import { LearnersModule } from './modules/learners/learners.module.js';
import { DevotionalModule } from './modules/devotional/devotional.module.js';
import { CurriculumModule } from './modules/curriculum/curriculum.module.js';
import { LessonsModule } from './modules/lessons/lessons.module.js';
import { RecordsModule } from './modules/records/records.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';

@Module({
  imports: [
    EnvironmentModule,
    ThrottlerModule.forRootAsync({
      inject: [ENVIRONMENT],
      useFactory: (environment: Environment) => [
        {
          name: 'default',
          ttl: 60_000,
          // Generous enough for real traffic while still bounding abuse;
          // effectively unbounded in tests so e2e suites firing many
          // requests in quick succession never trip this guard.
          limit: environment.nodeEnv === 'test' ? 100_000 : 60,
        },
      ],
    }),
    DatabaseModule,
    HealthModule,
    IdentityModule,
    FamiliesModule,
    LearnersModule,
    DevotionalModule,
    CurriculumModule,
    LessonsModule,
    RecordsModule,
    ReportsModule,
    SettingsModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

