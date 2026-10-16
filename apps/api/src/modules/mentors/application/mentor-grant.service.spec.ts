import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { FamilyPublicApi } from '../../families/application/public-api.js';
import type { MentorGrantRepository } from '../infrastructure/mentor-grant.repository.js';
import { MentorGrantService } from './mentor-grant.service.js';

describe('MentorGrantService progression capability', () => {
  const grant = { toDto: () => ({ id: 'grant', canApproveProgression: true }) };

  it.each(['OWNER_GUARDIAN', 'GUARDIAN', 'CO_GUARDIAN'])('allows %s to toggle the capability on exactly one grant', async (role) => {
    const updateProgressionCapability = jest.fn().mockResolvedValue(grant);
    const service = new MentorGrantService(
      { updateProgressionCapability } as unknown as MentorGrantRepository,
      { getFamilyMemberRole: jest.fn().mockResolvedValue(role) } as unknown as FamilyPublicApi,
    );
    await expect(service.updateProgressionCapability('actor', 'family', 'learner', 'grant', true)).resolves.toEqual(grant.toDto());
    expect(updateProgressionCapability).toHaveBeenCalledWith('family', 'learner', 'grant', true);
  });

  it.each(['EDUCATOR', null])('denies %s from changing the capability', async (role) => {
    const updateProgressionCapability = jest.fn();
    const service = new MentorGrantService(
      { updateProgressionCapability } as unknown as MentorGrantRepository,
      { getFamilyMemberRole: jest.fn().mockResolvedValue(role) } as unknown as FamilyPublicApi,
    );
    await expect(service.updateProgressionCapability('actor', 'family', 'learner', 'grant', true)).rejects.toBeInstanceOf(ForbiddenException);
    expect(updateProgressionCapability).not.toHaveBeenCalled();
  });

  it('does not allow a grant id outside the family and learner scope', async () => {
    const service = new MentorGrantService(
      { updateProgressionCapability: jest.fn().mockResolvedValue(null) } as unknown as MentorGrantRepository,
      { getFamilyMemberRole: jest.fn().mockResolvedValue('OWNER_GUARDIAN') } as unknown as FamilyPublicApi,
    );
    await expect(service.updateProgressionCapability('actor', 'family-a', 'learner-a', 'grant-b', false)).rejects.toBeInstanceOf(NotFoundException);
  });
});
