import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { MentorGrantRepository } from './infrastructure/mentor-grant.repository.js';
import { MentorGrantService } from './application/mentor-grant.service.js';
import { MentorGrantController } from './presentation/mentor-grant.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [MentorGrantController],
  providers: [MentorGrantRepository, MentorGrantService],
})
export class MentorsModule {}
