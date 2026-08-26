import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceRepository } from '../infrastructure/attendance.repository.js';
import { ComplianceRepository } from '../infrastructure/compliance.repository.js';
import type {
  AttendanceComplianceSummaryDto,
  AttendanceFilterDto,
  AttendanceResponseDto,
  BulkLogAttendanceDto,
  ComplianceRequirementResponseDto,
  LogAttendanceDto,
  UpsertComplianceRequirementDto,
} from '@aletheia/contracts';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly attendanceRepo: AttendanceRepository,
    private readonly complianceRepo: ComplianceRepository,
  ) {}

  async logAttendance(familyId: string, dto: LogAttendanceDto): Promise<AttendanceResponseDto> {
    const record = await this.attendanceRepo.log(familyId, dto);
    return record.toResponseDto();
  }

  async bulkLogAttendance(
    familyId: string,
    dto: BulkLogAttendanceDto,
  ): Promise<AttendanceResponseDto[]> {
    const records = await this.attendanceRepo.bulkLog(familyId, dto);
    return records.map((r) => r.toResponseDto());
  }

  async getAttendance(familyId: string, id: string): Promise<AttendanceResponseDto> {
    const record = await this.attendanceRepo.findById(familyId, id);
    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }
    return record.toResponseDto();
  }

  async listAttendance(
    familyId: string,
    filter: AttendanceFilterDto = {},
  ): Promise<AttendanceResponseDto[]> {
    const records = await this.attendanceRepo.list(familyId, filter);
    return records.map((r) => r.toResponseDto());
  }

  async deleteAttendance(familyId: string, id: string): Promise<boolean> {
    const deleted = await this.attendanceRepo.delete(familyId, id);
    if (!deleted) {
      throw new NotFoundException('Attendance record not found');
    }
    return true;
  }

  async upsertComplianceRequirement(
    familyId: string,
    dto: UpsertComplianceRequirementDto,
  ): Promise<ComplianceRequirementResponseDto> {
    const req = await this.complianceRepo.upsertRequirement(familyId, dto);
    return req.toResponseDto();
  }

  async listComplianceRequirements(
    familyId: string,
    academicYearId?: string,
  ): Promise<ComplianceRequirementResponseDto[]> {
    const reqs = await this.complianceRepo.list(familyId, academicYearId);
    return reqs.map((r) => r.toResponseDto());
  }

  async deleteComplianceRequirement(familyId: string, id: string): Promise<boolean> {
    const deleted = await this.complianceRepo.delete(familyId, id);
    if (!deleted) {
      throw new NotFoundException('Compliance requirement not found');
    }
    return true;
  }

  async getComplianceSummary(
    familyId: string,
    learnerId: string,
    academicYearId?: string,
  ): Promise<AttendanceComplianceSummaryDto> {
    const filter: AttendanceFilterDto = { learnerId };
    if (academicYearId) {
      filter.academicYearId = academicYearId;
    }

    const records = await this.attendanceRepo.list(familyId, filter);

    let learnerName: string | undefined = undefined;
    let presentDays = 0;
    let absentDays = 0;
    let totalHoursLogged = 0;

    for (const rec of records) {
      if (!learnerName && rec.learnerName) {
        learnerName = rec.learnerName;
      }
      if (rec.hoursSpent) {
        totalHoursLogged += rec.hoursSpent;
      }

      if (rec.status === 'PRESENT' || rec.status === 'FIELD_TRIP') {
        presentDays++;
      } else if (rec.status === 'UNEXCUSED_ABSENCE' || rec.status === 'EXCUSED_ABSENCE' || rec.status === 'SICK') {
        absentDays++;
      }
    }

    const totalDaysLogged = records.length;

    let requiredDays: number | null = null;
    let requiredHours: number | null = null;

    if (academicYearId) {
      const requirement = await this.complianceRepo.findRequirement(familyId, academicYearId, learnerId);
      if (requirement) {
        requiredDays = requirement.minInstructionalDays ?? null;
        requiredHours = requirement.minInstructionalHours ?? null;
      }
    }

    let daysCompliancePercentage: number | null = null;
    if (requiredDays !== null && requiredDays > 0) {
      daysCompliancePercentage = Math.round((presentDays / requiredDays) * 1000) / 10;
    }

    let hoursCompliancePercentage: number | null = null;
    if (requiredHours !== null && requiredHours > 0) {
      hoursCompliancePercentage = Math.round((totalHoursLogged / requiredHours) * 1000) / 10;
    }

    const daysCompliant = requiredDays === null || presentDays >= requiredDays;
    const hoursCompliant = requiredHours === null || totalHoursLogged >= requiredHours;
    const isCompliant = (requiredDays !== null || requiredHours !== null)
      ? daysCompliant && hoursCompliant
      : true;

    const summary: AttendanceComplianceSummaryDto = {
      learnerId,
      totalDaysLogged,
      presentDays,
      absentDays,
      totalHoursLogged,
      isCompliant,
    };

    if (learnerName !== undefined) {
      summary.learnerName = learnerName;
    }
    if (academicYearId !== undefined) {
      summary.academicYearId = academicYearId;
    }
    if (requiredDays !== undefined) {
      summary.requiredDays = requiredDays;
    }
    if (requiredHours !== undefined) {
      summary.requiredHours = requiredHours;
    }
    if (daysCompliancePercentage !== undefined) {
      summary.daysCompliancePercentage = daysCompliancePercentage;
    }
    if (hoursCompliancePercentage !== undefined) {
      summary.hoursCompliancePercentage = hoursCompliancePercentage;
    }

    return summary;
  }
}
