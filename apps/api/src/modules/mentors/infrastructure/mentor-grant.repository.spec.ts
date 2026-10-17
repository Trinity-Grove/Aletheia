import type { PrismaService } from '../../../platform/database/prisma.service.js';
import { MentorGrantRepository } from './mentor-grant.repository.js';

describe('MentorGrantRepository progression authorization scope', () => {
  it('authorizes assessment only for an active, accepted grant scoped to the learner', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: 'grant' });
    const repository = new MentorGrantRepository({ mentorGrant: { findFirst } } as unknown as PrismaService);
    await expect(repository.canMentorAssess('mentor', 'family', 'learner')).resolves.toBe(true);
    expect(findFirst).toHaveBeenCalledWith({ where: {
      mentorUserId: 'mentor', familyId: 'family', learnerId: 'learner', status: 'ACCEPTED',
      revokedAt: null, expiresAt: { gt: expect.any(Date) },
    }, select: { id: true } });
  });

  it('requires the authenticated mentor, exact family and learner, accepted grant, capability, and unexpired/unrevoked status', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: 'grant' });
    const repository = new MentorGrantRepository({ mentorGrant: { findFirst } } as unknown as PrismaService);
    await expect(repository.canMentorApproveProgression('mentor', 'family', 'learner')).resolves.toBe(true);
    expect(findFirst).toHaveBeenCalledWith({ where: {
      mentorUserId: 'mentor', familyId: 'family', learnerId: 'learner', status: 'ACCEPTED',
      canApproveProgression: true, revokedAt: null, expiresAt: { gt: expect.any(Date) },
    }, select: { id: true } });
  });

  it.each(['pending', 'expired', 'revoked', 'wrong-learner', 'wrong-family', 'disabled-capability', 'wrong-actor'])('denies a %s grant because no exact active grant exists', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const repository = new MentorGrantRepository({ mentorGrant: { findFirst } } as unknown as PrismaService);
    await expect(repository.canMentorApproveProgression('mentor', 'family', 'learner')).resolves.toBe(false);
  });

  it('lists only active enabled grants owned by the authenticated mentor, without family member details', async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 'grant', familyId: 'family', learnerId: 'learner' }]);
    const repository = new MentorGrantRepository({ mentorGrant: { findMany } } as unknown as PrismaService);
    await expect(repository.listProgressionApprovalScopes('mentor')).resolves.toEqual([{ grantId: 'grant', familyId: 'family', learnerId: 'learner' }]);
    expect(findMany).toHaveBeenCalledWith({
      where: { mentorUserId: 'mentor', status: 'ACCEPTED', canApproveProgression: true, revokedAt: null, expiresAt: { gt: expect.any(Date) } },
      select: { id: true, familyId: true, learnerId: true }, orderBy: { createdAt: 'desc' },
    });
  });
});
