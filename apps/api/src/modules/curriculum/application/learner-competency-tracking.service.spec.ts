import { BadRequestException } from '@nestjs/common';
import type { LearnerCompetencyTrackingRepository } from '../infrastructure/learner-competency-tracking.repository.js';
import type { AchievementRepository } from '../infrastructure/achievement.repository.js';
import { LearnerCompetencyTrackingService } from './learner-competency-tracking.service.js';

describe('LearnerCompetencyTrackingService progression policy activation', () => {
  const ids = { learnerId: '00000000-0000-4000-8000-000000000001', curriculumDefinitionId: '00000000-0000-4000-8000-000000000002', progressionPolicyId: '00000000-0000-4000-8000-000000000003', competencyDefinitionId: '00000000-0000-4000-8000-000000000004' };
  const setup = (policy: unknown, rubric: unknown) => {
    const repository = {
      findLearnerFamilyId: jest.fn().mockResolvedValue('family'),
      findCurriculumDefinitionCompetencies: jest.fn().mockResolvedValue([{ competencyDefinitionId: ids.competencyDefinitionId, competencyVersion: 1 }]),
      findProgressionPolicy: jest.fn().mockResolvedValue(policy),
      findRubricForProgressionValidation: jest.fn().mockResolvedValue(rubric),
      findExistingTrackingKeys: jest.fn().mockResolvedValue(new Set()),
      createMany: jest.fn(), findByLearnerAndCompetencies: jest.fn().mockResolvedValue([]),
    };
    return { repository, service: new LearnerCompetencyTrackingService(repository as unknown as LearnerCompetencyTrackingRepository, {} as AchievementRepository) };
  };

  it('accepts a published rubric policy only when all exact published rubric criteria have in-range thresholds', async () => {
    const rubricId = '00000000-0000-4000-8000-000000000005';
    const policy = { id: ids.progressionPolicyId, version: 2, status: 'PUBLISHED', schemaVersion: '1.0.0', policyType: 'EVIDENCE_RUBRIC', curriculumDefinitionId: null, competencyDefinitionId: null,
      rules: { minimumEvidenceCount: 1, rubricDefinitionId: rubricId, rubricVersion: 3, minimumScoresByCriterion: { '00000000-0000-4000-8000-000000000006': 3 }, requireHumanApproval: true, prerequisites: [] } };
    const { service, repository } = setup(policy, { version: 3, status: 'PUBLISHED', schemaVersion: '1.0.0', criteria: [{ id: '00000000-0000-4000-8000-000000000006', scaleMin: 1, scaleMax: 5 }] });
    await service.activateCurriculumForLearner('family', ids);
    expect(repository.createMany).toHaveBeenCalledWith('family', ids.learnerId, ids.curriculumDefinitionId, expect.any(Array), { id: ids.progressionPolicyId, version: 2 }, expect.any(Array));
  });

  it('rejects a rubric policy whose criteria thresholds do not exactly match the published rubric', async () => {
    const policy = { id: ids.progressionPolicyId, version: 2, status: 'PUBLISHED', schemaVersion: '1.0.0', policyType: 'EVIDENCE_RUBRIC', curriculumDefinitionId: null, competencyDefinitionId: null,
      rules: { minimumEvidenceCount: 1, rubricDefinitionId: '00000000-0000-4000-8000-000000000005', rubricVersion: 3, minimumScoresByCriterion: { '00000000-0000-4000-8000-000000000006': 3 }, requireHumanApproval: true, prerequisites: [] } };
    const { service, repository } = setup(policy, { version: 3, status: 'PUBLISHED', schemaVersion: '1.0.0', criteria: [{ id: '00000000-0000-4000-8000-000000000007', scaleMin: 1, scaleMax: 5 }] });
    await expect(service.activateCurriculumForLearner('family', ids)).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createMany).not.toHaveBeenCalled();
  });
});
