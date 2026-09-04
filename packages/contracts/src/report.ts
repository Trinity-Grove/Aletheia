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
