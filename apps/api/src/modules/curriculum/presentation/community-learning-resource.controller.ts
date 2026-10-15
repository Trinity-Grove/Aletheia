import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CommunityLearningResourceResponseDto } from '@aletheia/contracts';
import { JwtAuthGuard } from '../../../platform/auth/index.js';
import { FamilyLearningResourceService } from '../application/family-learning-resource.service.js';

@ApiTags('Community Learning Resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'community/learning-resources', version: '1' })
export class CommunityLearningResourceController {
  constructor(private readonly service: FamilyLearningResourceService) {}

  @Get()
  @ApiOperation({ summary: 'List voluntarily shared family learning resources' })
  async list(): Promise<CommunityLearningResourceResponseDto[]> {
    return this.service.listPublic();
  }
}
