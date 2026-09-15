import { BASE_EVIDENCE_TYPE_SEED_ROWS } from './evidence-type-definition.seed-data.js';

describe('BASE_EVIDENCE_TYPE_SEED_ROWS', () => {
  it('includes at least the 7 kinds issue #96 section 9 requires', () => {
    const codes = BASE_EVIDENCE_TYPE_SEED_ROWS.map((row) => row.code);
    const requiredCodes = ['AUDIO', 'CERTIFICATE', 'FILE', 'OBSERVATION', 'PHOTO', 'TEXT', 'VIDEO'];
    for (const code of requiredCodes) {
      expect(codes).toContain(code);
    }
  });

  it('also includes PROJECT and LINK (issue #95 section 25)', () => {
    const codes = BASE_EVIDENCE_TYPE_SEED_ROWS.map((row) => row.code);
    expect(codes).toContain('PROJECT');
    expect(codes).toContain('LINK');
  });

  it('gives every row a human-readable name and description', () => {
    for (const row of BASE_EVIDENCE_TYPE_SEED_ROWS) {
      expect(row.name.length).toBeGreaterThan(0);
      expect(row.description.length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate codes', () => {
    const codes = BASE_EVIDENCE_TYPE_SEED_ROWS.map((row) => row.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
