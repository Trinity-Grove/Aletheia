import { z } from 'zod';
import { curriculumPackDefinitionTypeSchema } from './curriculum-pack.js';

// --- Curriculum pack export document (Aletheia issue #96, Fase 4,
// section 28, read half) ---
//
// A published pack's manifest resolved into a single portable JSON
// document: the pack's own metadata plus the FULL content of every
// referenced definition row -- not just IDs, since the receiving system
// won't have this database's UUIDs. Any foreign-key reference a
// definition's content carries (e.g. CompetencyDefinition.domainId) is
// itself resolved to a portable {type, code, version} pointer rather
// than a raw ID.
//
// `formatVersion` versions the *document shape itself* (this export
// format), independent of `schemaVersion` on the pack or on each
// definition -- so a future importer can reject a document produced by
// an incompatible format version before ever looking at its content
// (section 28's "schema versionado").

export const CURRICULUM_PACK_EXPORT_FORMAT_VERSION = '1.0.0';

export const portableRefSchema = z.object({
  type: curriculumPackDefinitionTypeSchema,
  code: z.string().min(1),
  version: z.number().int().min(1),
});

export type PortableRef = z.infer<typeof portableRefSchema>;

export const exportedDefinitionItemSchema = z.object({
  definitionType: curriculumPackDefinitionTypeSchema,
  code: z.string().min(1),
  version: z.number().int().min(1),
  status: z.string(),
  schemaVersion: z.string(),
  content: z.record(z.string(), z.unknown()),
});

export type ExportedDefinitionItem = z.infer<typeof exportedDefinitionItemSchema>;

export const exportedPackDependencySchema = z.object({
  dependsOnCode: z.string().min(1),
  dependsOnVersion: z.number().int().min(1),
});

export type ExportedPackDependency = z.infer<typeof exportedPackDependencySchema>;

export const curriculumPackExportDocumentSchema = z.object({
  formatVersion: z.string().min(1),
  exportedAt: z.string(),
  pack: z.object({
    code: z.string().min(1),
    version: z.number().int().min(1),
    status: z.string(),
    schemaVersion: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()),
  }),
  dependencies: z.array(exportedPackDependencySchema),
  items: z.array(exportedDefinitionItemSchema),
});

export type CurriculumPackExportDocument = z.infer<typeof curriculumPackExportDocumentSchema>;
