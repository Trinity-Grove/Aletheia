import { ForbiddenException } from '@nestjs/common';
import type { AssessmentResultRepository } from '../infrastructure/assessment-result.repository.js';
import type { FamilyPublicApi } from '../../families/application/public-api.js';
import type { MentorGrantPublicApi } from '../../mentors/application/public-api.js';
import { AssessmentResultService } from './assessment-result.service.js';

describe('AssessmentResultService actor authorization', () => {
  const input = { learnerId: 'learner', rubricDefinitionId: 'rubric', assessorType: 'MENTOR', scores: [{ rubricCriterionId: 'criterion', score: 4 }] };

  it('allows an assigned mentor only when the active grant matches the learner and records the authenticated actor', async () => {
    const repository = {
      findLearnerFamilyId: jest.fn().mockResolvedValue('family'),
      findRubricDefinitionVersion: jest.fn().mockResolvedValue(1),
      findRubricCriterionIdsForRubric: jest.fn().mockResolvedValue(new Set(['criterion'])),
      create: jest.fn().mockResolvedValue({ id: 'assessment', scores: [], createdAt: new Date(), familyId: 'family', learnerId: 'learner', evidenceSubmissionId: null, rubricDefinitionId: 'rubric', rubricVersion: 1, assessorType: 'MENTOR', assessorUserId: 'mentor', notes: null }),
    };
    const mentorApi = { canMentorAssess: jest.fn().mockResolvedValue(true) };
    const service = new AssessmentResultService(repository as unknown as AssessmentResultRepository,
      { getFamilyMemberRole: jest.fn().mockResolvedValue(null) } as unknown as FamilyPublicApi,
      mentorApi as unknown as MentorGrantPublicApi);
    await service.createAssessmentResult('family', 'mentor', input);
    expect(mentorApi.canMentorAssess).toHaveBeenCalledWith('mentor', 'family', 'learner');
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ assessorUserId: 'mentor' }));
  });

  it('rejects an unrelated actor before creating an assessment', async () => {
    const repository = { findLearnerFamilyId: jest.fn().mockResolvedValue('family'), create: jest.fn() };
    const service = new AssessmentResultService(repository as unknown as AssessmentResultRepository,
      { getFamilyMemberRole: jest.fn().mockResolvedValue(null) } as unknown as FamilyPublicApi,
      { canMentorAssess: jest.fn().mockResolvedValue(false) } as unknown as MentorGrantPublicApi);
    await expect(service.createAssessmentResult('family', 'stranger', input)).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
