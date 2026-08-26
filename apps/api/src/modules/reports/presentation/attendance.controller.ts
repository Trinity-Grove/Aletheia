import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AttendanceComplianceSummaryDto,
  AttendanceFilterDto,
  AttendanceResponseDto,
  AttendanceStatus,
  BulkLogAttendanceDto,
  ComplianceRequirementResponseDto,
  LogAttendanceDto,
  UpsertComplianceRequirementDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { AttendanceService } from '../application/attendance.service.js';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/attendance', version: '1' })
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Log attendance for a single learner' })
  async logAttendance(
    @Param('familyId') familyId: string,
    @Body() dto: LogAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    return this.attendanceService.logAttendance(familyId, dto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk log attendance for multiple learners' })
  async bulkLogAttendance(
    @Param('familyId') familyId: string,
    @Body() dto: BulkLogAttendanceDto,
  ): Promise<AttendanceResponseDto[]> {
    return this.attendanceService.bulkLogAttendance(familyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List attendance records with filters' })
  async getAttendance(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ): Promise<AttendanceResponseDto[]> {
    const filter: AttendanceFilterDto = {
      ...(learnerId ? { learnerId } : {}),
      ...(academicYearId ? { academicYearId } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(status ? { status: status as AttendanceStatus } : {}),
    };
    return this.attendanceService.listAttendance(familyId, filter);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get attendance and compliance summary for a learner' })
  async getComplianceSummary(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId: string,
    @Query('academicYearId') academicYearId?: string,
  ): Promise<AttendanceComplianceSummaryDto> {
    return this.attendanceService.getComplianceSummary(familyId, learnerId, academicYearId);
  }

  @Put('requirements')
  @ApiOperation({ summary: 'Upsert compliance requirements for family/year' })
  async upsertRequirements(
    @Param('familyId') familyId: string,
    @Body() dto: UpsertComplianceRequirementDto,
  ): Promise<ComplianceRequirementResponseDto> {
    return this.attendanceService.upsertComplianceRequirement(familyId, dto);
  }

  @Get('requirements')
  @ApiOperation({ summary: 'Get compliance requirements for family' })
  async getRequirements(
    @Param('familyId') familyId: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('learnerId') learnerId?: string,
  ): Promise<ComplianceRequirementResponseDto[]> {
    const reqs = await this.attendanceService.listComplianceRequirements(familyId, academicYearId);
    if (learnerId) {
      return reqs.filter((r) => r.learnerId === learnerId || r.learnerId === null);
    }
    return reqs;
  }
}
