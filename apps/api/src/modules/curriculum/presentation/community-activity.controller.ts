import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type CommunityActivityResponseDto,
} from '@aletheia/contracts';
import { JwtAuthGuard } from '../../../platform/auth/index.js';
import { FamilyActivityService } from '../application/family-activity.service.js';

@ApiTags('Community Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'activities/community', version: '1' })
export class CommunityActivityController {
  constructor(private readonly service: FamilyActivityService) {}

  @Get()
  @ApiOperation({ summary: 'List voluntarily shared family activities' })
  async list(): Promise<CommunityActivityResponseDto[]> {
    return this.service.listPublic();
  }
}
