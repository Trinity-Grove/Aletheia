import { z } from 'zod';
import {
  universalEducationalStageSchema,
  type UniversalEducationalStage,
} from './educational-taxonomy.js';

const legacyEducationalStageSchema = z.enum([
  'PRIMARY_GRAMMAR',
  'MIDDLE_LOGIC',
  'HIGH_RHETORIC',
]);

/** Canonical stage values returned by the learner API and stored in the DB. */
export const educationalStageSchema = z.union([
  universalEducationalStageSchema,
  z.literal('OTHER'),
]);

/** Backward-compatible input accepted while clients migrate. */
export const learnerStageInputSchema = z.union([
  educationalStageSchema,
  legacyEducationalStageSchema,
]);

export type EducationalStage = z.infer<typeof educationalStageSchema>;
export type LearnerStageInput = z.infer<typeof learnerStageInputSchema>;

export function normalizeEducationalStage(stage: LearnerStageInput): EducationalStage {
  switch (stage) {
    case 'PRIMARY_GRAMMAR':
      return 'PRIMARY';
    case 'MIDDLE_LOGIC':
      return 'LOWER_SECONDARY';
    case 'HIGH_RHETORIC':
      return 'UPPER_SECONDARY';
    default:
      return stage as UniversalEducationalStage | 'OTHER';
  }
}

const learnerStageSchema = learnerStageInputSchema.transform(normalizeEducationalStage);

export const createLearnerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).nullish(),
  preferredName: z.string().max(100).nullish(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'birthDate must be in YYYY-MM-DD format'),
  stage: learnerStageSchema.default('PRIMARY'),
  customGrade: z.string().nullish(),
  avatarColor: z.string().nullish(),
  specialNeeds: z.string().nullish(),
  notes: z.string().nullish(),
  // Guardian consent for processing this learner's data (issue: guardian
  // consent at learner creation). z.literal(true) rejects at the contract
  // layer if unchecked. .partial() on updateLearnerSchema below makes this
  // optional on update -- only creation requires (re-)consenting.
  acceptedDataConsent: z.literal(true),
});

export type CreateLearnerDto = z.input<typeof createLearnerSchema>;
export type CreateLearnerOutput = z.output<typeof createLearnerSchema>;

export const updateLearnerSchema = createLearnerSchema.partial();

export type UpdateLearnerDto = z.input<typeof updateLearnerSchema>;

export const learnerResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).nullable().optional(),
  preferredName: z.string().max(100).nullable().optional(),
  birthDate: z.string(),
  stage: educationalStageSchema,
  customGrade: z.string().nullable().optional(),
  avatarColor: z.string().nullable().optional(),
  specialNeeds: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  archivedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LearnerResponseDto = z.infer<typeof learnerResponseSchema>;

export const learnerSummarySchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string().nullable().optional(),
  preferredName: z.string().nullable().optional(),
  stage: educationalStageSchema,
  avatarColor: z.string().nullable().optional(),
});

export type LearnerSummaryDto = z.infer<typeof learnerSummarySchema>;

