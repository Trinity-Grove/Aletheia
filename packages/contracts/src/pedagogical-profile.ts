import { z } from 'zod';

// --- Per-family pedagogical profile (Aletheia issue #96, Fase 1, section 13) ---
//
// References a PedagogicalModelDefinition by `code` (not a duplicated
// copy of its content, and not an FK to one specific row -- same reason
// CurriculumService.applyTemplate already resolves templates by
// (code, status=PUBLISHED)). Append-only versioning: "upserting" always
// creates a new row with an incremented version; nothing is ever updated
// or deleted, so changing preferences never destroys history.
//
// Wired into CurriculumService.applyTemplate (issue #95, human-approved):
// when a profile exists, its primary/secondary weights rank (never filter)
// the subject set the applied template resolves. See
// apps/api/src/modules/curriculum/application/pedagogical-subject-ranking.ts.

const DEFINITION_CODE_REGEX = /^[A-Z0-9][A-Z0-9_.]*$/;

export const secondaryPedagogicalModelSchema = z.object({
  code: z.string().min(1).max(150).regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case'),
  weight: z.number().min(0).max(1),
});

export type SecondaryPedagogicalModel = z.infer<typeof secondaryPedagogicalModelSchema>;

export const upsertPedagogicalProfileSchema = z.object({
  primaryModelCode: z
    .string()
    .min(1)
    .max(150)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. MONTESSORI'),
  secondaryModels: z.array(secondaryPedagogicalModelSchema).default([]),
  overrides: z.record(z.string(), z.unknown()).default({}),
}).superRefine((profile, context) => {
  const codes = new Set([profile.primaryModelCode]);
  profile.secondaryModels.forEach((model, index) => {
    if (codes.has(model.code)) {
      context.addIssue({ code: 'custom', path: ['secondaryModels', index, 'code'], message: 'Each model may appear only once' });
    }
    codes.add(model.code);
  });
});

export type UpsertPedagogicalProfileDto = z.input<typeof upsertPedagogicalProfileSchema>;
export type UpsertPedagogicalProfileOutput = z.output<typeof upsertPedagogicalProfileSchema>;

export const pedagogicalProfileResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  version: z.number().int(),
  primaryModelCode: z.string(),
  secondaryModels: z.array(secondaryPedagogicalModelSchema),
  overrides: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  createdByUserId: z.string().uuid().nullable(),
});

export type PedagogicalProfileResponseDto = z.infer<typeof pedagogicalProfileResponseSchema>;
