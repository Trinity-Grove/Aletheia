import type {
  AttendanceComplianceSummaryDto,
  AttendanceFilterDto,
  AttendanceResponseDto,
  ComplianceRequirementResponseDto,
  GenerateReportDto,
  LogAttendanceDto,
  OfficialReportResponseDto,
  ReportType,
  UpsertComplianceRequirementDto,
} from '@aletheia/contracts';

export const COMPLIANCE_REPORTS_PUBLIC_API = Symbol('COMPLIANCE_REPORTS_PUBLIC_API');

export interface ComplianceReportsPublicApi {
  logAttendance(familyId: string, dto: LogAttendanceDto): Promise<AttendanceResponseDto>;
  listAttendance(familyId: string, filter?: AttendanceFilterDto): Promise<AttendanceResponseDto[]>;
  getComplianceSummary(
    familyId: string,
    learnerId: string,
    academicYearId?: string,
  ): Promise<AttendanceComplianceSummaryDto>;
  upsertComplianceRequirement(
    familyId: string,
    dto: UpsertComplianceRequirementDto,
  ): Promise<ComplianceRequirementResponseDto>;
  listComplianceRequirements(
    familyId: string,
    academicYearId?: string,
  ): Promise<ComplianceRequirementResponseDto[]>;
  generateReport(familyId: string, dto: GenerateReportDto): Promise<OfficialReportResponseDto>;
  getReport(familyId: string, id: string): Promise<OfficialReportResponseDto>;
  listReports(
    familyId: string,
    filter?: { learnerId?: string; academicYearId?: string; type?: ReportType },
  ): Promise<OfficialReportResponseDto[]>;
}
