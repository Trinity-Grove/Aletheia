import { z } from 'zod';

// --- Definition/Version operations: controlled migration + logical
// rollback (Aletheia issue #96, Fase 0, section 24) ---
//
// Two explicit, admin-triggered, opt-in operations on top of the
// Definition/Version pattern (see curriculum-definitions.ts):
//
// 1. Controlled migration: re-point a caller-selected set of
//    LearnerCompetencyTracking rows from one version of a
//    CompetencyDefinition to another (never automatic, never "everyone").
// 2. Logical rollback: deprecate a PUBLISHED definition version so
//    "current" resolution falls back to the next-highest PUBLISHED
//    version of that code, without deleting or mutating the rolled-back
//    row. Works across every Definition/Version table, since they all
//    share the same {code, version, status, schemaVersion} shape.
//
// Neither operation ever touches LearnerCompetencyAchievement -- that
// table is an append-only historical record pinned to an exact,
// already-awarded version (see PR #133) and must never be repointed or
// affected by a later rollback.

export const ROLLBACK_ELIGIBLE_ENTITY_TYPES = [
  'LearningDomain',
  'CompetencyDefinition',
  'PedagogicalModelDefinition',
  'LearningPath',
  'SkillDefinition',
  'RubricDefinition',
  'EvidenceTypeDefinition',
  'CurriculumDefinition',
  'ActivityDefinition',
  'ProjectDefinition',
  'TheologicalTraditionDefinition',
  'TheologicalPositionDefinition',
  'ProgressionPolicy',
  'BibleTranslationDefinition',
] as const;

export const rollbackEligibleEntityTypeSchema = z.enum(ROLLBACK_ELIGIBLE_ENTITY_TYPES);
export type RollbackEligibleEntityType = z.infer<typeof rollbackEligibleEntityTypeSchema>;

export const rollbackDefinitionVersionSchema = z.object({
  entityType: rollbackEligibleEntityTypeSchema,
  code: z.string().min(1).max(150),
  version: z.number().int().min(1),
  reason: z.string().max(500).optional(),
});

export type RollbackDefinitionVersionDto = z.infer<typeof rollbackDefinitionVersionSchema>;

export const rollbackDefinitionVersionResultSchema = z.object({
  entityType: rollbackEligibleEntityTypeSchema,
  code: z.string(),
  rolledBackVersion: z.number().int(),
  newCurrentVersion: z.number().int().nullable(),
  logId: z.string().uuid(),
});

export type RollbackDefinitionVersionResultDto = z.infer<typeof rollbackDefinitionVersionResultSchema>;

export const migrateCompetencyTrackingReferencesSchema = z.object({
  code: z.string().min(1).max(150),
  fromVersion: z.number().int().min(1),
  toVersion: z.number().int().min(1),
  // Explicit, caller-selected set of tracking rows to re-point -- never a
  // blanket "migrate everyone on this code" operation.
  trackingIds: z.array(z.string().uuid()).min(1).max(500),
  reason: z.string().max(500).optional(),
});

export type MigrateCompetencyTrackingReferencesDto = z.infer<typeof migrateCompetencyTrackingReferencesSchema>;

export const migrateCompetencyTrackingReferencesResultSchema = z.object({
  migratedTrackingIds: z.array(z.string().uuid()),
  skippedTrackingIds: z.array(z.string().uuid()),
  logId: z.string().uuid(),
});

export type MigrateCompetencyTrackingReferencesResultDto = z.infer<
  typeof migrateCompetencyTrackingReferencesResultSchema
>;

export const definitionVersionOperationTypeSchema = z.enum([
  'MIGRATE_REFERENCES',
  'ROLLBACK',
  'CREATE',
  'STATUS_TRANSITION',
]);
export type DefinitionVersionOperationType = z.infer<typeof definitionVersionOperationTypeSchema>;

export const definitionVersionOperationLogResponseSchema = z.object({
  id: z.string().uuid(),
  operationType: definitionVersionOperationTypeSchema,
  definitionCode: z.string(),
  fromVersion: z.number().int(),
  toVersion: z.number().int().nullable(),
  affectedEntityType: z.string().nullable(),
  affectedEntityIds: z.array(z.string()),
  performedByUserId: z.string().uuid(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});

export type DefinitionVersionOperationLogResponseDto = z.infer<typeof definitionVersionOperationLogResponseSchema>;
