import { describe, expect, it } from 'vitest';
import { achievementEvidenceSnapshotSchema } from './learner-competency-achievement.js';

describe('achievement evidence snapshot compatibility', () => {
  const uuid = '00000000-0000-4000-8000-000000000001';
  const legacy = { evidenceSubmissionIds: [uuid], prerequisites: [] };

  it('continues parsing historical snapshots without rubric or approval metadata', () => {
    expect(achievementEvidenceSnapshotSchema.parse(legacy)).toEqual(legacy);
  });

  it('accepts immutable rubric and approval provenance', () => {
    expect(achievementEvidenceSnapshotSchema.parse({
      ...legacy,
      rubricAssessment: { assessmentResultId: uuid, rubricDefinitionId: uuid, rubricVersion: 2,
        assessorUserId: uuid, assessedAt: '2026-10-16T10:00:00.000Z', scores: [{ rubricCriterionId: uuid, score: 4 }] },
      approval: { approvalEventId: uuid, decision: 'APPROVED', decidedByUserId: uuid, decidedAt: '2026-10-16T11:00:00.000Z' },
    })).toMatchObject({ rubricAssessment: { rubricVersion: 2 }, approval: { decision: 'APPROVED' } });
  });
});
