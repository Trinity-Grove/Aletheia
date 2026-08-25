import {
  Body,
  Controller,
  Delete,
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
  CreateObjectiveDto,
  ObjectiveResponseDto,
  ObjectiveStatus,
  UpdateObjectiveDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { ObjectiveService } from '../application/objective.service.js';

@ApiTags('Learning Objectives')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/curriculum/objectives', version: '1' })
export class ObjectiveController {
  constructor(private readonly objectiveService: ObjectiveService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a learning objective' })
  async createObjective(
    @Param('familyId') familyId: string,
    @Body() dto: CreateObjectiveDto,
  ): Promise<ObjectiveResponseDto> {
    return this.objectiveService.createObjective(familyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List learning objectives with optional filters' })
  async listObjectives(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('status') status?: string,
  ): Promise<ObjectiveResponseDto[]> {
    return this.objectiveService.listObjectives(familyId, {
      ...(learnerId ? { learnerId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(academicYearId ? { academicYearId } : {}),
      ...(status ? { status: status as ObjectiveStatus } : {}),
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update learning objective progress or details' })
  async updateObjective(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateObjectiveDto,
  ): Promise<ObjectiveResponseDto> {
    return this.objectiveService.updateObjective(familyId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a learning objective' })
  async deleteObjective(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const success = await this.objectiveService.deleteObjective(familyId, id);
    return { success };
  }
}
