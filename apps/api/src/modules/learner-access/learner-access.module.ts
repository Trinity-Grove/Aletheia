import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { ENVIRONMENT, type Environment } from '../../platform/config/environment.js';
import { LearnersModule } from '../learners/learners.module.js';
import { LessonsModule } from '../lessons/lessons.module.js';
import { CurriculumModule } from '../curriculum/curriculum.module.js';
import { ReportsModule } from '../reports/reports.module.js';
import { RecordsModule } from '../records/records.module.js';
import { LearnerAccessGrantRepository } from './infrastructure/learner-access-grant.repository.js';
import { LearnerAccessAttemptRepository } from './infrastructure/learner-access-attempt.repository.js';
import { CodeHasher } from './application/code-hasher.js';
import { LearnerAccessService } from './application/learner-access.service.js';
import { LearnerProgressService } from './application/learner-progress.service.js';
import { LEARNER_ACCESS_PUBLIC_API } from './application/public-api.js';
import { LearnerAccessAdminController } from './presentation/learner-access-admin.controller.js';
import { LearnerSessionController } from './presentation/learner-session.controller.js';
import { LearnerAgendaController } from './presentation/learner-agenda.controller.js';
import { LearnerProgressController } from './presentation/learner-progress.controller.js';
import { LearnerAccessGuard, LearnerSelfGuard } from '../../platform/auth/index.js';

@Module({
  imports: [
    DatabaseModule,
    LearnersModule,
    LessonsModule,
    CurriculumModule,
    ReportsModule,
    RecordsModule,
    // A second, independently-configured JwtModule instance -- NOT the
    // same registration IdentityModule uses. Because it's imported only
    // here (not re-exported globally), the JwtService it provides is
    // scoped to this module: a learner token signed here can never be
    // verified by IdentityModule's JwtService, and vice versa.
    JwtModule.registerAsync({
      inject: [ENVIRONMENT],
      useFactory: (environment: Environment) => ({
        secret: environment.learnerSessionJwtSecret,
      }),
    }),
  ],
  controllers: [
    LearnerAccessAdminController,
    LearnerSessionController,
    LearnerAgendaController,
    LearnerProgressController,
  ],
  providers: [
    LearnerAccessGrantRepository,
    LearnerAccessAttemptRepository,
    CodeHasher,
    LearnerAccessService,
    LearnerProgressService,
    LearnerAccessGuard,
    LearnerSelfGuard,
    {
      provide: LEARNER_ACCESS_PUBLIC_API,
      useExisting: LearnerAccessService,
    },
  ],
  exports: [LEARNER_ACCESS_PUBLIC_API],
})
export class LearnerAccessModule {}
