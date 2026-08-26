import { Module } from '@nestjs/common';
import { EnvironmentModule } from './platform/config/environment.module.js';
import { DatabaseModule } from './platform/database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { FamiliesModule } from './modules/families/families.module.js';
import { LearnersModule } from './modules/learners/learners.module.js';
import { DevotionalModule } from './modules/devotional/devotional.module.js';
import { CurriculumModule } from './modules/curriculum/curriculum.module.js';
import { LessonsModule } from './modules/lessons/lessons.module.js';

@Module({
  imports: [
    EnvironmentModule,
    DatabaseModule,
    HealthModule,
    IdentityModule,
    FamiliesModule,
    LearnersModule,
    DevotionalModule,
    CurriculumModule,
    LessonsModule,
  ],
})
export class AppModule {}

