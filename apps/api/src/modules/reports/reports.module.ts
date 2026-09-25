import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { PrivacyModule } from '../privacy/privacy.module.js';
import { AttendanceRepository } from './infrastructure/attendance.repository.js';
import { ComplianceRepository } from './infrastructure/compliance.repository.js';
import { ReportRepository } from './infrastructure/report.repository.js';
import { AttendanceService } from './application/attendance.service.js';
import { ReportService } from './application/report.service.js';
import { TranscriptPdfRenderer } from './application/transcript-pdf.renderer.js';
import { AttendanceCertificatePdfRenderer } from './application/attendance-certificate-pdf.renderer.js';
import { LearningPortfolioPdfRenderer } from './application/learning-portfolio-pdf.renderer.js';
import { AnnualCompliancePdfRenderer } from './application/annual-compliance-pdf.renderer.js';
import { COMPLIANCE_REPORTS_PUBLIC_API, type ComplianceReportsPublicApi } from './application/public-api.js';
import { AttendanceController } from './presentation/attendance.controller.js';
import { ReportController } from './presentation/report.controller.js';
import { PublicReportVerificationController } from './presentation/public-report-verification.controller.js';

@Module({
  imports: [DatabaseModule, SettingsModule, PrivacyModule],
  controllers: [AttendanceController, ReportController, PublicReportVerificationController],
  providers: [
    AttendanceRepository,
    ComplianceRepository,
    ReportRepository,
    AttendanceService,
    ReportService,
    TranscriptPdfRenderer,
    AttendanceCertificatePdfRenderer,
    LearningPortfolioPdfRenderer,
    AnnualCompliancePdfRenderer,
    {
      provide: COMPLIANCE_REPORTS_PUBLIC_API,
      useFactory: (attendanceService: AttendanceService, reportService: ReportService): ComplianceReportsPublicApi => ({
        logAttendance: (familyId, dto) => attendanceService.logAttendance(familyId, dto),
        listAttendance: (familyId, filter) => attendanceService.listAttendance(familyId, filter),
        getComplianceSummary: (familyId, learnerId, academicYearId) =>
          attendanceService.getComplianceSummary(familyId, learnerId, academicYearId),
        upsertComplianceRequirement: (familyId, dto) =>
          attendanceService.upsertComplianceRequirement(familyId, dto),
        listComplianceRequirements: (familyId, academicYearId) =>
          attendanceService.listComplianceRequirements(familyId, academicYearId),
        generateReport: (familyId, dto) => reportService.generateReport(familyId, dto),
        getReport: (familyId, id) => reportService.getReport(familyId, id),
        listReports: (familyId, filter) => reportService.listReports(familyId, filter),
      }),
      inject: [AttendanceService, ReportService],
    },
  ],
  exports: [COMPLIANCE_REPORTS_PUBLIC_API, AttendanceService, ReportService],
})
export class ReportsModule {}
