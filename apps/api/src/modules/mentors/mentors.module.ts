import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { MentorGrantRepository } from './infrastructure/mentor-grant.repository.js';
import { MentorGrantService } from './application/mentor-grant.service.js';
import { MentorGrantController } from './presentation/mentor-grant.controller.js';
import { MENTOR_GRANT_PUBLIC_API } from './application/public-api.js';

@Module({
  imports: [DatabaseModule],
  controllers: [MentorGrantController],
  providers: [MentorGrantRepository, MentorGrantService, { provide: MENTOR_GRANT_PUBLIC_API, useExisting: MentorGrantService }],
  exports: [MENTOR_GRANT_PUBLIC_API],
})
export class MentorsModule {}
