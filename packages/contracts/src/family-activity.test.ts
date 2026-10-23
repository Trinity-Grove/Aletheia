import { describe, expect, it } from 'vitest';
import { createFamilyActivitySchema, familyActivityResponseSchema } from './family-activity.js';

describe('family activity contracts', () => {
  it('requires a name and defaults visibility to PRIVATE', () => {
    const result = createFamilyActivitySchema.safeParse({ name: 'Passeio no parque' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.visibility).toBe('PRIVATE');
      expect(result.data.evidenceRequirementMode).toBe('ANY');
      expect(result.data.supervisionRequired).toBe(false);
    }
  });

  it('accepts an explicit PUBLIC visibility choice by the creator', () => {
    const result = createFamilyActivitySchema.safeParse({
      name: 'Passeio no parque',
      visibility: 'PUBLIC',
      anonymousSharingConsent: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.visibility).toBe('PUBLIC');
    }
  });

  it('requires explicit anonymous-sharing consent for public activities', () => {
    expect(createFamilyActivitySchema.safeParse({
      name: 'Passeio no parque',
      visibility: 'PUBLIC',
    }).success).toBe(false);

    expect(createFamilyActivitySchema.safeParse({
      name: 'Passeio no parque',
      visibility: 'PUBLIC',
      anonymousSharingConsent: false,
    }).success).toBe(false);
  });

  it('retains and validates community theme metadata', () => {
    const result = createFamilyActivitySchema.safeParse({
      name: 'Herbário caseiro',
      metadata: {
        theme: 'NATURE_STUDY',
        materials: ['Papel'],
        steps: ['Prensar folhas'],
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata).toMatchObject({
        theme: 'NATURE_STUDY',
        materials: ['Papel'],
        steps: ['Prensar folhas'],
      });
    }

    expect(createFamilyActivitySchema.safeParse({
      name: 'Ideia com tema inválido',
      metadata: { theme: 'UNKNOWN_THEME' },
    }).success).toBe(false);
  });

  it('rejects an invalid visibility value', () => {
    const result = createFamilyActivitySchema.safeParse({
      name: 'Passeio no parque',
      visibility: 'SHARED',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = createFamilyActivitySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects ageMax below ageMin', () => {
    const result = createFamilyActivitySchema.safeParse({
      name: 'Passeio no parque',
      ageMin: 10,
      ageMax: 5,
    });
    expect(result.success).toBe(false);
  });

  it('validates a full response payload', () => {
    const result = familyActivityResponseSchema.safeParse({
      id: '11111111-1111-4111-8111-111111111111',
      familyId: '22222222-2222-4222-8222-222222222222',
      name: 'Passeio no parque',
      description: null,
      ageMin: 5,
      ageMax: 10,
      estimatedDurationMinutes: 60,
      supervisionRequired: true,
      riskLevel: 'low',
      evidenceRequirementMode: 'ANY',
      metadata: {},
      visibility: 'PRIVATE',
      createdAt: '2026-09-24T00:00:00.000Z',
      updatedAt: '2026-09-24T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });
});
