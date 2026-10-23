import { z } from 'zod';
import { evidenceRequirementModeSchema } from './activity-definition.js';

export const communityIdeaThemeSchema = z.enum([
  'NATURE_STUDY',
  'LIVING_BOOKS',
  'HANDICRAFT',
  'SEASONAL_HISTORY',
  'FAMILY_PROJECTS',
]);

export type CommunityIdeaTheme = z.infer<typeof communityIdeaThemeSchema>;

export interface CommunityActivityMetadata {
  theme?: CommunityIdeaTheme | undefined;
  materials?: string[] | undefined;
  seasonalPeriod?: string | undefined;
  steps?: string[] | undefined;
  isSeed?: boolean | undefined;
}

export const communityActivityMetadataSchema = z.object({
  theme: communityIdeaThemeSchema.optional(),
  materials: z.array(z.string()).optional(),
  seasonalPeriod: z.string().optional(),
  steps: z.array(z.string()).optional(),
  isSeed: z.boolean().optional(),
}).strict();

// Deliberately omits familyId and author information: the community catalog
// shares the activity, not the identity of the family that created it.
export const communityActivityResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  ageMin: z.number().int().nullable().optional(),
  ageMax: z.number().int().nullable().optional(),
  estimatedDurationMinutes: z.number().int().nullable().optional(),
  supervisionRequired: z.boolean(),
  riskLevel: z.string().nullable().optional(),
  evidenceRequirementMode: evidenceRequirementModeSchema,
  metadata: communityActivityMetadataSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CommunityActivityResponseDto = z.infer<typeof communityActivityResponseSchema>;

export const adoptCommunityActivitySchema = z.object({
  sourceActivityId: z.string().uuid(),
});

export type AdoptCommunityActivityDto = z.infer<typeof adoptCommunityActivitySchema>;
