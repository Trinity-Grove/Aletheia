import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { ReportRepository } from '../infrastructure/report.repository.js';
import { AttendanceService } from './attendance.service.js';
import { GradeConverter } from '../domain/grade-converter.js';
import type {
  AcademicTranscriptDto,
  ExportFormat,
  GenerateReportDto,
  OfficialReportResponseDto,
  ReportType,
  SubjectGradeSnapshotDto,
} from '@aletheia/contracts';

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportRepo: ReportRepository,
    private readonly attendanceService: AttendanceService,
  ) {}

  async generateReport(familyId: string, dto: GenerateReportDto): Promise<OfficialReportResponseDto> {
    const learner = await this.prisma.learner.findFirst({
      where: { id: dto.learnerId, familyId },
    });
    if (!learner) {
      throw new NotFoundException(`Learner not found: ${dto.learnerId}`);
    }

    let reportContent: Record<string, any> = {};

    switch (dto.type) {
      case 'ACADEMIC_TRANSCRIPT': {
        reportContent = await this.buildAcademicTranscriptContent(familyId, dto, learner);
        break;
      }
      case 'ATTENDANCE_SUMMARY': {
        const attendanceSummary = await this.attendanceService.getComplianceSummary(
          familyId,
          dto.learnerId,
          dto.academicYearId ?? undefined,
        );
        reportContent = {
          learnerId: dto.learnerId,
          learnerName: learner.preferredName || `${learner.firstName}${learner.lastName ? ' ' + learner.lastName : ''}`,
          academicYearId: dto.academicYearId ?? null,
          attendanceSummary,
          notes: dto.notes ?? null,
        };
        break;
      }
      case 'LEARNING_PORTFOLIO_DOSSIER':
      case 'ANNUAL_COMPLIANCE_REPORT':
      default: {
        const attendanceSummary = dto.includeAttendance
          ? await this.attendanceService.getComplianceSummary(
              familyId,
              dto.learnerId,
              dto.academicYearId ?? undefined,
            )
          : null;

        reportContent = {
          learnerId: dto.learnerId,
          learnerName: learner.preferredName || `${learner.firstName}${learner.lastName ? ' ' + learner.lastName : ''}`,
          academicYearId: dto.academicYearId ?? null,
          attendanceSummary,
          notes: dto.notes ?? null,
        };
        break;
      }
    }

    const report = await this.reportRepo.create(familyId, dto, reportContent);
    return report.toResponseDto();
  }

  async getReport(familyId: string, id: string): Promise<OfficialReportResponseDto> {
    const report = await this.reportRepo.findById(familyId, id);
    if (!report) {
      throw new NotFoundException('Official report not found');
    }
    return report.toResponseDto();
  }

  async listReports(
    familyId: string,
    filter: { learnerId?: string; academicYearId?: string; type?: ReportType } = {},
  ): Promise<OfficialReportResponseDto[]> {
    const reports = await this.reportRepo.list(familyId, filter);
    return reports.map((r) => r.toResponseDto());
  }

  async deleteReport(familyId: string, id: string): Promise<boolean> {
    const deleted = await this.reportRepo.delete(familyId, id);
    if (!deleted) {
      throw new NotFoundException('Official report not found');
    }
    return true;
  }

  async exportReport(
    familyId: string,
    id: string,
    format: ExportFormat = 'JSON',
  ): Promise<{ content: string; mimeType: string; filename: string }> {
    const report = await this.getReport(familyId, id);

    if (format === 'CSV') {
      const csv = this.convertReportToCsv(report);
      return {
        content: csv,
        mimeType: 'text/csv',
        filename: `${report.title.replace(/\s+/g, '_')}_${report.id}.csv`,
      };
    }

    // Default to JSON format (or fallback if PDF is requested as structured string)
    return {
      content: JSON.stringify(report.content, null, 2),
      mimeType: format === 'JSON' ? 'application/json' : 'application/pdf',
      filename: `${report.title.replace(/\s+/g, '_')}_${report.id}.${format.toLowerCase()}`,
    };
  }

  private async buildAcademicTranscriptContent(
    familyId: string,
    dto: GenerateReportDto,
    learner: any,
  ): Promise<AcademicTranscriptDto> {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
    });

    let academicYearTitle: string | null = null;
    if (dto.academicYearId) {
      const year = await this.prisma.academicYear.findFirst({
        where: { id: dto.academicYearId, familyId },
      });
      if (year) {
        academicYearTitle = year.title;
      }
    }

    // Attendance summary
    let attendanceSummary = null;
    if (dto.includeAttendance) {
      attendanceSummary = await this.attendanceService.getComplianceSummary(
        familyId,
        dto.learnerId,
        dto.academicYearId ?? undefined,
      );
    }

    // Fetch learning records for subject grades calculation
    const recordsWhere: Record<string, unknown> = {
      familyId,
      learnerId: dto.learnerId,
    };
    if (dto.academicYearId) {
      recordsWhere.academicYearId = dto.academicYearId;
    }

    const records = await this.prisma.learningRecord.findMany({
      where: recordsWhere,
      include: {
        subject: true,
      },
    });

    // Group records by subject
    const subjectMap = new Map<string, { subjectName: string; records: typeof records }>();

    for (const rec of records) {
      const subjectId = rec.subjectId ?? 'general';
      const subjectName = rec.subject?.name ?? 'Geral / Multidisciplinar';

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, { subjectName, records: [] });
      }
      subjectMap.get(subjectId)!.records.push(rec);
    }

    const gradingScale = dto.gradingScale ?? 'MASTERY_QUALITATIVE';
    const subjectGrades: SubjectGradeSnapshotDto[] = [];

    for (const [subjectId, data] of subjectMap.entries()) {
      if (data.records.length === 0) continue;

      let totalScore = 0;
      for (const r of data.records) {
        totalScore += GradeConverter.masteryToScore(r.masteryLevel);
      }
      const avgScore = totalScore / data.records.length;
      const avgMastery = GradeConverter.scoreToMastery(avgScore);
      const converted = GradeConverter.convert(avgMastery, gradingScale, avgScore);

      const snapshot: SubjectGradeSnapshotDto = {
        subjectId,
        subjectName: data.subjectName,
        evaluationCount: data.records.length,
        averageMasteryLevel: avgMastery,
        calculatedGrade: converted.calculatedGrade,
      };

      if (converted.letterGrade !== null) {
        snapshot.letterGrade = converted.letterGrade;
      }
      if (converted.numericGrade !== null) {
        snapshot.numericGrade = converted.numericGrade;
      }
      if (converted.narrativeSummary !== null) {
        snapshot.narrativeSummary = converted.narrativeSummary;
      }

      subjectGrades.push(snapshot);
    }

    const transcript: AcademicTranscriptDto = {
      learnerId: learner.id,
      learnerName: learner.preferredName || `${learner.firstName}${learner.lastName ? ' ' + learner.lastName : ''}`,
      learnerBirthDate: learner.birthDate ? learner.birthDate.toISOString().slice(0, 10) : null,
      gradeLevel: learner.customGrade ?? learner.stage ?? null,
      academicYearId: dto.academicYearId ?? null,
      academicYearTitle: academicYearTitle ?? null,
      familyOrganizationName: family ? `${family.name} Homeschool` : 'Homeschool Academy',
      gradingScale,
      generatedDate: new Date().toISOString().slice(0, 10),
      attendanceSummary: attendanceSummary ?? null,
      subjectGrades,
      generalNotes: dto.notes ?? null,
    };

    return transcript;
  }

  private convertReportToCsv(report: OfficialReportResponseDto): string {
    const lines: string[] = [];

    if (report.type === 'ACADEMIC_TRANSCRIPT') {
      const content = report.content as AcademicTranscriptDto;
      lines.push(`Report Title,${this.escapeCsv(report.title)}`);
      lines.push(`Learner,${this.escapeCsv(content.learnerName)}`);
      lines.push(`Academic Year,${this.escapeCsv(content.academicYearTitle ?? 'N/A')}`);
      lines.push(`Grading Scale,${this.escapeCsv(content.gradingScale)}`);
      lines.push(`Generated Date,${this.escapeCsv(content.generatedDate)}`);
      lines.push('');
      lines.push('Subject,Evaluations,Average Mastery,Calculated Grade,Letter Grade,Numeric Grade,Narrative Summary');

      for (const grade of content.subjectGrades || []) {
        lines.push([
          this.escapeCsv(grade.subjectName),
          grade.evaluationCount,
          this.escapeCsv(grade.averageMasteryLevel ?? ''),
          this.escapeCsv(grade.calculatedGrade),
          this.escapeCsv(grade.letterGrade ?? ''),
          grade.numericGrade ?? '',
          this.escapeCsv(grade.narrativeSummary ?? ''),
        ].join(','));
      }

      if (content.attendanceSummary) {
        lines.push('');
        lines.push('Attendance Summary');
        lines.push(`Total Days Logged,${content.attendanceSummary.totalDaysLogged}`);
        lines.push(`Present Days,${content.attendanceSummary.presentDays}`);
        lines.push(`Absent Days,${content.attendanceSummary.absentDays}`);
        lines.push(`Total Hours Logged,${content.attendanceSummary.totalHoursLogged}`);
        lines.push(`Compliance Status,${content.attendanceSummary.isCompliant ? 'Compliant' : 'Non-compliant'}`);
      }
    } else {
      lines.push(`Report Title,${this.escapeCsv(report.title)}`);
      lines.push(`Report Type,${this.escapeCsv(report.type)}`);
      lines.push(`Learner,${this.escapeCsv(report.learnerName ?? '')}`);
      lines.push(`Generated At,${this.escapeCsv(report.generatedAt)}`);
      lines.push('');
      lines.push('Key,Value');
      for (const [key, value] of Object.entries(report.content)) {
        if (typeof value === 'object' && value !== null) {
          lines.push(`${this.escapeCsv(key)},${this.escapeCsv(JSON.stringify(value))}`);
        } else {
          lines.push(`${this.escapeCsv(key)},${this.escapeCsv(String(value ?? ''))}`);
        }
      }
    }

    return lines.join('\n');
  }

  private escapeCsv(val: any): string {
    if (val === null || val === undefined) {
      return '';
    }
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}

