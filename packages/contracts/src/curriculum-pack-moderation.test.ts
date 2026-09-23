import { describe, expect, it } from 'vitest';
import {
  curriculumPackModerationStatusSchema,
  authorTrustTierSchema,
  packReportReasonSchema,
  createPackReportSchema,
  adminModeratePackSchema,
  adminResolveReportSchema,
} from './curriculum-pack-moderation.js';

describe('CurriculumPack Moderation Contracts', () => {
  it('validates moderation status values', () => {
    expect(curriculumPackModerationStatusSchema.parse('DRAFT')).toBe('DRAFT');
    expect(curriculumPackModerationStatusSchema.parse('PENDING_REVIEW')).toBe('PENDING_REVIEW');
    expect(curriculumPackModerationStatusSchema.parse('APPROVED')).toBe('APPROVED');
    expect(curriculumPackModerationStatusSchema.parse('SUSPENDED')).toBe('SUSPENDED');
    expect(curriculumPackModerationStatusSchema.parse('REJECTED')).toBe('REJECTED');
    expect(() => curriculumPackModerationStatusSchema.parse('INVALID')).toThrow();
  });

  it('validates author trust tiers', () => {
    expect(authorTrustTierSchema.parse('NOVICE')).toBe('NOVICE');
    expect(authorTrustTierSchema.parse('VERIFIED')).toBe('VERIFIED');
    expect(authorTrustTierSchema.parse('TRUSTED')).toBe('TRUSTED');
    expect(() => authorTrustTierSchema.parse('SUPERUSER')).toThrow();
  });

  it('validates report reasons and rejects theological complaints', () => {
    expect(packReportReasonSchema.parse('SPAM_COMMERCIAL')).toBe('SPAM_COMMERCIAL');
    expect(packReportReasonSchema.parse('HARMFUL_INAPPROPRIATE')).toBe('HARMFUL_INAPPROPRIATE');
    expect(packReportReasonSchema.parse('COPYRIGHT_PLAGIARISM')).toBe('COPYRIGHT_PLAGIARISM');
    expect(packReportReasonSchema.parse('MALFORMED_QUALITY')).toBe('MALFORMED_QUALITY');
    expect(packReportReasonSchema.parse('OTHER')).toBe('OTHER');
    expect(() => packReportReasonSchema.parse('THEOLOGICAL_DISAGREEMENT')).toThrow();
  });

  it('validates createPackReport payload', () => {
    const valid = createPackReportSchema.parse({
      reason: 'HARMFUL_INAPPROPRIATE',
      details: 'Contém links externos impróprios para menores.',
    });
    expect(valid.reason).toBe('HARMFUL_INAPPROPRIATE');
  });

  it('validates adminModeratePack payload', () => {
    const valid = adminModeratePackSchema.parse({
      action: 'SUSPEND',
      notes: 'Suspensão preventiva devido a relatos de conteúdo malformado.',
    });
    expect(valid.action).toBe('SUSPEND');
  });

  it('validates adminResolveReport payload', () => {
    const valid = adminResolveReportSchema.parse({
      status: 'UPHELD',
      notes: 'Denúncia confirmada após auditoria técnica.',
    });
    expect(valid.status).toBe('UPHELD');
  });
});
