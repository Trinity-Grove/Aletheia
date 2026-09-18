import { z } from 'zod';
import { attendanceComplianceSummarySchema } from './attendance.js';

export const gradingScaleSchema = z.enum([
  'MASTERY_QUALITATIVE',
  'LETTER_A_F',
  'NUMERIC_0_10',
  'NUMERIC_0_100',
  'NARRATIVE',
]);

export type GradingScale = z.infer<typeof gradingScaleSchema>;

export const reportTypeSchema = z.enum([
  'ATTENDANCE_SUMMARY',
  'ACADEMIC_TRANSCRIPT',
  'LEARNING_PORTFOLIO_DOSSIER',
  'ANNUAL_COMPLIANCE_REPORT',
]);

export type ReportType = z.infer<typeof reportTypeSchema>;

export const exportFormatSchema = z.enum(['PDF', 'CSV', 'JSON']);

export type ExportFormat = z.infer<typeof exportFormatSchema>;

export const generateReportSchema = z.object({
  learnerId: z.string().uuid(),
  academicYearId: z.string().uuid().nullish(),
  type: reportTypeSchema,
  title: z.string().min(1).max(250),
  gradingScale: gradingScaleSchema.default('MASTERY_QUALITATIVE'),
  includeAttendance: z.boolean().default(true),
  includePortfolioHighlights: z.boolean().default(true),
  notes: z.string().nullish(),
});

export type GenerateReportDto = z.input<typeof generateReportSchema>;
export type GenerateReportOutput = z.output<typeof generateReportSchema>;

export const officialReportResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  learnerId: z.string().uuid(),
  learnerName: z.string().optional(),
  academicYearId: z.string().uuid().nullable().optional(),
  academicYearTitle: z.string().optional(),
  generatedByUserId: z.string().uuid().nullable().optional(),
  type: reportTypeSchema,
  title: z.string(),
  gradingScale: gradingScaleSchema,
  content: z.record(z.string(), z.any()),
  generatedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type OfficialReportResponseDto = z.infer<typeof officialReportResponseSchema>;

export const subjectGradeSnapshotSchema = z.object({
  subjectId: z.string().uuid(),
  subjectName: z.string(),
  evaluationCount: z.number().int().min(0),
  averageMasteryLevel: z.string().optional(),
  calculatedGrade: z.string(),
  letterGrade: z.string().nullable().optional(),
  numericGrade: z.number().nullable().optional(),
  narrativeSummary: z.string().nullable().optional(),
});

export type SubjectGradeSnapshotDto = z.infer<typeof subjectGradeSnapshotSchema>;

export const academicTranscriptSchema = z.object({
  learnerId: z.string().uuid(),
  learnerName: z.string(),
  learnerBirthDate: z.string().nullable().optional(),
  gradeLevel: z.string().nullable().optional(),
  academicYearId: z.string().uuid().nullable().optional(),
  academicYearTitle: z.string().nullable().optional(),
  familyOrganizationName: z.string(),
  gradingScale: gradingScaleSchema,
  generatedDate: z.string(),
  attendanceSummary: attendanceComplianceSummarySchema.nullable().optional(),
  subjectGrades: z.array(subjectGradeSnapshotSchema),
  generalNotes: z.string().nullable().optional(),
});

export type AcademicTranscriptDto = z.infer<typeof academicTranscriptSchema>;

export const attendanceCertificateSchema = z.object({
  learnerId: z.string().uuid(),
  learnerName: z.string(),
  learnerBirthDate: z.string().nullable().optional(),
  gradeLevel: z.string().nullable().optional(),
  academicYearId: z.string().uuid().nullable().optional(),
  academicYearTitle: z.string().nullable().optional(),
  familyOrganizationName: z.string(),
  generatedDate: z.string(),
  attendanceSummary: attendanceComplianceSummarySchema,
  generalNotes: z.string().nullable().optional(),
});

export type AttendanceCertificateDto = z.infer<typeof attendanceCertificateSchema>;

