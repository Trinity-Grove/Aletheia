import { z } from 'zod';
import { definitionStatusSchema, type DefinitionStatus } from './curriculum-definitions.js';

export const consentScopeSchema = z.enum(['FAMILY', 'LEARNER']);
export type ConsentScope = z.infer<typeof consentScopeSchema>;

export const consentActionSchema = z.enum(['GRANTED', 'REVOKED']);
export type ConsentAction = z.infer<typeof consentActionSchema>;

export const consentStatusSchema = z.enum(['ACTIVE', 'OUTDATED', 'REVOKED', 'PENDING']);
export type ConsentStatus = z.infer<typeof consentStatusSchema>;

export const createConsentDefinitionSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[A-Z0-9_]+$/, 'Code must contain uppercase letters, numbers, and underscores'),
  version: z.number().int().positive().default(1),
  scope: consentScopeSchema.default('FAMILY'),
  mandatory: z.boolean().default(false),
  title: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
  content: z.string().min(10),
  purposes: z.array(z.string().min(3)).min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateConsentDefinitionDto = z.infer<typeof createConsentDefinitionSchema>;
export type CreateConsentDefinitionInput = z.input<typeof createConsentDefinitionSchema>;

export const updateConsentDefinitionStatusSchema = z.object({
  status: definitionStatusSchema,
});

export type UpdateConsentDefinitionStatusDto = z.infer<typeof updateConsentDefinitionStatusSchema>;

export const grantConsentSchema = z.object({
  consentDefinitionId: z.string().uuid(),
  learnerId: z.string().uuid().optional(),
});

export type GrantConsentDto = z.infer<typeof grantConsentSchema>;

export const revokeConsentSchema = z.object({
  consentDefinitionId: z.string().uuid(),
  learnerId: z.string().uuid().optional(),
});

export type RevokeConsentDto = z.infer<typeof revokeConsentSchema>;

export interface ConsentDefinitionResponseDto {
  id: string;
  code: string;
  version: number;
  status: DefinitionStatus;
  schemaVersion: number;
  scope: ConsentScope;
  mandatory: boolean;
  title: string;
  description: string | null;
  content: string;
  purposes: string[];
  metadata: Record<string, unknown> | null;
  publishedAt: string | null;
  deprecatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentRecordResponseDto {
  id: string;
  familyId: string;
  learnerId: string | null;
  consentDefinitionId: string;
  action: ConsentAction;
  consentedByUserId: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface LearnerConsentStatusDto {
  learnerId: string;
  learnerName: string;
  status: ConsentStatus;
  lastRecord: ConsentRecordResponseDto | null;
}

export interface TermConsentOverviewDto {
  definition: ConsentDefinitionResponseDto;
  status: ConsentStatus;
  familyStatus?: ConsentStatus;
  learnerStatuses?: LearnerConsentStatusDto[];
  lastRecord?: ConsentRecordResponseDto | null;
}

export interface FamilyConsentOverviewDto {
  familyId: string;
  terms: TermConsentOverviewDto[];
}

export interface ConsentComplianceCheckDto {
  compliant: boolean;
  pendingMandatoryTerms: ConsentDefinitionResponseDto[];
}
