import { z } from 'zod';

export const pedagogicalFrameworkSchema = z.enum([
  'CLASSICAL_TRIVIUM',
  'CHARLOTTE_MASON',
  'TRADITIONAL',
  'UNIT_STUDIES',
  'CUSTOM',
]);

export type PedagogicalFramework = z.infer<typeof pedagogicalFrameworkSchema>;

export const objectiveStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'ACHIEVED',
]);

export type ObjectiveStatus = z.infer<typeof objectiveStatusSchema>;

// Academic Year
export const createAcademicYearSchema = z.object({
  year: z.number().int().min(1900).max(2200),
  title: z.string().min(1).max(100),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be in YYYY-MM-DD format').nullish(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be in YYYY-MM-DD format').nullish(),
  isCurrent: z.boolean().default(false),
});

export type CreateAcademicYearDto = z.input<typeof createAcademicYearSchema>;
export type CreateAcademicYearOutput = z.output<typeof createAcademicYearSchema>;

export const academicYearResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  year: z.number().int(),
  title: z.string(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  isCurrent: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AcademicYearResponseDto = z.infer<typeof academicYearResponseSchema>;

// Subject
export const createSubjectSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color').default('#3B82F6').nullish(),
  icon: z.string().max(50).nullish(),
  description: z.string().max(500).nullish(),
});

export type CreateSubjectDto = z.input<typeof createSubjectSchema>;
export type CreateSubjectOutput = z.output<typeof createSubjectSchema>;

export const updateSubjectSchema = createSubjectSchema.partial();
export type UpdateSubjectDto = z.infer<typeof updateSubjectSchema>;

export const subjectResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  name: z.string(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  archivedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SubjectResponseDto = z.infer<typeof subjectResponseSchema>;

// Learner Plan
export const upsertLearnerPlanSchema = z.object({
  learnerId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  pedagogicalFramework: pedagogicalFrameworkSchema.default('CUSTOM'),
  notes: z.string().nullish(),
});

export type UpsertLearnerPlanDto = z.input<typeof upsertLearnerPlanSchema>;
export type UpsertLearnerPlanOutput = z.output<typeof upsertLearnerPlanSchema>;

export const learnerPlanResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  learnerId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  pedagogicalFramework: pedagogicalFrameworkSchema,
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LearnerPlanResponseDto = z.infer<typeof learnerPlanResponseSchema>;

// Learning Objective
export const createObjectiveSchema = z.object({
  learnerId: z.string().uuid(),
  subjectId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  title: z.string().min(1).max(250),
  description: z.string().nullish(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'targetDate must be in YYYY-MM-DD format').nullish(),
  order: z.number().int().default(0),
});

export type CreateObjectiveDto = z.input<typeof createObjectiveSchema>;
export type CreateObjectiveOutput = z.output<typeof createObjectiveSchema>;

export const updateObjectiveSchema = z.object({
  title: z.string().min(1).max(250).optional(),
  description: z.string().nullish(),
  status: objectiveStatusSchema.optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'targetDate must be in YYYY-MM-DD format').nullish(),
  order: z.number().int().optional(),
});

export type UpdateObjectiveDto = z.infer<typeof updateObjectiveSchema>;

export const objectiveResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  learnerId: z.string().uuid(),
  subjectId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: objectiveStatusSchema,
  targetDate: z.string().nullable().optional(),
  achievedAt: z.string().nullable().optional(),
  order: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ObjectiveResponseDto = z.infer<typeof objectiveResponseSchema>;

// Template application
export const applyCurriculumTemplateSchema = z.object({
  learnerId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  template: pedagogicalFrameworkSchema,
});

export type ApplyCurriculumTemplateDto = z.infer<typeof applyCurriculumTemplateSchema>;
