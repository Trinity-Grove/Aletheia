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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createLearningRecordSchema,
  updateLearningRecordSchema,
  type CreateLearningRecordDto,
  type LearnerProgressSummaryDto,
  type LearningRecordFilterDto,
  type LearningRecordResponseDto,
  type LearningRecordType,
  type MasteryLevel,
  type UpdateLearningRecordDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { LearningRecordService } from '../application/learning-record.service.js';

@ApiTags('Learning Records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/records', version: '1' })
export class LearningRecordController {
  constructor(private readonly recordService: LearningRecordService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a learning record' })
  async createRecord(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(createLearningRecordSchema)) dto: CreateLearningRecordDto,
  ): Promise<LearningRecordResponseDto> {
    return this.recordService.createRecord(familyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List learning records with optional filters' })
  async getRecords(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('type') type?: string,
    @Query('masteryLevel') masteryLevel?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<LearningRecordResponseDto[]> {
    const filter: LearningRecordFilterDto = {
      ...(learnerId ? { learnerId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(academicYearId ? { academicYearId } : {}),
      ...(type ? { type: type as LearningRecordType } : {}),
      ...(masteryLevel ? { masteryLevel: masteryLevel as MasteryLevel } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    };
    return this.recordService.listRecords(familyId, filter);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get learner progress summary across learning records' })
  async getProgressSummary(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId: string,
  ): Promise<LearnerProgressSummaryDto> {
    return this.recordService.getProgressSummary(familyId, learnerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a learning record by ID' })
  async getRecordById(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<LearningRecordResponseDto> {
    return this.recordService.getRecord(familyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a learning record' })
  async updateRecord(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLearningRecordSchema)) dto: UpdateLearningRecordDto,
  ): Promise<LearningRecordResponseDto> {
    return this.recordService.updateRecord(familyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a learning record' })
  async deleteRecord(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const success = await this.recordService.deleteRecord(familyId, id);
    return { success };
  }
}
