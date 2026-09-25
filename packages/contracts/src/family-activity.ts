import { z } from 'zod';
import { activityMetadataSchema, evidenceRequirementModeSchema } from './activity-definition.js';

// Family-owned Activity (issue #96 section 7: "Pode ser criada pela
// família", issue #245). Its own model/contract, not a family-scoped
// variant of ActivityDefinition -- that catalog type's code/version/
// status(DRAFT/PUBLISHED) lifecycle is a platform governance concern,
// not something personal family content needs.

/**
 * Anything that isn't a fork/copy of catalog content gets a visibility
 * choice controlled by its own creator (issue #244/#245) -- PRIVATE by
 * default, PUBLIC if the creator opts in. No approval queue gates this;
 * moderation, if ever needed, is reactive (reports against PUBLIC
 * content), not pre-publication review.
 */
export const familyContentVisibilitySchema = z.enum(['PRIVATE', 'PUBLIC']);

export type FamilyContentVisibility = z.infer<typeof familyContentVisibilitySchema>;

export const createFamilyActivitySchema = z
  .object({
    name: z.string().min(1).max(250),
    description: z.string().max(2000).nullish(),
    ageMin: z.number().int().min(0).max(120).nullish(),
    ageMax: z.number().int().min(0).max(120).nullish(),
    estimatedDurationMinutes: z.number().int().positive().nullish(),
    supervisionRequired: z.boolean().default(false),
    riskLevel: z.string().max(50).nullish(),
    evidenceRequirementMode: evidenceRequirementModeSchema.default('ANY'),
    metadata: activityMetadataSchema.partial().default({}),
    visibility: familyContentVisibilitySchema.default('PRIVATE'),
  })
  .refine(({ ageMin, ageMax }) => ageMin == null || ageMax == null || ageMin <= ageMax, {
    message: 'ageMax must be greater than or equal to ageMin',
    path: ['ageMax'],
  });

export type CreateFamilyActivityDto = z.input<typeof createFamilyActivitySchema>;
export type CreateFamilyActivityOutput = z.output<typeof createFamilyActivitySchema>;

export const updateFamilyActivitySchema = createFamilyActivitySchema;

export type UpdateFamilyActivityDto = z.input<typeof updateFamilyActivitySchema>;
export type UpdateFamilyActivityOutput = z.output<typeof updateFamilyActivitySchema>;

export const familyActivityResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  ageMin: z.number().int().nullable().optional(),
  ageMax: z.number().int().nullable().optional(),
  estimatedDurationMinutes: z.number().int().nullable().optional(),
  supervisionRequired: z.boolean(),
  riskLevel: z.string().nullable().optional(),
  evidenceRequirementMode: evidenceRequirementModeSchema,
  metadata: z.record(z.string(), z.unknown()),
  visibility: familyContentVisibilitySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FamilyActivityResponseDto = z.infer<typeof familyActivityResponseSchema>;
