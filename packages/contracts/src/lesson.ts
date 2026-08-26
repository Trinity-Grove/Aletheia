import { z } from 'zod';

export const lessonStatusSchema = z.enum([
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'POSTPONED',
  'CANCELLED',
]);

export type LessonStatus = z.infer<typeof lessonStatusSchema>;

export const createLessonPlanSchema = z.object({
  academicYearId: z.string().uuid().nullish(),
  subjectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().nullish(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'startTime must be in HH:MM format')
    .nullish(),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'endTime must be in HH:MM format')
    .nullish(),
  durationMinutes: z.number().int().min(1).max(1440).nullish(),
  learnerIds: z.array(z.string().uuid()).min(1, 'At least one learner must be assigned'),
  objectiveIds: z.array(z.string().uuid()).default([]),
  materials: z.string().nullish(),
  homework: z.string().nullish(),
  notes: z.string().nullish(),
});

export type CreateLessonPlanDto = z.input<typeof createLessonPlanSchema>;
export type CreateLessonPlanOutput = z.output<typeof createLessonPlanSchema>;

export const updateLessonPlanSchema = createLessonPlanSchema.partial();
export type UpdateLessonPlanDto = z.infer<typeof updateLessonPlanSchema>;

export const completeLessonSchema = z.object({
  completedAt: z.string().nullish(),
  actualDurationMinutes: z.number().int().min(1).max(1440).nullish(),
  notes: z.string().nullish(),
  learnerNotes: z.record(z.string().uuid(), z.string()).optional(),
});

export type CompleteLessonDto = z.infer<typeof completeLessonSchema>;

export const rescheduleLessonSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'newDate must be in YYYY-MM-DD format'),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'startTime must be in HH:MM format')
    .nullish(),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'endTime must be in HH:MM format')
    .nullish(),
  reason: z.string().nullish(),
});

export type RescheduleLessonDto = z.infer<typeof rescheduleLessonSchema>;

export const lessonPlanLearnerResponseSchema = z.object({
  id: z.string().uuid(),
  lessonPlanId: z.string().uuid(),
  learnerId: z.string().uuid(),
  learnerName: z.string().optional(),
  notes: z.string().nullable().optional(),
  completed: z.boolean().default(false),
});

export type LessonPlanLearnerResponseDto = z.infer<typeof lessonPlanLearnerResponseSchema>;

export const lessonPlanObjectiveResponseSchema = z.object({
  id: z.string().uuid(),
  lessonPlanId: z.string().uuid(),
  objectiveId: z.string().uuid(),
  title: z.string().optional(),
});

export type LessonPlanObjectiveResponseDto = z.infer<typeof lessonPlanObjectiveResponseSchema>;

export const lessonPlanResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  academicYearId: z.string().nullable().optional(),
  subjectId: z.string().uuid(),
  subjectName: z.string().optional(),
  subjectColor: z.string().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  date: z.string(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  durationMinutes: z.number().int().nullable().optional(),
  actualDurationMinutes: z.number().int().nullable().optional(),
  status: lessonStatusSchema,
  materials: z.string().nullable().optional(),
  homework: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  learners: z.array(lessonPlanLearnerResponseSchema).default([]),
  objectives: z.array(lessonPlanObjectiveResponseSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LessonPlanResponseDto = z.infer<typeof lessonPlanResponseSchema>;
