import {
  BASE_THEOLOGICAL_TRADITION_SEED_ROWS,
  buildTheologicalTraditionSeedRows,
} from './theological-tradition.seed-data.js';

describe('TheologicalTraditionSeedData', () => {
  const EXPECTED_CODES = [
    'BAPTIST',
    'REFORMED_PRESBYTERIAN',
    'LUTHERAN',
    'ANGLICAN',
    'METHODIST_WESLEYAN',
    'PENTECOSTAL',
    'CONGREGATIONAL',
    'DISPENSATIONAL',
    'NON_DENOMINATIONAL',
  ];

  describe('BASE_THEOLOGICAL_TRADITION_SEED_ROWS', () => {
    it('contains all 9 baseline historical traditions', () => {
      const codes = BASE_THEOLOGICAL_TRADITION_SEED_ROWS.map((row) => row.code);
      for (const expected of EXPECTED_CODES) {
        expect(codes).toContain(expected);
      }
      expect(codes).toHaveLength(EXPECTED_CODES.length);
    });

    it('has no duplicate codes', () => {
      const codes = BASE_THEOLOGICAL_TRADITION_SEED_ROWS.map((row) => row.code);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it('gives every tradition a non-empty name and description', () => {
      for (const row of BASE_THEOLOGICAL_TRADITION_SEED_ROWS) {
        expect(row.name.trim().length).toBeGreaterThan(0);
        expect(row.description.trim().length).toBeGreaterThan(0);
      }
    });

    it('includes historical confessions and emphasis in metadata for each tradition', () => {
      for (const row of BASE_THEOLOGICAL_TRADITION_SEED_ROWS) {
        const metadata = row.metadata as { historicalConfessions?: string[]; emphasis?: string[] };
        expect(Array.isArray(metadata.historicalConfessions)).toBe(true);
        expect(metadata.historicalConfessions!.length).toBeGreaterThan(0);
        expect(Array.isArray(metadata.emphasis)).toBe(true);
        expect(metadata.emphasis!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('buildTheologicalTraditionSeedRows', () => {
    it('validates and outputs 9 PUBLISHED version-1 definition payloads', () => {
      const payloads = buildTheologicalTraditionSeedRows();
      expect(payloads).toHaveLength(9);

      for (const payload of payloads) {
        expect(payload.version).toBe(1);
        expect(payload.status).toBe('PUBLISHED');
        expect(payload.schemaVersion).toBe('1.0.0');
        expect(payload.code).toBeDefined();
        expect(payload.name).toBeDefined();
        expect(payload.description).toBeDefined();
        expect(payload.metadata).toBeDefined();
      }
    });
  });
});
