import { ForbiddenException } from '@nestjs/common';
import { FamilyService } from './family.service.js';
import { FamilyRepository } from '../infrastructure/family.repository.js';
import { FamilyEntity } from '../domain/family.entity.js';
import { FamilyMemberEntity } from '../domain/family-member.entity.js';

describe('FamilyService', () => {
  let familyService: FamilyService;
  let fakeFamilies: Map<string, FamilyEntity>;
  let fakeMemberships: Map<string, Set<string>>;

  beforeEach(() => {
    fakeFamilies = new Map();
    fakeMemberships = new Map();

    const mockRepo = {
      createWithOwner: async (data: { name: string; countryCode: string; stateProvince?: string | null }, ownerUserId: string) => {
        const familyId = 'family-uuid-1';
        const member = new FamilyMemberEntity({
          id: 'member-uuid-1',
          familyId,
          userId: ownerUserId,
          role: 'OWNER_GUARDIAN',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        const entity = new FamilyEntity({
          id: familyId,
          name: data.name,
          countryCode: data.countryCode,
          stateProvince: data.stateProvince ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          members: [member],
        });
        fakeFamilies.set(familyId, entity);
        if (!fakeMemberships.has(ownerUserId)) {
          fakeMemberships.set(ownerUserId, new Set());
        }
        fakeMemberships.get(ownerUserId)!.add(familyId);
        return entity;
      },
      findById: async (id: string) => fakeFamilies.get(id) ?? null,
      findByUserId: async (userId: string) => {
        const familyIds = fakeMemberships.get(userId) ?? new Set();
        return Array.from(familyIds).map((id) => fakeFamilies.get(id)!);
      },
      isMember: async (userId: string, familyId: string) => {
        const userFamilies = fakeMemberships.get(userId);
        return userFamilies ? userFamilies.has(familyId) : false;
      },
    } as unknown as FamilyRepository;

    familyService = new FamilyService(mockRepo);
  });

  it('creates family with owner guardian membership', async () => {
    const result = await familyService.createFamily('user-1', {
      name: 'Oliveira Family',
      countryCode: 'BRA',
      stateProvince: 'SP',
    });

    expect(result.id).toBe('family-uuid-1');
    expect(result.name).toBe('Oliveira Family');
    expect(result.members).toHaveLength(1);
    expect(result.members![0]?.role).toBe('OWNER_GUARDIAN');
  });

  it('returns families belonging to user', async () => {
    await familyService.createFamily('user-1', {
      name: 'First Family',
      countryCode: 'BRA',
    });

    const list = await familyService.getMyFamilies('user-1');
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe('First Family');
  });

  it('rejects access to family when user is not a member', async () => {
    await familyService.createFamily('user-1', {
      name: 'Private Family',
      countryCode: 'USA',
    });

    await expect(
      familyService.getFamilyById('intruder-user', 'family-uuid-1'),
    ).rejects.toThrow(ForbiddenException);
  });
});
