import { createHash } from 'node:crypto';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { ReportRepository } from '../infrastructure/report.repository.js';
import { AttendanceService } from './attendance.service.js';
import { GradeConverter } from '../domain/grade-converter.js';
import { TranscriptPdfRenderer } from './transcript-pdf.renderer.js';
import { AttendanceCertificatePdfRenderer } from './attendance-certificate-pdf.renderer.js';
import { LearningPortfolioPdfRenderer } from './learning-portfolio-pdf.renderer.js';
import { AnnualCompliancePdfRenderer } from './annual-compliance-pdf.renderer.js';
import {
  SETTINGS_PUBLIC_API,
  type SettingsPublicApi,
} from '../../settings/application/public-api.js';
import type {
  AcademicTranscriptDto,
  AnnualComplianceReportDto,
  AttendanceCertificateDto,
  ExportFormat,
  GenerateReportDto,
  GradingScale,
  LearningHighlightDossierDto,
  LearningPortfolioDossierDto,
  OfficialReportResponseDto,
  PortfolioItemDossierDto,
  ReportPreviewDto,
  ReportType,
  ReportVerificationResponseDto,
  SubjectGradeSnapshotDto,
} from '@aletheia/contracts';

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportRepo: ReportRepository,
    private readonly attendanceService: AttendanceService,
    private readonly pdfRenderer: TranscriptPdfRenderer,
    private readonly attendanceCertificateRenderer: AttendanceCertificatePdfRenderer,
    private readonly portfolioRenderer: LearningPortfolioPdfRenderer,
    private readonly complianceRenderer: AnnualCompliancePdfRenderer,
    @Inject(SETTINGS_PUBLIC_API)
    private readonly settingsApi: SettingsPublicApi,
  ) {}

  async generateReport(
    familyId: string,
    dto: GenerateReportDto,
    generatedByUserId: string | null = null,
  ): Promise<OfficialReportResponseDto> {
    const learner = await this.prisma.learner.findFirst({
      where: { id: dto.learnerId, familyId },
    });
    if (!learner) {
      throw new NotFoundException(`Learner not found: ${dto.learnerId}`);
    }

    let reportContent: Record<string, any>;

    switch (dto.type) {
      case 'ACADEMIC_TRANSCRIPT': {
        reportContent = await this.buildAcademicTranscriptContent(familyId, dto, learner);
        break;
      }
      case 'ATTENDANCE_SUMMARY': {
        reportContent = await this.buildAttendanceCertificateContent(familyId, dto, learner);
        break;
      }
      case 'LEARNING_PORTFOLIO_DOSSIER': {
        reportContent = await this.buildLearningPortfolioDossierContent(familyId, dto, learner);
        break;
      }
      case 'ANNUAL_COMPLIANCE_REPORT':
      default: {
        reportContent = await this.buildAnnualComplianceReportContent(familyId, dto, learner);
        break;
      }
    }

    const report = await this.reportRepo.create(familyId, dto, reportContent, generatedByUserId);
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

    if (format === 'PDF') {
      throw new BadRequestException(
        'PDF export is served as binary content via GET :id/export/pdf, not through this JSON endpoint.',
      );
    }

    return {
      content: JSON.stringify(report.content, null, 2),
      mimeType: 'application/json',
      filename: `${report.title.replace(/\s+/g, '_')}_${report.id}.json`,
    };
  }

  async exportReportPdf(
    familyId: string,
    id: string,
  ): Promise<{ bytes: Uint8Array; filename: string; documentHash: string }> {
    const report = await this.getReport(familyId, id);

    let generatedByLabel: string | null = null;
    if (report.generatedByUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: report.generatedByUserId } });
      generatedByLabel = user?.fullName || user?.email || null;
    }

    let renderResult: { bytes: Uint8Array; documentHash: string };
    switch (report.type) {
      case 'ACADEMIC_TRANSCRIPT':
        renderResult = await this.pdfRenderer.render(report, generatedByLabel);
        break;
      case 'ATTENDANCE_SUMMARY':
        renderResult = await this.attendanceCertificateRenderer.render(report, generatedByLabel);
        break;
      case 'LEARNING_PORTFOLIO_DOSSIER':
        renderResult = await this.portfolioRenderer.render(report, generatedByLabel);
        break;
      case 'ANNUAL_COMPLIANCE_REPORT':
      default:
        renderResult = await this.complianceRenderer.render(report, generatedByLabel);
        break;
    }

    const { bytes, documentHash } = renderResult;

    return {
      bytes,
      documentHash,
      filename: `${report.title.replace(/\s+/g, '_')}_${report.id}.pdf`,
    };
  }

  private async buildAcademicTranscriptContent(
    familyId: string,
    dto: GenerateReportDto,
    learner: any,
  ): Promise<AcademicTranscriptDto> {
    const [family, settings] = await Promise.all([
      this.prisma.family.findUnique({ where: { id: familyId } }),
      this.settingsApi.getSettings(familyId),
    ]);

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
      // Prefers the guardian's configured homeschool name (Settings >
      // "Nome da Academia Familiar") over the family's plain account name --
      // that setting used to be saved and never read anywhere.
      familyOrganizationName:
        settings.homeschoolName?.trim() ||
        (family ? `${family.name} Homeschool` : 'Homeschool Academy'),
      gradingScale,
      generatedDate: new Date().toISOString().slice(0, 10),
      attendanceSummary: attendanceSummary ?? null,
      subjectGrades,
      generalNotes: dto.notes ?? null,
    };

    return transcript;
  }

  private async buildAttendanceCertificateContent(
    familyId: string,
    dto: GenerateReportDto,
    learner: any,
  ): Promise<AttendanceCertificateDto> {
    const [family, settings] = await Promise.all([
      this.prisma.family.findUnique({ where: { id: familyId } }),
      this.settingsApi.getSettings(familyId),
    ]);

    let academicYearTitle: string | null = null;
    if (dto.academicYearId) {
      const year = await this.prisma.academicYear.findFirst({
        where: { id: dto.academicYearId, familyId },
      });
      if (year) {
        academicYearTitle = year.title;
      }
    }

    const attendanceSummary = await this.attendanceService.getComplianceSummary(
      familyId,
      dto.learnerId,
      dto.academicYearId ?? undefined,
    );

    const certificate: AttendanceCertificateDto = {
      learnerId: learner.id,
      learnerName: learner.preferredName || `${learner.firstName}${learner.lastName ? ' ' + learner.lastName : ''}`,
      learnerBirthDate: learner.birthDate ? learner.birthDate.toISOString().slice(0, 10) : null,
      gradeLevel: learner.customGrade ?? learner.stage ?? null,
      academicYearId: dto.academicYearId ?? null,
      academicYearTitle: academicYearTitle ?? null,
      familyOrganizationName:
        settings.homeschoolName?.trim() ||
        (family ? `${family.name} Homeschool` : 'Homeschool Academy'),
      generatedDate: new Date().toISOString().slice(0, 10),
      attendanceSummary,
      generalNotes: dto.notes ?? null,
    };

    return certificate;
  }

  private convertReportToCsv(report: OfficialReportResponseDto): string {
    const lines: string[] = [];

    if (report.type === 'ACADEMIC_TRANSCRIPT') {
      const content = report.content as AcademicTranscriptDto;
      lines.push(`Homeschool,${this.escapeCsv(content.familyOrganizationName)}`);
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

  computeContentHash(report: {
    id: string;
    type: string;
    gradingScale: string;
    content: unknown;
  }): string {
    const canonical = JSON.stringify({
      id: report.id,
      type: report.type,
      gradingScale: report.gradingScale,
      content: report.content,
    });
    return createHash('sha256').update(canonical).digest('hex');
  }

  async previewReport(
    familyId: string,
    dto: GenerateReportDto,
  ): Promise<ReportPreviewDto> {
    const learner = await this.prisma.learner.findFirst({
      where: { id: dto.learnerId, familyId },
    });
    if (!learner) {
      throw new NotFoundException(`Learner not found: ${dto.learnerId}`);
    }

    const [family, settings] = await Promise.all([
      this.prisma.family.findUnique({ where: { id: familyId } }),
      this.settingsApi.getSettings(familyId),
    ]);

    let academicYearTitle: string | null = null;
    if (dto.academicYearId) {
      const year = await this.prisma.academicYear.findFirst({
        where: { id: dto.academicYearId, familyId },
      });
      if (year) academicYearTitle = year.title;
    }

    let draftContent: any;
    const previewSummary: Record<string, unknown> = {};

    switch (dto.type) {
      case 'ACADEMIC_TRANSCRIPT': {
        draftContent = await this.buildAcademicTranscriptContent(familyId, dto, learner);
        previewSummary.subjectsCount = draftContent.subjectGrades?.length ?? 0;
        previewSummary.gradingScale = draftContent.gradingScale;
        break;
      }
      case 'ATTENDANCE_SUMMARY': {
        draftContent = await this.buildAttendanceCertificateContent(familyId, dto, learner);
        previewSummary.loggedDays = draftContent.attendanceSummary?.totalDaysLogged ?? 0;
        previewSummary.loggedHours = draftContent.attendanceSummary?.totalHoursLogged ?? 0;
        break;
      }
      case 'LEARNING_PORTFOLIO_DOSSIER': {
        draftContent = await this.buildLearningPortfolioDossierContent(familyId, dto, learner);
        previewSummary.portfolioItemsCount = draftContent.portfolioItems?.length ?? 0;
        previewSummary.highlightsCount = draftContent.learningHighlights?.length ?? 0;
        break;
      }
      case 'ANNUAL_COMPLIANCE_REPORT':
      default: {
        draftContent = await this.buildAnnualComplianceReportContent(familyId, dto, learner);
        previewSummary.jurisdiction = draftContent.jurisdiction?.code;
        previewSummary.isCompliant = draftContent.attendanceCompliance?.isCompliant;
        previewSummary.loggedDays = draftContent.attendanceCompliance?.loggedDays;
        previewSummary.requiredDays = draftContent.attendanceCompliance?.requiredDays;
        break;
      }
    }

    return {
      type: dto.type,
      title: dto.title,
      learnerName:
        learner.preferredName ||
        `${learner.firstName}${learner.lastName ? ' ' + learner.lastName : ''}`,
      familyOrganizationName:
        settings.homeschoolName?.trim() ||
        (family ? `${family.name} Homeschool` : 'Homeschool Academy'),
      academicYearTitle,
      previewSummary,
      draftContent,
    };
  }

  async verifyReport(identifier: string): Promise<ReportVerificationResponseDto> {
    const isHash = /^[0-9a-f]{64}$/i.test(identifier);
    const isId = /^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/i.test(identifier);

    if (!isId && !isHash) {
      return {
        status: 'INVALID',
        documentHash: identifier,
        reportId: null,
        reportType: null,
        title: null,
        learnerName: null,
        familyOrganizationName: null,
        generatedAt: null,
        academicYearTitle: null,
        legalDisclaimer:
          'Identificador inválido. Forneça um UUID válido ou o hash SHA-256 (64 caracteres) impresso no documento.',
      };
    }

    let report: any = null;
    let computedHash = '';

    if (isId) {
      report = await this.prisma.officialReport.findUnique({
        where: { id: identifier },
        include: { family: true, learner: true, academicYear: true },
      });
      if (report) {
        computedHash = this.computeContentHash({
          id: report.id,
          type: report.type,
          gradingScale: report.gradingScale,
          content: report.content,
        });
      }
    } else {
      const allReports = await this.prisma.officialReport.findMany({
        include: { family: true, learner: true, academicYear: true },
        orderBy: { generatedAt: 'desc' },
        take: 500,
      });

      for (const r of allReports) {
        const hash = this.computeContentHash({
          id: r.id,
          type: r.type,
          gradingScale: r.gradingScale,
          content: r.content,
        });
        if (hash.toLowerCase() === identifier.toLowerCase()) {
          report = r;
          computedHash = hash;
          break;
        }
      }
    }

    if (!report) {
      return {
        status: 'NOT_FOUND',
        documentHash: identifier,
        reportId: null,
        reportType: null,
        title: null,
        learnerName: null,
        familyOrganizationName: null,
        generatedAt: null,
        academicYearTitle: null,
        legalDisclaimer:
          'Documento não localizado no registro imutável do Aletheia. Verifique se o hash ou identificador foi digitado corretamente.',
      };
    }

    const learnerName =
      report.learner?.preferredName ||
      `${report.learner?.firstName || ''}${report.learner?.lastName ? ' ' + report.learner.lastName : ''}`.trim() ||
      (report.content as any)?.learnerName ||
      'Educando';

    const familyOrgName =
      (report.content as any)?.familyOrganizationName ||
      `${report.family?.name || 'Família'} Homeschool`;

    return {
      status: 'VERIFIED',
      documentHash: computedHash,
      reportId: report.id,
      reportType: report.type as ReportType,
      title: report.title,
      learnerName,
      familyOrganizationName: familyOrgName,
      generatedAt: report.generatedAt.toISOString(),
      academicYearTitle:
        report.academicYear?.title ?? (report.content as any)?.academicYearTitle ?? null,
      legalDisclaimer:
        'Documento gerado a partir dos registros autodeclarados pela família na plataforma Aletheia. A plataforma atesta a autenticidade e a integridade matemática do snapshot gerado na data indicada, mas não substitui autorizações, convalidações ou fiscalizações de órgãos estatais ou escolares e não constitui salvo-conduto jurídico ("comprovante de não abandono intelectual").',
    };
  }

  private async buildLearningPortfolioDossierContent(
    familyId: string,
    dto: GenerateReportDto,
    learner: any,
  ): Promise<LearningPortfolioDossierDto> {
    const [family, settings] = await Promise.all([
      this.prisma.family.findUnique({ where: { id: familyId } }),
      this.settingsApi.getSettings(familyId),
    ]);

    let academicYearTitle: string | null = null;
    if (dto.academicYearId) {
      const year = await this.prisma.academicYear.findFirst({
        where: { id: dto.academicYearId, familyId },
      });
      if (year) academicYearTitle = year.title;
    }

    // Evidence submissions
    const submissions = await this.prisma.evidenceSubmission.findMany({
      where: {
        familyId,
        learnerId: dto.learnerId,
      },
      include: {
        evidenceType: true,
        competencies: {
          include: {
            competencyDefinition: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Portfolio items
    const portfolioItemsFromDb = await this.prisma.portfolioItem.findMany({
      where: {
        familyId,
        learnerId: dto.learnerId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const portfolioItems: PortfolioItemDossierDto[] = [];

    for (const sub of submissions) {
      portfolioItems.push({
        title: sub.textContent ? sub.textContent.slice(0, 80) : `Evidência: ${sub.evidenceType.name}`,
        description: sub.textContent ?? 'Evidência anexada ao portfólio de aprendizagem.',
        evidenceTypeName: sub.evidenceType.name,
        competencyNames: sub.competencies
          .map((c: any) => c.competencyDefinition?.name)
          .filter(Boolean),
        fileUrl: sub.fileUrl ?? null,
        date: sub.createdAt.toISOString().slice(0, 10),
        status: sub.validationStatus,
      });
    }

    for (const item of portfolioItemsFromDb) {
      portfolioItems.push({
        title: item.title,
        description: item.description ?? '',
        evidenceTypeName: item.type,
        competencyNames: item.tags || [],
        fileUrl: item.fileUrl ?? null,
        date: (item.capturedAt ? item.capturedAt.toISOString() : item.createdAt.toISOString()).slice(
          0,
          10,
        ),
        status: 'HIGHLIGHT',
      });
    }

    // Learning Highlights from LearningRecord
    const highlightRecords = await this.prisma.learningRecord.findMany({
      where: {
        familyId,
        learnerId: dto.learnerId,
        ...(dto.academicYearId ? { academicYearId: dto.academicYearId } : {}),
      },
      include: {
        subject: true,
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    const learningHighlights: LearningHighlightDossierDto[] = highlightRecords
      .filter((r: any) => r.notes || r.masteryLevel === 'MASTERED' || r.masteryLevel === 'AUTONOMOUS')
      .map((r: any) => ({
        subjectName: r.subject?.name ?? 'Multidisciplinar',
        notes: r.notes || r.description || `Conquista com nível de domínio ${r.masteryLevel}`,
        date: r.date.toISOString().slice(0, 10),
      }));

    return {
      learnerId: learner.id,
      learnerName:
        learner.preferredName ||
        `${learner.firstName}${learner.lastName ? ' ' + learner.lastName : ''}`,
      learnerBirthDate: learner.birthDate ? learner.birthDate.toISOString().slice(0, 10) : null,
      gradeLevel: learner.customGrade ?? learner.stage ?? null,
      academicYearId: dto.academicYearId ?? null,
      academicYearTitle,
      familyOrganizationName:
        settings.homeschoolName?.trim() ||
        (family ? `${family.name} Homeschool` : 'Homeschool Academy'),
      generatedDate: new Date().toISOString().slice(0, 10),
      portfolioItems,
      learningHighlights,
      generalNotes: dto.notes ?? null,
    };
  }

  private async buildAnnualComplianceReportContent(
    familyId: string,
    dto: GenerateReportDto,
    learner: any,
  ): Promise<AnnualComplianceReportDto> {
    const [family, settings, attendanceSummary] = await Promise.all([
      this.prisma.family.findUnique({ where: { id: familyId } }),
      this.settingsApi.getSettings(familyId),
      this.attendanceService.getComplianceSummary(
        familyId,
        dto.learnerId,
        dto.academicYearId ?? undefined,
      ),
    ]);

    let academicYearTitle: string | null = null;
    if (dto.academicYearId) {
      const year = await this.prisma.academicYear.findFirst({
        where: { id: dto.academicYearId, familyId },
      });
      if (year) academicYearTitle = year.title;
    }

    const jurisdictionDef = await this.prisma.jurisdictionDefinition.findFirst({
      where: { code: 'BR', status: 'PUBLISHED' },
      orderBy: { version: 'desc' },
    });

    const meta = (jurisdictionDef?.metadata as any) ?? {};
    const jurisdiction = {
      code: jurisdictionDef?.code ?? 'BR',
      version: jurisdictionDef?.version ?? 1,
      name: jurisdictionDef?.name ?? 'Brasil (Referencial Nacional)',
      minInstructionalDays: meta.minInstructionalDays ?? 200,
      minInstructionalHours: meta.minInstructionalHours ?? 800,
      officialSource:
        meta.officialSource ?? 'Lei de Diretrizes e Bases da Educação Nacional (Lei nº 9.394/1996, art. 24)',
      confidenceLevel: meta.confidenceLevel ?? 'ESTABLISHED',
    };

    const requiredDays = jurisdiction.minInstructionalDays;
    const requiredHours = jurisdiction.minInstructionalHours;
    const loggedDays = attendanceSummary?.presentDays ?? attendanceSummary?.totalDaysLogged ?? 0;
    const loggedHours = attendanceSummary?.totalHoursLogged ?? 0;
    const isCompliant = loggedDays >= requiredDays && loggedHours >= requiredHours;

    const records = await this.prisma.learningRecord.findMany({
      where: {
        familyId,
        learnerId: dto.learnerId,
        ...(dto.academicYearId ? { academicYearId: dto.academicYearId } : {}),
      },
      include: {
        subject: true,
      },
    });

    const subjectMap = new Map<string, { subjectName: string; records: any[] }>();
    for (const rec of records) {
      const sId = rec.subjectId ?? 'general';
      const sName = rec.subject?.name ?? 'Geral / Multidisciplinar';
      if (!subjectMap.has(sId)) {
        subjectMap.set(sId, { subjectName: sName, records: [] });
      }
      subjectMap.get(sId)!.records.push(rec);
    }

    const curriculumProgress = [];
    for (const [, data] of subjectMap.entries()) {
      if (data.records.length === 0) continue;
      let totalScore = 0;
      for (const r of data.records) {
        totalScore += GradeConverter.masteryToScore(r.masteryLevel);
      }
      const avgScore = totalScore / data.records.length;
      const avgMastery = GradeConverter.scoreToMastery(avgScore);
      curriculumProgress.push({
        subjectName: data.subjectName,
        evaluatedCount: data.records.length,
        averageMasteryLevel: avgMastery,
        calculatedGrade:
          avgMastery === 'MASTERED'
            ? 'Domínio Pleno'
            : avgMastery === 'AUTONOMOUS'
              ? 'Autônomo'
              : 'Em Desenvolvimento',
      });
    }

    return {
      learnerId: learner.id,
      learnerName:
        learner.preferredName ||
        `${learner.firstName}${learner.lastName ? ' ' + learner.lastName : ''}`,
      learnerBirthDate: learner.birthDate ? learner.birthDate.toISOString().slice(0, 10) : null,
      gradeLevel: learner.customGrade ?? learner.stage ?? null,
      academicYearId: dto.academicYearId ?? null,
      academicYearTitle,
      familyOrganizationName:
        settings.homeschoolName?.trim() ||
        (family ? `${family.name} Homeschool` : 'Homeschool Academy'),
      generatedDate: new Date().toISOString().slice(0, 10),
      jurisdiction,
      attendanceCompliance: {
        loggedDays,
        requiredDays,
        loggedHours,
        requiredHours,
        isCompliant,
      },
      curriculumProgress,
      legalDisclaimer:
        'Documento gerado a partir dos registros informados pela família na plataforma Aletheia. Reflete os dados lançados e não constitui salvo-conduto jurídico nem comprovação oficial perante órgãos estatais ("comprovante de não abandono intelectual"). Consulte a legislação da sua jurisdição.',
      generalNotes: dto.notes ?? null,
    };
  }
}


