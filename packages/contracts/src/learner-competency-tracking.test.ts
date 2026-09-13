import { describe, expect, it } from 'vitest';
import {
  activateCurriculumForLearnerResultSchema,
  activateCurriculumForLearnerSchema,
  learnerCompetencyTrackingResponseSchema,
} from './learner-competency-tracking.js';

const LEARNER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const CURRICULUM_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const FAMILY_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const COMPETENCY_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
const DOMAIN_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
const TRACKING_ID = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';

describe('Learner Competency Tracking Contracts', () => {
  it('validates an activation request', () => {
    const parsed = activateCurriculumForLearnerSchema.parse({
      learnerId: LEARNER_ID,
      curriculumDefinitionId: CURRICULUM_ID,
    });
    expect(parsed.learnerId).toBe(LEARNER_ID);
    expect(parsed.curriculumDefinitionId).toBe(CURRICULUM_ID);
  });

  it('rejects an activation request with a non-uuid learnerId', () => {
    expect(() =>
      activateCurriculumForLearnerSchema.parse({ learnerId: 'not-a-uuid', curriculumDefinitionId: CURRICULUM_ID }),
    ).toThrow();
  });

  it('validates a tracking response with the denormalized competency display fields', () => {
    const parsed = learnerCompetencyTrackingResponseSchema.parse({
      id: TRACKING_ID,
      familyId: FAMILY_ID,
      learnerId: LEARNER_ID,
      competencyDefinitionId: COMPETENCY_ID,
      competencyVersion: 1,
      curriculumDefinitionId: CURRICULUM_ID,
      status: 'ACTIVE',
      activatedAt: '2026-09-13T00:00:00.000Z',
      retiredAt: null,
      createdAt: '2026-09-13T00:00:00.000Z',
      competency: {
        code: 'TEST.COMPETENCY',
        title: 'Test Competency',
        domainId: DOMAIN_ID,
        domainTitle: 'Test Domain',
      },
    });
    expect(parsed.status).toBe('ACTIVE');
    expect(parsed.competency.domainTitle).toBe('Test Domain');
  });

  it('rejects an invalid status value', () => {
    expect(() =>
      learnerCompetencyTrackingResponseSchema.parse({
        id: TRACKING_ID,
        familyId: FAMILY_ID,
        learnerId: LEARNER_ID,
        competencyDefinitionId: COMPETENCY_ID,
        competencyVersion: 1,
        curriculumDefinitionId: null,
        status: 'BOGUS',
        activatedAt: '2026-09-13T00:00:00.000Z',
        createdAt: '2026-09-13T00:00:00.000Z',
        competency: { code: 'X', title: 'X', domainId: DOMAIN_ID, domainTitle: 'X' },
      }),
    ).toThrow();
  });

  it('validates an activation result summarizing created vs already-active counts', () => {
    const parsed = activateCurriculumForLearnerResultSchema.parse({
      createdCount: 2,
      alreadyActiveCount: 1,
      trackings: [],
    });
    expect(parsed.createdCount).toBe(2);
    expect(parsed.alreadyActiveCount).toBe(1);
  });
});
