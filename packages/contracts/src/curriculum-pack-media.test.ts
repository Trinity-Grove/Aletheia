import { describe, expect, it } from 'vitest';
import { curriculumPackMediaResponseSchema } from './curriculum-pack-media.js';

describe('curriculum pack media contract', () => {
  it('accepts a public external media response without private storage fields', () => {
    const result = curriculumPackMediaResponseSchema.parse({
      id: '00000000-0000-4000-8000-000000000001',
      curriculumPackId: '00000000-0000-4000-8000-000000000002',
      mediaType: 'VIDEO',
      sourceType: 'EXTERNAL_URL',
      provider: 'YOUTUBE',
      title: 'Aula aberta',
      description: null,
      url: 'https://www.youtube.com/watch?v=123',
      mimeType: null,
      sizeBytes: null,
      createdAt: '2026-10-15T00:00:00.000Z',
      updatedAt: '2026-10-15T00:00:00.000Z',
    });

    expect(result.url).toContain('youtube.com');
    expect('storageKey' in result).toBe(false);
    expect('sourceFamilyMediaId' in result).toBe(false);
  });

  it('rejects a response with private storage namespace data', () => {
    expect(() =>
      curriculumPackMediaResponseSchema.parse({
        id: '00000000-0000-4000-8000-000000000001',
        curriculumPackId: '00000000-0000-4000-8000-000000000002',
        mediaType: 'DOCUMENT',
        sourceType: 'UPLOAD',
        provider: null,
        title: 'Guia',
        description: null,
        url: 'https://storage.example/file.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 100,
        storageKey: 'families/private/curriculum-packs/file.pdf',
        createdAt: '2026-10-15T00:00:00.000Z',
        updatedAt: '2026-10-15T00:00:00.000Z',
      }),
    ).toThrow();
  });
});
