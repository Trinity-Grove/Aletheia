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
  createScheduleSlotSchema,
  updateScheduleSlotSchema,
  type CreateScheduleSlotDto,
  type DailyAgendaDto,
  type DayOfWeek,
  type ScheduleSlotResponseDto,
  type UpdateScheduleSlotDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { ScheduleService } from '../application/schedule.service.js';

@ApiTags('Schedule')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/schedule', version: '1' })
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post('slots')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a weekly routine schedule slot' })
  async createSlot(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(createScheduleSlotSchema)) dto: CreateScheduleSlotDto,
  ): Promise<ScheduleSlotResponseDto> {
    return this.scheduleService.createSlot(familyId, dto);
  }

  @Get('slots')
  @ApiOperation({ summary: 'List weekly routine schedule slots' })
  async getSlots(
    @Param('familyId') familyId: string,
    @Query('dayOfWeek') dayOfWeek?: string,
    @Query('learnerId') learnerId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('academicYearId') academicYearId?: string,
  ): Promise<ScheduleSlotResponseDto[]> {
    const parsedDay = dayOfWeek ? (parseInt(dayOfWeek, 10) as DayOfWeek) : undefined;
    return this.scheduleService.listSlots(familyId, {
      ...(parsedDay !== undefined ? { dayOfWeek: parsedDay } : {}),
      ...(learnerId ? { learnerId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(academicYearId ? { academicYearId } : {}),
    });
  }

  @Get('slots/:id')
  @ApiOperation({ summary: 'Get a schedule slot by ID' })
  async getSlotById(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<ScheduleSlotResponseDto> {
    return this.scheduleService.getSlot(familyId, id);
  }

  @Patch('slots/:id')
  @ApiOperation({ summary: 'Update a schedule slot' })
  async updateSlot(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateScheduleSlotSchema)) dto: UpdateScheduleSlotDto,
  ): Promise<ScheduleSlotResponseDto> {
    return this.scheduleService.updateSlot(familyId, id, dto);
  }

  @Delete('slots/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a schedule slot' })
  async deleteSlot(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const success = await this.scheduleService.deleteSlot(familyId, id);
    return { success };
  }

  @Get('agenda')
  @ApiOperation({ summary: 'Get aggregated daily agenda with lessons and routine slots' })
  async getDailyAgenda(
    @Param('familyId') familyId: string,
    @Query('date') date?: string,
    @Query('learnerId') learnerId?: string,
  ): Promise<DailyAgendaDto> {
    const targetDate = date ?? new Date().toISOString().split('T')[0]!;
    return this.scheduleService.getDailyAgenda(familyId, targetDate, learnerId);
  }
}
