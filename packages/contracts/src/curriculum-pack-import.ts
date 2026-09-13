import { z } from 'zod';
import { curriculumPackExportDocumentSchema, portableRefSchema } from './curriculum-pack-export.js';

// --- Curriculum pack import (Aletheia issue #96, Fase 4, section 28,
// write half) ---
//
// Given an export document: validate it against the expected schema
// first (reject malformed input before touching the database), check
// for (type, code, version) conflicts against what already exists
// (report, don't overwrite), check that every pack-level dependency is
// either already present locally or is the pack being imported itself,
// and support `dryRun: true` (report what would happen, write nothing).
// A real import creates new DRAFT rows only for what doesn't already
// exist -- never overwrites, never auto-publishes.

export const importCurriculumPackRequestSchema = z.object({
  document: curriculumPackExportDocumentSchema,
  dryRun: z.boolean().default(false),
});

export type ImportCurriculumPackDto = z.input<typeof importCurriculumPackRequestSchema>;
export type ImportCurriculumPackOutput = z.output<typeof importCurriculumPackRequestSchema>;

export const importConflictSchema = z.object({
  ref: portableRefSchema,
  reason: z.literal('ALREADY_EXISTS'),
});

export type ImportConflict = z.infer<typeof importConflictSchema>;

export const importMissingDependencySchema = z.object({
  dependsOnCode: z.string(),
  dependsOnVersion: z.number().int(),
});

export type ImportMissingDependency = z.infer<typeof importMissingDependencySchema>;

export const importBlockedItemSchema = z.object({
  ref: portableRefSchema,
  reason: z.string(),
});

export type ImportBlockedItem = z.infer<typeof importBlockedItemSchema>;

// The pack itself isn't one of the 12 CurriculumPackDefinitionType
// values (it's the container, not a bundleable content type), so its
// own create/conflict status is reported separately from `items`
// rather than being shoehorned into a PortableRef.
export const importPackStatusSchema = z.object({
  code: z.string(),
  version: z.number().int(),
  outcome: z.enum(['WOULD_CREATE', 'CREATED', 'ALREADY_EXISTS']),
});

export type ImportPackStatus = z.infer<typeof importPackStatusSchema>;

export const curriculumPackImportReportSchema = z.object({
  dryRun: z.boolean(),
  pack: importPackStatusSchema,
  wouldCreate: z.array(portableRefSchema),
  created: z.array(portableRefSchema),
  conflicts: z.array(importConflictSchema),
  missingDependencies: z.array(importMissingDependencySchema),
  blocked: z.array(importBlockedItemSchema),
});

export type CurriculumPackImportReport = z.infer<typeof curriculumPackImportReportSchema>;
