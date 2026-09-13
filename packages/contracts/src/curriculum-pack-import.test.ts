import { describe, expect, it } from 'vitest';
import { importCurriculumPackRequestSchema, curriculumPackImportReportSchema } from './curriculum-pack-import.js';

const minimalDocument = {
  formatVersion: '1.0.0',
  exportedAt: new Date().toISOString(),
  pack: {
    code: 'TEST_PACK',
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: '1.0.0',
    name: 'Test Pack',
    metadata: {},
  },
  dependencies: [],
  items: [],
};

describe('Curriculum Pack Import Contracts', () => {
  it('validates an import request with dryRun defaulting to false', () => {
    const parsed = importCurriculumPackRequestSchema.parse({ document: minimalDocument });
    expect(parsed.dryRun).toBe(false);
  });

  it('accepts an explicit dryRun: true', () => {
    const parsed = importCurriculumPackRequestSchema.parse({ document: minimalDocument, dryRun: true });
    expect(parsed.dryRun).toBe(true);
  });

  it('rejects a request with a malformed document', () => {
    expect(() =>
      importCurriculumPackRequestSchema.parse({ document: { not: 'a valid document' } }),
    ).toThrow();
  });

  it('validates a well-formed import report', () => {
    const report = {
      dryRun: true,
      pack: { code: 'TEST_PACK', version: 1, outcome: 'WOULD_CREATE' },
      wouldCreate: [{ type: 'LearningDomain', code: 'X', version: 1 }],
      created: [],
      conflicts: [],
      missingDependencies: [],
      blocked: [],
    };
    const parsed = curriculumPackImportReportSchema.parse(report);
    expect(parsed.pack.outcome).toBe('WOULD_CREATE');
  });
});
