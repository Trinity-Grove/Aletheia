import { describe, expect, it } from 'vitest';
import {
  addFamilyCurriculumPackMediaSchema,
  familyCurriculumPackMediaResponseSchema,
} from './family-curriculum-pack-media.js';

describe('family curriculum pack media contracts', () => {
  it('accepts a YouTube external video', () => {
    const result = addFamilyCurriculumPackMediaSchema.parse({
      sourceType: 'EXTERNAL_URL',
      mediaType: 'VIDEO',
      title: 'Fractions lesson',
      url: 'https://www.youtube.com/watch?v=abc123',
    });

    expect(result.sourceType).toBe('EXTERNAL_URL');
    expect(result.url).toContain('youtube.com');
  });

  it('rejects insecure external URLs and upload records without a storage key', () => {
    expect(() =>
      addFamilyCurriculumPackMediaSchema.parse({
        sourceType: 'EXTERNAL_URL',
        mediaType: 'VIDEO',
        title: 'Unsafe',
        url: 'http://www.youtube.com/watch?v=abc123',
      }),
    ).toThrow();

    expect(() =>
      addFamilyCurriculumPackMediaSchema.parse({
        sourceType: 'UPLOAD',
        mediaType: 'IMAGE',
        title: 'Family photo',
      }),
    ).toThrow();

    expect(() =>
      addFamilyCurriculumPackMediaSchema.parse({
        sourceType: 'UPLOAD',
        mediaType: 'IMAGE',
        title: 'Unsafe path',
        storageKey: '../private/file.png',
      }),
    ).toThrow();
  });

  it('validates the media response shape', () => {
    const result = familyCurriculumPackMediaResponseSchema.parse({
      id: '00000000-0000-4000-8000-000000000001',
      familyCurriculumPackId: '00000000-0000-4000-8000-000000000002',
      mediaType: 'DOCUMENT',
      sourceType: 'UPLOAD',
      provider: null,
      title: 'Worksheet',
      description: null,
      url: null,
      storageKey: 'families/family-1/worksheet.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      createdAt: '2026-09-15T12:00:00.000Z',
      updatedAt: '2026-09-15T12:00:00.000Z',
    });

    expect(result.sizeBytes).toBe(1024);
  });
});
