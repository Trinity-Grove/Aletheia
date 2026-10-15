import { z } from 'zod';

export const familyLearningResourceTypeSchema = z.enum(['MATERIAL', 'LESSON_PLAN', 'CHRONOGRAM']);
export type FamilyLearningResourceType = z.infer<typeof familyLearningResourceTypeSchema>;

export const familyLearningResourceVisibilitySchema = z.enum(['PRIVATE', 'PUBLIC']);
export type FamilyLearningResourceVisibility = z.infer<typeof familyLearningResourceVisibilitySchema>;

const safeExternalUrlSchema = z.string().url().max(2_000).refine(
  (value) => value.startsWith('https://') || value.startsWith('http://'),
  'Only HTTP and HTTPS links are allowed.',
);

const materialItemSchema = z.object({
  type: z.enum(['TEXT', 'LINK']),
  title: z.string().min(1).max(160),
  description: z.string().max(1_000).nullish(),
  value: z.string().min(1).max(2_000),
}).superRefine((item, ctx) => {
  if (item.type === 'LINK' && !safeExternalUrlSchema.safeParse(item.value).success) {
    ctx.addIssue({ code: 'custom', path: ['value'], message: 'Only HTTP and HTTPS links are allowed.' });
  }
});

const materialContentSchema = z.object({
  kind: z.literal('MATERIAL'),
  items: z.array(materialItemSchema).min(1).max(50),
  notes: z.string().max(2_000).nullish(),
});

const lessonPlanStepSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2_000).nullish(),
  minutes: z.number().int().min(1).max(1_440).nullish(),
});

const lessonPlanContentSchema = z.object({
  kind: z.literal('LESSON_PLAN'),
  objective: z.string().max(2_000).nullish(),
  durationMinutes: z.number().int().min(1).max(1_440),
  materials: z.array(z.string().min(1).max(160)).max(50),
  steps: z.array(lessonPlanStepSchema).min(1).max(30),
  homework: z.string().max(2_000).nullish(),
  notes: z.string().max(2_000).nullish(),
});

const scheduleSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  title: z.string().min(1).max(160),
  description: z.string().max(1_000).nullish(),
  subject: z.string().max(160).nullish(),
});

const chronogramContentSchema = z.object({
  kind: z.literal('CHRONOGRAM'),
  cadence: z.literal('WEEKLY'),
  slots: z.array(scheduleSlotSchema).min(1).max(50),
});

export const familyLearningResourceContentSchema = z.discriminatedUnion('kind', [
  materialContentSchema,
  lessonPlanContentSchema,
  chronogramContentSchema,
]);

export type FamilyLearningResourceContent = z.infer<typeof familyLearningResourceContentSchema>;

const resourceBaseSchema = z.object({
  resourceType: familyLearningResourceTypeSchema,
  title: z.string().min(1).max(250),
  description: z.string().max(2_000).nullish(),
  subject: z.string().max(160).nullish(),
  ageMin: z.number().int().min(0).max(120).nullish(),
  ageMax: z.number().int().min(0).max(120).nullish(),
  content: familyLearningResourceContentSchema,
  visibility: familyLearningResourceVisibilitySchema.default('PRIVATE'),
}).superRefine((value, ctx) => {
  if (value.resourceType !== value.content.kind) {
    ctx.addIssue({ code: 'custom', path: ['content', 'kind'], message: 'Content kind must match resource type.' });
  }
  if (value.ageMin != null && value.ageMax != null && value.ageMin > value.ageMax) {
    ctx.addIssue({ code: 'custom', path: ['ageMax'], message: 'ageMax must be greater than or equal to ageMin.' });
  }
});

export const createFamilyLearningResourceSchema = resourceBaseSchema;
export type CreateFamilyLearningResourceDto = z.input<typeof createFamilyLearningResourceSchema>;
export type CreateFamilyLearningResourceOutput = z.output<typeof createFamilyLearningResourceSchema>;

export const updateFamilyLearningResourceSchema = resourceBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required to update a resource.',
);
export type UpdateFamilyLearningResourceDto = z.input<typeof updateFamilyLearningResourceSchema>;
export type UpdateFamilyLearningResourceOutput = z.output<typeof updateFamilyLearningResourceSchema>;

const responseBaseSchema = z.object({
  id: z.string().uuid(),
  resourceType: familyLearningResourceTypeSchema,
  title: z.string(),
  description: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  ageMin: z.number().int().nullable().optional(),
  ageMax: z.number().int().nullable().optional(),
  content: familyLearningResourceContentSchema,
  visibility: familyLearningResourceVisibilitySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const familyLearningResourceResponseSchema = responseBaseSchema.extend({
  familyId: z.string().uuid(),
});
export type FamilyLearningResourceResponseDto = z.infer<typeof familyLearningResourceResponseSchema>;

export const communityLearningResourceResponseSchema = responseBaseSchema.strict();
export type CommunityLearningResourceResponseDto = z.infer<typeof communityLearningResourceResponseSchema>;

export const adoptFamilyLearningResourceSchema = z.object({
  sourceResourceId: z.string().uuid(),
});
export type AdoptFamilyLearningResourceDto = z.infer<typeof adoptFamilyLearningResourceSchema>;
