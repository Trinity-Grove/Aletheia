import { describe, expect, it } from 'vitest';
import {
  adoptCommunityActivitySchema,
  communityActivityResponseSchema,
  communityIdeaThemeSchema,
} from './community-activity.js';

describe('community activity contracts', () => {
  it('does not require or expose the source family in the public catalog', () => {
    const parsed = communityActivityResponseSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Observação do céu',
      description: 'Observe as fases da Lua.',
      ageMin: 7,
      ageMax: 12,
      estimatedDurationMinutes: 30,
      supervisionRequired: true,
      riskLevel: null,
      evidenceRequirementMode: 'ANY',
      metadata: {},
      createdAt: '2026-10-15T00:00:00.000Z',
      updatedAt: '2026-10-15T00:00:00.000Z',
    });

    expect(parsed).not.toHaveProperty('familyId');
  });

  it('validates an adoption request by source activity id', () => {
    expect(adoptCommunityActivitySchema.parse({
      sourceActivityId: '11111111-1111-4111-8111-111111111111',
    })).toEqual({ sourceActivityId: '11111111-1111-4111-8111-111111111111' });
  });

  it('validates community idea themes and metadata payload', () => {
    expect(communityIdeaThemeSchema.parse('NATURE_STUDY')).toBe('NATURE_STUDY');
    expect(communityIdeaThemeSchema.parse('LIVING_BOOKS')).toBe('LIVING_BOOKS');
    expect(() => communityIdeaThemeSchema.parse('INVALID_THEME')).toThrow();

    const activity = communityActivityResponseSchema.parse({
      id: 'a0000000-0000-4000-8000-000000000001',
      name: 'Diário da Natureza: Coleta de Folhas',
      description: 'Passeio no parque para desenhar folhas de outono.',
      ageMin: 5,
      ageMax: 10,
      estimatedDurationMinutes: 45,
      supervisionRequired: true,
      riskLevel: 'LOW',
      evidenceRequirementMode: 'ANY',
      metadata: {
        theme: 'NATURE_STUDY',
        materials: ['Caderno sem pauta', 'Lápis de cor', 'Lupa'],
        isSeed: true,
      },
      createdAt: '2026-10-16T00:00:00.000Z',
      updatedAt: '2026-10-16T00:00:00.000Z',
    });
    expect(activity.name).toBe('Diário da Natureza: Coleta de Folhas');
  });
});
