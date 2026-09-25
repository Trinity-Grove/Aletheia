import { describe, expect, it } from 'vitest';
import { resolvePrivacyRegime } from './privacy-regime.js';

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
});