export const portfolioItemDossierSchema = z.object({
  title: z.string(),
  description: z.string(),
  evidenceTypeName: z.string().optional(),
  competencyNames: z.array(z.string()).default([]),
  fileUrl: z.string().nullish(),
  date: z.string(),
  status: z.string().nullish(),
});

export type PortfolioItemDossierDto = z.infer<typeof portfolioItemDossierSchema>;

export const learningHighlightDossierSchema = z.object({
  subjectName: z.string(),
  notes: z.string(),
  date: z.string(),
});

export type LearningHighlightDossierDto = z.infer<typeof learningHighlightDossierSchema>;

export const learningPortfolioDossierSchema = z.object({
  learnerId: z.string().uuid(),
  learnerName: z.string(),
  learnerBirthDate: z.string().nullable().optional(),
  gradeLevel: z.string().nullable().optional(),
  academicYearId: z.string().uuid().nullable().optional(),
  academicYearTitle: z.string().nullable().optional(),
  familyOrganizationName: z.string(),
  generatedDate: z.string(),
  portfolioItems: z.array(portfolioItemDossierSchema).default([]),
  learningHighlights: z.array(learningHighlightDossierSchema).default([]),
  generalNotes: z.string().nullable().optional(),
});

export type LearningPortfolioDossierDto = z.infer<typeof learningPortfolioDossierSchema>;

export const annualComplianceReportSchema = z.object({
  learnerId: z.string().uuid(),
  learnerName: z.string(),
  learnerBirthDate: z.string().nullable().optional(),
  gradeLevel: z.string().nullable().optional(),
  academicYearId: z.string().uuid().nullable().optional(),
  academicYearTitle: z.string().nullable().optional(),
  familyOrganizationName: z.string(),
  generatedDate: z.string(),
  jurisdiction: z.object({
    code: z.string(),
    version: z.number().int(),
    name: z.string(),
    minInstructionalDays: z.number().nullish(),
    minInstructionalHours: z.number().nullish(),
    officialSource: z.string().nullish(),
    confidenceLevel: z.string().nullish(),
  }),
  attendanceCompliance: z.object({
    loggedDays: z.number(),
    requiredDays: z.number().nullish(),
    loggedHours: z.number(),
    requiredHours: z.number().nullish(),
    isCompliant: z.boolean(),
  }),
  curriculumProgress: z
    .array(
      z.object({
        subjectName: z.string(),
        evaluatedCount: z.number(),
        averageMasteryLevel: z.string().nullish(),
        calculatedGrade: z.string(),
      }),
    )
    .default([]),
  legalDisclaimer: z.string(),
  generalNotes: z.string().nullable().optional(),
});

export type AnnualComplianceReportDto = z.infer<typeof annualComplianceReportSchema>;

export const reportVerificationStatusSchema = z.enum(['VERIFIED', 'NOT_FOUND', 'INVALID']);

export type ReportVerificationStatus = z.infer<typeof reportVerificationStatusSchema>;

export const reportVerificationResponseSchema = z.object({
  status: reportVerificationStatusSchema,
  documentHash: z.string(),
  reportId: z.string().uuid().nullable().optional(),
  reportType: reportTypeSchema.nullable().optional(),
  title: z.string().nullable().optional(),
  learnerName: z.string().nullable().optional(),
  familyOrganizationName: z.string().nullable().optional(),
  generatedAt: z.string().nullable().optional(),
  academicYearTitle: z.string().nullable().optional(),
  legalDisclaimer: z.string(),
});

export type ReportVerificationResponseDto = z.infer<typeof reportVerificationResponseSchema>;

export const reportPreviewSchema = z.object({
  type: reportTypeSchema,
  title: z.string(),
  learnerName: z.string(),
  familyOrganizationName: z.string(),
  academicYearTitle: z.string().nullable().optional(),
  previewSummary: z.record(z.string(), z.unknown()),
  draftContent: z.record(z.string(), z.unknown()),
});

export type ReportPreviewDto = z.infer<typeof reportPreviewSchema>;

