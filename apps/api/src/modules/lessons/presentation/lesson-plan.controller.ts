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
import type {
  CompleteLessonDto,
  CreateLessonPlanDto,
  LessonPlanResponseDto,
  LessonStatus,
  RescheduleLessonDto,
  UpdateLessonPlanDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { LessonPlanService } from '../application/lesson-plan.service.js';

@ApiTags('Lessons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/lessons', version: '1' })
export class LessonPlanController {
  constructor(private readonly lessonPlanService: LessonPlanService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a lesson plan' })
  async createLesson(
    @Param('familyId') familyId: string,
    @Body() dto: CreateLessonPlanDto,
  ): Promise<LessonPlanResponseDto> {
    return this.lessonPlanService.createLessonPlan(familyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List lesson plans with optional filters' })
  async getLessons(
    @Param('familyId') familyId: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('subjectId') subjectId?: string,
    @Query('learnerId') learnerId?: string,
    @Query('status') status?: string,
    @Query('academicYearId') academicYearId?: string,
  ): Promise<LessonPlanResponseDto[]> {
    return this.lessonPlanService.listLessonPlans(familyId, {
      ...(date ? { date } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(learnerId ? { learnerId } : {}),
      ...(status ? { status: status as LessonStatus } : {}),
      ...(academicYearId ? { academicYearId } : {}),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lesson plan by ID' })
  async getLessonById(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<LessonPlanResponseDto> {
    return this.lessonPlanService.getLessonPlan(familyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lesson plan' })
  async updateLesson(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLessonPlanDto,
  ): Promise<LessonPlanResponseDto> {
    return this.lessonPlanService.updateLessonPlan(familyId, id, dto);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark lesson or learner assignment as completed' })
  async completeLesson(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() dto: CompleteLessonDto,
    @Query('learnerId') learnerId?: string,
  ): Promise<LessonPlanResponseDto> {
    return this.lessonPlanService.completeLesson(familyId, id, dto, learnerId);
  }

  @Post(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reschedule a lesson plan' })
  async rescheduleLesson(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body() dto: RescheduleLessonDto,
  ): Promise<LessonPlanResponseDto> {
    return this.lessonPlanService.rescheduleLesson(familyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a lesson plan' })
  async deleteLesson(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const success = await this.lessonPlanService.deleteLessonPlan(familyId, id);
    return { success };
  }
}
