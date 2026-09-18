import { z } from 'zod';
import { definitionStatusSchema } from './curriculum-definitions.js';

// --- Jurisdiction definition (Aletheia issue #26) ---
//
// Versioned compliance rules engine, same Definition/Version pattern as the
// curriculum catalog (issue #96 Fase 0): code, version, status, schema_version,
// metadata, created_at, published_at, deprecated_at. A PUBLISHED row is never
// mutated in place -- a rule change is a new version, so a historical report
// generated against an older version keeps reading exactly the rule text it
// was generated against (issue #26 acceptance criterion: "Alterar uma regra
// não modifica relatórios históricos").
//
// `code` is a bare ISO 3166-1 alpha-2 country code today (e.g. "BR") but the
// pattern already accepts an optional subdivision suffix ("BR-SP", "US-CA")
// so state/province-level jurisdictions can be added later without a schema
// change -- issue #26's own first-slice note ("Brasil como
// organizador/complemento; depois Uruguai e estados priorizados dos EUA").
//
// This is deliberately NOT the full compliance-evaluation engine described in
// the issue (explainable family-situation assessment, immutable per-report
// rule snapshots, "estado desconhecido -> revisão necessária", auditable
// manual overrides). Those consume this catalog but are separate, larger
// pieces of work. This slice only stands up the versioned data model plus the
// Brasil seed the issue names as the dispatchable first delivery.
const JURISDICTION_CODE_REGEX = /^[A-Z]{2}(-[A-Z0-9]{1,3})?$/;

export const jurisdictionConfidenceLevelSchema = z.enum([
  // The parameter is drawn from a currently-stable, non-contested legal
  // source (e.g. a codified statute in force with no pending challenge).
  'ESTABLISHED',
  // The parameter reflects an area of active legal dispute or in-progress
  // legislation -- current best reading, not a settled outcome.
  'CONTESTED',
  // No reliable official source could be confirmed for this parameter at
  // seeding time; present to callers as "revisão necessária," not as fact.
  'UNCERTAIN',
]);

export type JurisdictionConfidenceLevel = z.infer<typeof jurisdictionConfidenceLevelSchema>;

// Compliance parameters tracked per jurisdiction. Every field is optional --
// a jurisdiction with an actively-evolving legal basis (Brasil, at seeding
// time) may only be able to state a subset with any confidence at all.
export const jurisdictionComplianceMetadataSchema = z.object({
  minInstructionalDays: z.number().int().min(0).max(366).nullish(),
  minInstructionalHours: z.number().min(0).max(3000).nullish(),
  minLearnerAge: z.number().int().min(0).max(25).nullish(),
  maxLearnerAge: z.number().int().min(0).max(25).nullish(),
  requiredSubjects: z.array(z.string().min(1).max(150)).default([]),
  evaluationRequirements: z.string().max(2000).nullish(),
  notificationRequirements: z.string().max(2000).nullish(),
  filingDeadlines: z.string().max(2000).nullish(),
  officialSource: z.string().max(500).nullish(),
  sourceCheckedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'sourceCheckedOn must be in YYYY-MM-DD format')
    .nullish(),
  confidenceLevel: jurisdictionConfidenceLevelSchema.default('UNCERTAIN'),
  legalBasisNotes: z.string().max(4000).nullish(),
});

export type JurisdictionComplianceMetadata = z.infer<typeof jurisdictionComplianceMetadataSchema>;

export const createJurisdictionDefinitionSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(10)
    .regex(JURISDICTION_CODE_REGEX, 'code must be an ISO 3166-1 alpha-2 country code, optionally with a subdivision suffix, e.g. BR or BR-SP'),
  version: z.number().int().min(1).default(1),
  status: definitionStatusSchema.default('DRAFT'),
  schemaVersion: z.string().min(1).max(20).default('1.0.0'),
  name: z.string().min(1).max(150),
  description: z.string().max(2000).nullish(),
  metadata: jurisdictionComplianceMetadataSchema.partial().default({}),
});

export type CreateJurisdictionDefinitionDto = z.input<typeof createJurisdictionDefinitionSchema>;
export type CreateJurisdictionDefinitionOutput = z.output<typeof createJurisdictionDefinitionSchema>;

export const jurisdictionDefinitionResponseSchema = z.object({
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

export type JurisdictionDefinitionResponseDto = z.infer<typeof jurisdictionDefinitionResponseSchema>;

// --- Compliance Evaluation Engine Contracts (Issue #26) ---

export const complianceEvaluationStatusSchema = z.enum([
  'COMPLIANT',
  'IN_PROGRESS',
  'NON_COMPLIANT',
  'REVIEW_NEEDED',
  'EXEMPT',
]);

export type ComplianceEvaluationStatus = z.infer<typeof complianceEvaluationStatusSchema>;

export const criterionTypeSchema = z.enum([
  'INSTRUCTIONAL_DAYS',
  'INSTRUCTIONAL_HOURS',
  'LEARNER_AGE',
  'REQUIRED_SUBJECTS',
  'EVALUATIONS',
  'NOTIFICATIONS',
]);

export type CriterionType = z.infer<typeof criterionTypeSchema>;

export const criterionEvaluationSchema = z.object({
  criterion: criterionTypeSchema,
  label: z.string(),
  status: complianceEvaluationStatusSchema,
  currentValue: z.union([z.string(), z.number()]).nullish(),
  targetValue: z.union([z.string(), z.number()]).nullish(),
  explanation: z.string(),
  ruleCitation: z.string().nullish(),
});

export type CriterionEvaluationDto = z.infer<typeof criterionEvaluationSchema>;

export const manualComplianceOverrideResponseSchema = z.object({
  id: z.string().uuid(),
  status: complianceEvaluationStatusSchema,
  reason: z.string(),
  overriddenByUserId: z.string().uuid(),
  overriddenByName: z.string().nullish(),
  createdAt: z.string(),
});

export type ManualComplianceOverrideResponseDto = z.infer<typeof manualComplianceOverrideResponseSchema>;

export const complianceEvaluationResponseSchema = z.object({
  learnerId: z.string().uuid(),
  learnerName: z.string(),
  academicYearId: z.string().uuid().nullish(),
  academicYearTitle: z.string().nullish(),
  overallStatus: complianceEvaluationStatusSchema,
  statusSummary: z.string(),
  jurisdiction: z.object({
    id: z.string().uuid().nullish(),
    code: z.string(),
    version: z.number().int(),
    name: z.string(),
    confidenceLevel: jurisdictionConfidenceLevelSchema,
    officialSource: z.string().nullish(),
    legalBasisNotes: z.string().nullish(),
  }),
  criteriaBreakdown: z.array(criterionEvaluationSchema),
  manualOverride: manualComplianceOverrideResponseSchema.nullish(),
  legalDisclaimer: z.string(),
  evaluatedAt: z.string(),
});

export type ComplianceEvaluationResponseDto = z.infer<typeof complianceEvaluationResponseSchema>;

export const createManualComplianceOverrideSchema = z.object({
  learnerId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  status: complianceEvaluationStatusSchema,
  reason: z.string().min(10, 'O motivo da sobreposição manual deve ter pelo menos 10 caracteres'),
});

export type CreateManualComplianceOverrideDto = z.infer<typeof createManualComplianceOverrideSchema>;

