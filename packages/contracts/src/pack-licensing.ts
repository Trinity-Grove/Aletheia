import { z } from 'zod';

export const PACK_LICENSE_CODES = [
  'CC_BY_4_0',
  'CC_BY_NC_4_0',
  'CC_BY_SA_4_0',
  'PUBLIC_DOMAIN',
  'ALETHEIA_OPEN_COMMUNITY',
  'ALETHEIA_EDITORIAL_STANDARD',
] as const;

export const packLicenseCodeSchema = z.enum(PACK_LICENSE_CODES);
export type PackLicenseCode = z.infer<typeof packLicenseCodeSchema>;

export const PACK_PRICING_MODELS = ['FREE', 'VOLUNTARY_SUPPORT'] as const;
export const packPricingModelSchema = z.enum(PACK_PRICING_MODELS);
export type PackPricingModel = z.infer<typeof packPricingModelSchema>;

export const packProvenanceSchema = z.object({
  authorDisplayName: z.string().min(1).max(150),
  authorOrganization: z.string().max(150).optional(),
  originUrl: z.string().url().max(500).optional(),
  sourceRepository: z.string().max(200).optional(),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/i, 'Checksum deve ser SHA-256 válido em hexadecimal'),
  publishedAt: z.string(),
});

export type PackProvenance = z.infer<typeof packProvenanceSchema>;
