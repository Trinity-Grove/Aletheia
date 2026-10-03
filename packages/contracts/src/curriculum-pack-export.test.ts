import { describe, expect, it } from 'vitest';
import { curriculumPackExportDocumentSchema, portableRefSchema } from './curriculum-pack-export.js';

describe('Curriculum Pack Export Contracts', () => {
  it('validates a minimal, well-formed export document', () => {
    const doc = {
      formatVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      pack: {
        code: 'TEST_PACK',
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        name: 'Test Pack',
        description: null,
        metadata: {},
      },
      dependencies: [],
      items: [
        {
          definitionType: 'LearningDomain',
          code: 'TEST_DOMAIN',
          version: 1,
          status: 'PUBLISHED',
          schemaVersion: '1.0.0',
          content: { name: 'x', description: null, parentRef: null, metadata: {} },
        },
      ],
    };
    const parsed = curriculumPackExportDocumentSchema.parse(doc);
    expect(parsed.items).toHaveLength(1);
  });

  it('rejects a document with an unknown definitionType', () => {
    expect(() =>
      curriculumPackExportDocumentSchema.parse({
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
        items: [{ definitionType: 'NotARealType', code: 'X', version: 1, status: 'PUBLISHED', schemaVersion: '1.0.0', content: {} }],
      }),
    ).toThrow();
  });

  it('validates a portable ref', () => {
    const parsed = portableRefSchema.parse({ type: 'CompetencyDefinition', code: 'X', version: 2 });
    expect(parsed.version).toBe(2);
  });

  it('validates export document with license, pricingModel, provenance, and checksum', () => {
    const doc = {
      formatVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      checksumSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
      pack: {
        code: 'TEST_PACK',
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        name: 'Test Pack',
        description: null,
        metadata: {},
        license: 'CC_BY_4_0',
        pricingModel: 'VOLUNTARY_SUPPORT',
        provenance: {
          authorDisplayName: 'Professor João',
          checksumSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
          publishedAt: '2026-09-29T12:00:00.000Z',
        },
      },
      dependencies: [],
      items: [],
    };
    const parsed = curriculumPackExportDocumentSchema.parse(doc);
    expect(parsed.pack.license).toBe('CC_BY_4_0');
    expect(parsed.pack.pricingModel).toBe('VOLUNTARY_SUPPORT');
    expect(parsed.pack.provenance?.authorDisplayName).toBe('Professor João');
    expect(parsed.checksumSha256).toBe('a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90');
  });
});

