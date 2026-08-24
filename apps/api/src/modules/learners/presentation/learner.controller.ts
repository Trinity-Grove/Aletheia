import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type {
  CreateLearnerDto,
  LearnerResponseDto,
  UpdateLearnerDto,
} from '@aletheia/contracts';
import { LearnerService } from '../application/learner.service.js';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';

@ApiTags('Learners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/learners', version: '1' })
export class LearnerController {
  constructor(private readonly learnerService: LearnerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new learner profile within family' })
  @ApiResponse({ status: 201, description: 'Learner created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden if not member of family.' })
  async createLearner(
    @Param('familyId') familyId: string,
    @Body() dto: CreateLearnerDto,
  ): Promise<LearnerResponseDto> {
    return this.learnerService.createLearner(familyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List learners in family' })
  @ApiResponse({ status: 200, description: 'List of learners.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async listLearners(
    @Param('familyId') familyId: string,
    @Query('includeArchived') includeArchived?: string,
  ): Promise<LearnerResponseDto[]> {
    const showArchived = includeArchived === 'true';
    return this.learnerService.getFamilyLearners(familyId, showArchived);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get learner by ID' })
  @ApiResponse({ status: 200, description: 'Learner details.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Learner not found.' })
  async getLearner(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<LearnerResponseDto> {
    return this.learnerService.getLearnerById(familyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update learner details' })
  @ApiResponse({ status: 200, description: 'Learner updated successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Learner not found.' })
  async updateLearner(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLearnerDto,
  ): Promise<LearnerResponseDto> {
    return this.learnerService.updateLearner(familyId, id, dto);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete (archive) a learner' })
  @ApiResponse({ status: 200, description: 'Learner archived successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Learner not found.' })
  async archiveLearner(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<LearnerResponseDto> {
    return this.learnerService.archiveLearner(familyId, id);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate an archived learner' })
  @ApiResponse({ status: 200, description: 'Learner reactivated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Learner not found.' })
  async reactivateLearner(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<LearnerResponseDto> {
    return this.learnerService.reactivateLearner(familyId, id);
  }
}
