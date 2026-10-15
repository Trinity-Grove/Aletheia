import { describe, expect, it } from 'vitest';
import { resolvePrivacyProfile, resolvePrivacyRegime } from './privacy-regime.js';

describe('resolvePrivacyRegime', () => {
  it('resolves Brazil to LGPD', () => {
    expect(resolvePrivacyRegime('BRA')).toBe('LGPD');
  });

  it('resolves an EU member state to GDPR', () => {
    expect(resolvePrivacyRegime('DEU')).toBe('GDPR');
    expect(resolvePrivacyRegime('FRA')).toBe('GDPR');
  });

  it('resolves the USA to COPPA', () => {
    expect(resolvePrivacyRegime('USA')).toBe('COPPA');
  });

  it('resolves Uruguay, Argentina, Mexico and Colombia to their own regimes', () => {
    expect(resolvePrivacyRegime('URY')).toBe('URUGUAY');
    expect(resolvePrivacyRegime('ARG')).toBe('ARGENTINA');
    expect(resolvePrivacyRegime('MEX')).toBe('MEXICO');
    expect(resolvePrivacyRegime('COL')).toBe('COLOMBIA');
  });

  it('resolves any other country to GENERIC', () => {
    expect(resolvePrivacyRegime('JPN')).toBe('GENERIC');
    expect(resolvePrivacyRegime('AUS')).toBe('GENERIC');
  });

  it('resolves countries to descriptive privacy profiles without changing consent regimes', () => {
    expect(resolvePrivacyProfile('BRA').code).toBe('GDPR_LIKE');
    expect(resolvePrivacyProfile('DEU').code).toBe('GDPR_LIKE');
    expect(resolvePrivacyProfile('USA').code).toBe('SECTORAL_FRAGMENTED');
    expect(resolvePrivacyProfile('IND').code).toBe('DATA_SOVEREIGNTY');
    expect(resolvePrivacyProfile('ZZZ').code).toBe('LIMITED');
  });

  it('normalizes country codes before resolving both catalogs', () => {
    expect(resolvePrivacyProfile(' bra ').code).toBe('GDPR_LIKE');
    expect(resolvePrivacyRegime(' bra ')).toBe('LGPD');
  });
});
