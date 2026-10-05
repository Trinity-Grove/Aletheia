import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { LearnerGamificationSummaryDto } from '@aletheia/contracts';
import { FamilyTenantGuard, JwtAuthGuard } from '../../../platform/auth/index.js';
import { GamificationService } from '../application/gamification.service.js';

// Guardian view of one learner's badges. Read-only with respect to the
// "seen" flag: only the learner acknowledging in the portal clears isNew,
// so a guardian peeking never steals the child's celebration.
@ApiTags('Learner Badges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/learners/:learnerId/badges', version: '1' })
export class LearnerBadgesController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get()
  @ApiOperation({ summary: "Get one learner's badges, growth level and streak" })
  @ApiResponse({ status: 200, description: 'Gamification summary for the learner.' })
  async getSummary(
    @Param('familyId') familyId: string,
    @Param('learnerId') learnerId: string,
  ): Promise<LearnerGamificationSummaryDto> {
    return this.gamificationService.getSummary(familyId, learnerId);
  }
}
