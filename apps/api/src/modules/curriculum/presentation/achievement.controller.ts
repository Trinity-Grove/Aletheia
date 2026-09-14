import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { AchievementRepository } from '../infrastructure/achievement.repository.js';
import type { LearnerCompetencyAchievementResponseDto } from '@aletheia/contracts';

@ApiTags('Curriculum Achievements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/curriculum/achievements', version: '1' })
export class AchievementController {
  constructor(private readonly repository: AchievementRepository) {}

  @Get()
  @ApiOperation({ summary: 'List immutable competency achievements for the family' })
  async list(@Param('familyId') familyId: string, @Query('learnerId') learnerId?: string): Promise<LearnerCompetencyAchievementResponseDto[]> {
    const rows = await this.repository.listAchievements(familyId, learnerId);
    return rows.map((row) => ({ ...row, curriculumDefinitionId: row.curriculumDefinitionId, curriculumVersion: row.curriculumVersion, evidenceSnapshot: row.evidenceSnapshot as LearnerCompetencyAchievementResponseDto['evidenceSnapshot'], achievedAt: row.achievedAt.toISOString() }));
  }
}
