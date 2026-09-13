import { z } from 'zod';

// --- Per-family theological profile (Aletheia issue #96, Fase 1, section 14) ---
//
// Same append-only versioning approach as PedagogicalProfile.
// `preferredTraditionCode` references a TheologicalTraditionDefinition by
// code (nullable -- a family may not have chosen one yet);
// `topicOverrides` is a generic topic -> TheologicalPositionDefinition-code
// map, so a family can override the preferred tradition's stance on
// individual topics without switching traditions wholesale.

const DEFINITION_CODE_REGEX = /^[A-Z0-9][A-Z0-9_.]*$/;

export const upsertTheologicalProfileSchema = z.object({
  preferredTraditionCode: z
    .string()
    .min(1)
    .max(150)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. REFORMED')
    .nullish(),
  topicOverrides: z.record(
    z.string().trim().min(1).max(150),
    z.string().min(1).max(150).regex(DEFINITION_CODE_REGEX),
  ).default({}),
});

export type UpsertTheologicalProfileDto = z.input<typeof upsertTheologicalProfileSchema>;
export type UpsertTheologicalProfileOutput = z.output<typeof upsertTheologicalProfileSchema>;

export const theologicalProfileResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  version: z.number().int(),
  preferredTraditionCode: z.string().nullable().optional(),
  topicOverrides: z.record(z.string(), z.string()),
  createdAt: z.string(),
  createdByUserId: z.string().uuid().nullable(),
});

export type TheologicalProfileResponseDto = z.infer<typeof theologicalProfileResponseSchema>;
