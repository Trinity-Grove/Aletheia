import { describe, expect, it } from 'vitest';
import { createEvidenceTypeDefinitionSchema, evidenceTypeCatalogEntrySchema } from './evidence-type-definition.js';

const EVIDENCE_TYPE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

describe('Evidence Type Definition Contracts', () => {
  it('validates a minimal evidence type with defaults', () => {
    const parsed = createEvidenceTypeDefinitionSchema.parse({
      code: 'PHOTO',
      name: 'Foto',
    });
    expect(parsed.status).toBe('DRAFT');
    expect(parsed.version).toBe(1);
  });

  it('validates an evidence type with full metadata', () => {
    const parsed = createEvidenceTypeDefinitionSchema.parse({
      code: 'VIDEO',
      name: 'Vídeo',
      metadata: {
        acceptedMimeTypes: ['video/mp4', 'video/webm'],
        maxSizeMb: 500,
        requiresValidation: true,
      },
    });
    expect(parsed.metadata.acceptedMimeTypes).toEqual(['video/mp4', 'video/webm']);
    expect(parsed.metadata.requiresValidation).toBe(true);
  });

  it('rejects a lowercase evidence type code', () => {
    expect(() =>
      createEvidenceTypeDefinitionSchema.parse({ code: 'photo', name: 'Foto' }),
    ).toThrow();
  });

  it('rejects a non-positive maxSizeMb', () => {
    expect(() =>
      createEvidenceTypeDefinitionSchema.parse({
        code: 'PHOTO',
        name: 'Foto',
        metadata: { maxSizeMb: 0 },
      }),
    ).toThrow();
  });

  it('validates a family-facing catalog entry with a real FK id', () => {
    const parsed = evidenceTypeCatalogEntrySchema.parse({
      id: EVIDENCE_TYPE_ID,
      code: 'PHOTO',
      name: 'Foto',
      description: null,
    });
    expect(parsed.id).toBe(EVIDENCE_TYPE_ID);
  });
});
