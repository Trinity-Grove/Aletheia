import { describe, expect, it } from 'vitest';
import {
  adoptCommunityActivitySchema,
  communityActivityResponseSchema,
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
});
