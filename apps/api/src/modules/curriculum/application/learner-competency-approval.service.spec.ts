import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { LearnerCompetencyApprovalRepository } from '../infrastructure/learner-competency-approval.repository.js';
import type { FamilyPublicApi } from '../../families/application/public-api.js';
import type { MentorGrantPublicApi } from '../../mentors/application/public-api.js';
import { LearnerCompetencyApprovalService } from './learner-competency-approval.service.js';

describe('LearnerCompetencyApprovalService', () => {
  const valid = { idempotencyKey: '00000000-0000-4000-8000-000000000001', decision: 'APPROVED' as const };

  it('validates decisions before delegating to the trusted persistence boundary', async () => {
    const recordDecision = jest.fn().mockResolvedValue({ id: 'event' });
    const service = new LearnerCompetencyApprovalService({ recordDecision } as unknown as LearnerCompetencyApprovalRepository, {} as FamilyPublicApi, {} as MentorGrantPublicApi);
    await expect(service.record('family', 'tracking', 'actor', valid)).resolves.toEqual({ id: 'event' });
    expect(recordDecision).toHaveBeenCalledWith('family', 'tracking', 'actor', valid);
  });

  it('rejects a return without a reason before persistence', async () => {
    const recordDecision = jest.fn();
    const service = new LearnerCompetencyApprovalService({ recordDecision } as unknown as LearnerCompetencyApprovalRepository, {} as FamilyPublicApi, {} as MentorGrantPublicApi);
    expect(() => service.record('family', 'tracking', 'actor', { ...valid, decision: 'RETURNED' })).toThrow(BadRequestException);
    expect(recordDecision).not.toHaveBeenCalled();
  });

  it.each(['OWNER_GUARDIAN', 'GUARDIAN', 'CO_GUARDIAN'])('allows family approver role %s', async (role) => {
    const recordDecision = jest.fn().mockResolvedValue({ id: 'event' });
    const getFamilyMemberRole = jest.fn().mockResolvedValue(role);
    const service = new LearnerCompetencyApprovalService(
      { recordDecision, findApprovalTrackingScope: jest.fn().mockResolvedValue({ familyId: 'family', learnerId: 'learner' }) } as unknown as LearnerCompetencyApprovalRepository,
      { getFamilyMemberRole } as unknown as FamilyPublicApi,
      { canMentorApproveProgression: jest.fn() } as unknown as MentorGrantPublicApi,
    );
    await expect(service.recordForFamily('family', 'tracking', 'actor', valid)).resolves.toEqual({ id: 'event' });
    expect(recordDecision).toHaveBeenCalledWith('family', 'tracking', 'actor', valid);
  });

  it.each(['EDUCATOR', null])('denies non-approver family role %s', async (role) => {
    const recordDecision = jest.fn();
    const service = new LearnerCompetencyApprovalService(
      { recordDecision, findApprovalTrackingScope: jest.fn() } as unknown as LearnerCompetencyApprovalRepository,
      { getFamilyMemberRole: jest.fn().mockResolvedValue(role) } as unknown as FamilyPublicApi,
      { canMentorApproveProgression: jest.fn() } as unknown as MentorGrantPublicApi,
    );
    await expect(service.recordForFamily('family', 'tracking', 'actor', valid)).rejects.toBeInstanceOf(ForbiddenException);
    expect(recordDecision).not.toHaveBeenCalled();
  });

  it('authorizes mentor approval only for the tracking’s exact grant scope and uses the authenticated actor', async () => {
    const recordDecision = jest.fn().mockResolvedValue({ id: 'event' });
    const canMentorApproveProgression = jest.fn().mockResolvedValue(true);
    const repository = { recordDecision, findApprovalTrackingScope: jest.fn().mockResolvedValue({ familyId: 'family-a', learnerId: 'learner-a' }) };
    const service = new LearnerCompetencyApprovalService(
      repository as unknown as LearnerCompetencyApprovalRepository,
      {} as FamilyPublicApi,
      { canMentorApproveProgression } as unknown as MentorGrantPublicApi,
    );
    await service.recordForMentor('tracking', 'authenticated-mentor', valid);
    expect(canMentorApproveProgression).toHaveBeenCalledWith('authenticated-mentor', 'family-a', 'learner-a');
    expect(recordDecision).toHaveBeenCalledWith('family-a', 'tracking', 'authenticated-mentor', valid, 'authenticated-mentor');
  });

  it('denies mentor approval for an absent or unauthorized grant without writing a decision', async () => {
    const recordDecision = jest.fn();
    const service = new LearnerCompetencyApprovalService(
      { recordDecision, findApprovalTrackingScope: jest.fn().mockResolvedValue({ familyId: 'family-a', learnerId: 'learner-a' }) } as unknown as LearnerCompetencyApprovalRepository,
      {} as FamilyPublicApi,
      { canMentorApproveProgression: jest.fn().mockResolvedValue(false) } as unknown as MentorGrantPublicApi,
    );
    await expect(service.recordForMentor('tracking', 'wrong-mentor', valid)).rejects.toBeInstanceOf(NotFoundException);
    expect(recordDecision).not.toHaveBeenCalled();
  });
});
