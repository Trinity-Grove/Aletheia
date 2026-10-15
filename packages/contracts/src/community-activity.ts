import { z } from 'zod';
import { evidenceRequirementModeSchema } from './activity-definition.js';

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
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CommunityActivityResponseDto = z.infer<typeof communityActivityResponseSchema>;

export const adoptCommunityActivitySchema = z.object({
  sourceActivityId: z.string().uuid(),
});

export type AdoptCommunityActivityDto = z.infer<typeof adoptCommunityActivitySchema>;
