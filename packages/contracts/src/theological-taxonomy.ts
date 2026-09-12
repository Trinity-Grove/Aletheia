import { z } from 'zod';
import { definitionStatusSchema } from './curriculum-definitions.js';

// --- Theological taxonomy (Aletheia issue #96, Fase 1 section 14 /
// Fase 3 section 15) ---
//
// Data-driven substitute for hardcoding denominations/doctrinal positions
// in enums. This is the shape only -- no real theological content ships
// here (that's issue #95's separately-scoped content work). A tradition
// has many positions (real FK, not JSON); `topic` is a free-form string
// (e.g. "soteriology", "eschatology.millennium",
// "eschatology.revelation_interpretation"), not a closed enum, so a new
// topic is a data value, not a migration. Positions that share a `topic`
// value are the competing/related alternatives on that question --
// e.g. HISTORIC_PREMILLENNIALISM, DISPENSATIONAL_PREMILLENNIALISM,
// AMILLENNIALISM, and POSTMILLENNIALISM would all share
// topic="eschatology.millennium", and nothing in the schema (or anywhere
// else) picks a "winning" one -- multiple can be PUBLISHED at once (issue
// #96 section 15: "nenhuma posição é implicitamente marcada como única
// verdade pela engine").
//
// `traditionId` on a position is OPTIONAL (Fase 3 addition): most
// doctrinal positions genuinely belong to one named tradition/denomination
// (e.g. REFORMED.SOTERIOLOGY.CALVINISM), but eschatological schools of
// thought (premillennialism, amillennialism, preterism, ...) are
// cross-cutting views held across many different traditions -- forcing a
// fabricated parent "tradition" just to satisfy a NOT NULL constraint
// would be a worse model than simply allowing a position to stand on its
// own. This is a minimal, additive relaxation (nullable column, no data
// loss, no behavior change for the existing rows created in PR #111,
// which all still have a real traditionId) rather than a new table --
// per this issue's own anti-hardcode/no-premature-abstraction principle,
// the existing generic shape already covers this case once the
// constraint is loosened.

const DEFINITION_CODE_REGEX = /^[A-Z0-9][A-Z0-9_.]*$/;

export const createTheologicalTraditionDefinitionSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(150)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. REFORMED'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  name: z.string().min(1).max(250),
  description: z.string().max(2000).nullish(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type CreateTheologicalTraditionDefinitionDto = z.input<typeof createTheologicalTraditionDefinitionSchema>;
export type CreateTheologicalTraditionDefinitionOutput = z.output<
  typeof createTheologicalTraditionDefinitionSchema
>;

export const theologicalTraditionDefinitionResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
  schemaVersion: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  publishedAt: z.string().nullable().optional(),
  deprecatedAt: z.string().nullable().optional(),
});

export type TheologicalTraditionDefinitionResponseDto = z.infer<
  typeof theologicalTraditionDefinitionResponseSchema
>;

export const createTheologicalPositionDefinitionSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(150)
    .regex(DEFINITION_CODE_REGEX, 'code must be upper snake/dot case, e.g. REFORMED.SOTERIOLOGY.CALVINISM'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  traditionId: z.string().uuid().nullish(),
  topic: z.string().min(1).max(100),
  name: z.string().min(1).max(250),
  description: z.string().max(2000).nullish(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type CreateTheologicalPositionDefinitionDto = z.input<typeof createTheologicalPositionDefinitionSchema>;
export type CreateTheologicalPositionDefinitionOutput = z.output<typeof createTheologicalPositionDefinitionSchema>;

export const theologicalPositionDefinitionResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int(),
  status: definitionStatusSchema,
  schemaVersion: z.string(),
  traditionId: z.string().uuid().nullable().optional(),
  topic: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  publishedAt: z.string().nullable().optional(),
  deprecatedAt: z.string().nullable().optional(),
});

export type TheologicalPositionDefinitionResponseDto = z.infer<typeof theologicalPositionDefinitionResponseSchema>;
