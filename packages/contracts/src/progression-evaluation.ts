import { z } from 'zod';

export const progressionPrerequisiteSchema = z.object({
  competencyDefinitionId: z.string().uuid(),
  policyId: z.string().uuid(),
}).strict();

export const evidenceCountRulesSchema = z.object({
  minimumEvidenceCount: z.number().int().positive(),
  prerequisites: z.array(progressionPrerequisiteSchema).max(32).default([]),
}).strict();

export const progressionEvaluationQuerySchema = progressionPrerequisiteSchema.extend({
  learnerId: z.string().uuid(),
}).strict();

export const progressionStateSchema = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'MASTERED']);
const evaluationFields = {
  competencyDefinitionId: z.string().uuid(),
  competencyVersion: z.number().int().positive(),
  policyId: z.string().uuid(),
  policyVersion: z.number().int().positive(),
  validatedEvidenceCount: z.number().int().nonnegative(),
  minimumEvidenceCount: z.number().int().positive(),
  state: progressionStateSchema,
};
export const progressionEvaluationResponseSchema = z.object({
  ...evaluationFields,
  learnerId: z.string().uuid(),
  unmetPrerequisites: z.array(z.object(evaluationFields).strict()),
}).strict();

export type ProgressionEvaluationQueryDto = z.infer<typeof progressionEvaluationQuerySchema>;
export type ProgressionEvaluationResponseDto = z.infer<typeof progressionEvaluationResponseSchema>;
