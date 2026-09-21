import { describe, expect, it } from 'vitest';
import { ISO3_COUNTRIES, findCountryByCode, isValidCountryCode } from './countries.js';

describe('countries (ISO 3166-1 alpha-3)', () => {
  it('contains all standard sovereign countries and territories (> 240)', () => {
    expect(ISO3_COUNTRIES.length).toBeGreaterThan(240);
  });

  it('contains Brazil (BRA), Portugal (PRT), United States (USA), Spain (ESP)', () => {
    expect(findCountryByCode('BRA')).toEqual({ code: 'BRA', name: 'Brasil' });
    expect(findCountryByCode('PRT')).toEqual({ code: 'PRT', name: 'Portugal' });
    expect(findCountryByCode('USA')).toEqual({ code: 'USA', name: 'Estados Unidos' });
    expect(findCountryByCode('ESP')).toEqual({ code: 'ESP', name: 'Espanha' });
  });

  it('validates case-insensitively and with whitespace tolerance', () => {
    expect(isValidCountryCode('bra')).toBe(true);
    expect(isValidCountryCode(' bra ')).toBe(true);
    expect(isValidCountryCode('XYZ999')).toBe(false);
  });

  it('has valid 3-letter codes for all entries', () => {
    for (const country of ISO3_COUNTRIES) {
      expect(country.code).toMatch(/^[A-Z]{3}$/);
      expect(country.name.length).toBeGreaterThan(1);
    }
  });

  it('has unique country codes', () => {
    const codes = ISO3_COUNTRIES.map((c) => c.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });
});
