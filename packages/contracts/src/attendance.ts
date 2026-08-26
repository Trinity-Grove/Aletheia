import { z } from 'zod';

export const attendanceStatusSchema = z.enum([
  'PRESENT',
  'EXCUSED_ABSENCE',
  'UNEXCUSED_ABSENCE',
  'HOLIDAY',
  'FIELD_TRIP',
  'SICK',
]);

export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

export const logAttendanceSchema = z.object({
  learnerId: z.string().uuid(),
  academicYearId: z.string().uuid().nullish(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
  status: attendanceStatusSchema.default('PRESENT'),
  hoursSpent: z.number().min(0).max(24).nullish(),
  notes: z.string().nullish(),
  isAutoLogged: z.boolean().default(false),
});

export type LogAttendanceDto = z.input<typeof logAttendanceSchema>;
export type LogAttendanceOutput = z.output<typeof logAttendanceSchema>;

export const bulkLogAttendanceSchema = z.object({
  learnerIds: z.array(z.string().uuid()).min(1, 'At least one learner must be provided'),
  academicYearId: z.string().uuid().nullish(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
  status: attendanceStatusSchema.default('PRESENT'),
  hoursSpent: z.number().min(0).max(24).nullish(),
  notes: z.string().nullish(),
  isAutoLogged: z.boolean().default(false),
});

export type BulkLogAttendanceDto = z.input<typeof bulkLogAttendanceSchema>;
export type BulkLogAttendanceOutput = z.output<typeof bulkLogAttendanceSchema>;

export const attendanceFilterSchema = z.object({
  learnerId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: attendanceStatusSchema.optional(),
});

export type AttendanceFilterDto = z.infer<typeof attendanceFilterSchema>;

export const attendanceResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  learnerId: z.string().uuid(),
  learnerName: z.string().optional(),
  academicYearId: z.string().uuid().nullable().optional(),
  date: z.string(),
  status: attendanceStatusSchema,
  hoursSpent: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  isAutoLogged: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AttendanceResponseDto = z.infer<typeof attendanceResponseSchema>;

export const upsertComplianceRequirementSchema = z.object({
  academicYearId: z.string().uuid(),
  learnerId: z.string().uuid().nullish(),
  jurisdiction: z.string().min(1).max(150).nullish(),
  minInstructionalDays: z.number().int().min(0).max(366).nullish(),
  minInstructionalHours: z.number().min(0).max(3000).nullish(),
  notes: z.string().nullish(),
});

export type UpsertComplianceRequirementDto = z.input<typeof upsertComplianceRequirementSchema>;
export type UpsertComplianceRequirementOutput = z.output<typeof upsertComplianceRequirementSchema>;

export const complianceRequirementResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  academicYearTitle: z.string().optional(),
  learnerId: z.string().uuid().nullable().optional(),
  learnerName: z.string().optional(),
  jurisdiction: z.string().nullable().optional(),
  minInstructionalDays: z.number().int().nullable().optional(),
  minInstructionalHours: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ComplianceRequirementResponseDto = z.infer<typeof complianceRequirementResponseSchema>;

export const attendanceComplianceSummarySchema = z.object({
  learnerId: z.string().uuid(),
  learnerName: z.string().optional(),
  academicYearId: z.string().uuid().nullable().optional(),
  totalDaysLogged: z.number().int(),
  presentDays: z.number().int(),
  absentDays: z.number().int(),
  totalHoursLogged: z.number(),
  requiredDays: z.number().int().nullable().optional(),
  requiredHours: z.number().nullable().optional(),
  daysCompliancePercentage: z.number().nullable().optional(),
  hoursCompliancePercentage: z.number().nullable().optional(),
  isCompliant: z.boolean(),
});

export type AttendanceComplianceSummaryDto = z.infer<typeof attendanceComplianceSummarySchema>;
