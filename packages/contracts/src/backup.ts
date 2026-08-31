import { z } from 'zod';

export const exportStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);

export type ExportStatus = z.infer<typeof exportStatusSchema>;

export const createExportJobSchema = z.object({
  notes: z.string().nullish(),
});

export type CreateExportJobDto = z.infer<typeof createExportJobSchema>;

export const dataExportJobResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  requestedById: z.string().uuid(),
  status: exportStatusSchema,
  downloadUrl: z.string().nullable().optional(),
  fileSizeBytes: z.number().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  errorReason: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DataExportJobResponseDto = z.infer<typeof dataExportJobResponseSchema>;

export const familyDataExportPackageSchema = z.object({
  exportedAt: z.string(),
  version: z.string(),
  family: z.record(z.string(), z.any()),
  settings: z.record(z.string(), z.any()).nullable().optional(),
  members: z.array(z.record(z.string(), z.any())).optional(),
  learners: z.array(z.record(z.string(), z.any())).optional(),
  devotionals: z.array(z.record(z.string(), z.any())).optional(),
  prayerRequests: z.array(z.record(z.string(), z.any())).optional(),
  academicYears: z.array(z.record(z.string(), z.any())).optional(),
  subjects: z.array(z.record(z.string(), z.any())).optional(),
  curriculumPlans: z.array(z.record(z.string(), z.any())).optional(),
  lessonPlans: z.array(z.record(z.string(), z.any())).optional(),
  scheduleSlots: z.array(z.record(z.string(), z.any())).optional(),
  learningRecords: z.array(z.record(z.string(), z.any())).optional(),
  portfolioItems: z.array(z.record(z.string(), z.any())).optional(),
  attendanceRecords: z.array(z.record(z.string(), z.any())).optional(),
  complianceRequirements: z.array(z.record(z.string(), z.any())).optional(),
  officialReports: z.array(z.record(z.string(), z.any())).optional(),
  notifications: z.array(z.record(z.string(), z.any())).optional(),
});

export type FamilyDataExportPackageDto = z.infer<typeof familyDataExportPackageSchema>;
