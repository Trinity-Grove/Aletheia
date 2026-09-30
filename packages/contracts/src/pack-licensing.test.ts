import { describe, expect, it } from 'vitest';
import {
  PACK_LICENSE_CODES,
  packLicenseCodeSchema,
  PACK_PRICING_MODELS,
  packPricingModelSchema,
  packProvenanceSchema,
} from './pack-licensing.js';

describe('Pack Licensing & Provenance Schemas', () => {
  it('validates supported license codes', () => {
    expect(PACK_LICENSE_CODES).toContain('CC_BY_4_0');
    expect(PACK_LICENSE_CODES).toContain('PUBLIC_DOMAIN');
    expect(PACK_LICENSE_CODES).toContain('ALETHEIA_OPEN_COMMUNITY');
    expect(packLicenseCodeSchema.safeParse('CC_BY_4_0').success).toBe(true);
    expect(packLicenseCodeSchema.safeParse('INVALID_LICENSE').success).toBe(false);
  });

  it('validates pricing models', () => {
    expect(PACK_PRICING_MODELS).toContain('FREE');
    expect(PACK_PRICING_MODELS).toContain('VOLUNTARY_SUPPORT');
    expect(packPricingModelSchema.safeParse('FREE').success).toBe(true);
    expect(packPricingModelSchema.safeParse('VOLUNTARY_SUPPORT').success).toBe(true);
    expect(packPricingModelSchema.safeParse('SUBSCRIPTION').success).toBe(false);
  });

  it('validates provenance structure including sha256 checksum', () => {
    const validProvenance = {
      authorDisplayName: 'Professor João Silva',
      authorOrganization: 'Instituto Clássico',
      originUrl: 'https://exemplo.org/pacote-trivium',
      sourceRepository: 'https://github.com/exemplo/trivium',
      checksumSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
      publishedAt: '2026-09-29T12:00:00.000Z',
    };
    const res = packProvenanceSchema.safeParse(validProvenance);
    expect(res.success).toBe(true);

    const invalidHash = {
      ...validProvenance,
      checksumSha256: 'not-a-valid-sha256',
    };
    expect(packProvenanceSchema.safeParse(invalidHash).success).toBe(false);
  });
});
