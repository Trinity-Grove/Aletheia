import { NotFoundException } from '@nestjs/common';
import { CurriculumPackCommunityController } from './curriculum-pack-community.controller.js';
import type { CurriculumPackResponseDto, AuthorTrustProfileResponseDto } from '@aletheia/contracts';
import type { AuthorTrustProfile } from '@prisma/client';

describe('CurriculumPackCommunityController', () => {
  const authorUserId = '11111111-1111-4111-8111-111111111111';
  const adminUserId = '22222222-2222-4222-8222-222222222222';
  const otherUserId = '33333333-3333-4333-8333-333333333333';
  const packId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  const mockPackDto: CurriculumPackResponseDto = {
    id: packId,
    code: 'TEST_COMMUNITY_PACK',
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: '1.0.0',
    name: 'Test Community Pack',
    description: 'Description',
    metadata: {},
    authorUserId,
    moderationStatus: 'APPROVED',
    moderationNotes: null,
    moderatedAt: '2026-09-23T12:00:00.000Z',
    moderatedByUserId: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    publishedAt: '2026-09-23T12:00:00.000Z',
    deprecatedAt: null,
  };

  const mockDraftPackDto: CurriculumPackResponseDto = {
    ...mockPackDto,
    status: 'DRAFT',
    moderationStatus: 'DRAFT',
    publishedAt: null,
  };

  const mockProfile: AuthorTrustProfile = {
    userId: authorUserId,
    trustScore: 40,
    tier: 'VERIFIED',
    approvedPacksCount: 2,
    rejectedPacksCount: 0,
    upheldReportsCount: 0,
    lastEvaluatedAt: new Date('2026-09-01T00:00:00.000Z'),
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-01T00:00:00.000Z'),
  };

  let packService: {
    listPublicPacks: jest.Mock;
    listMyAuthoredPacks: jest.Mock;
    createCommunityPack: jest.Mock;
    submitPack: jest.Mock;
    getPack: jest.Mock;
  };

  let authorTrustService: {
    getOrCreateProfile: jest.Mock;
  };

  let identityPublicApi: {
    verifyToken: jest.Mock;
    isPlatformAdmin: jest.Mock;
  };

  let controller: CurriculumPackCommunityController;

  beforeEach(() => {
    packService = {
      listPublicPacks: jest.fn(),
      listMyAuthoredPacks: jest.fn(),
      createCommunityPack: jest.fn(),
      submitPack: jest.fn(),
      getPack: jest.fn(),
    };

    authorTrustService = {
      getOrCreateProfile: jest.fn(),
    };

    identityPublicApi = {
      verifyToken: jest.fn(),
      isPlatformAdmin: jest.fn(),
    };

    controller = new CurriculumPackCommunityController(
      packService as never,
      authorTrustService as never,
      identityPublicApi as never,
    );
  });

  describe('listPublicPacks', () => {
    it('returns public packs', async () => {
      packService.listPublicPacks.mockResolvedValue([mockPackDto]);

      const result = await controller.listPublicPacks();

      expect(packService.listPublicPacks).toHaveBeenCalled();
      expect(result).toEqual([mockPackDto]);
    });
  });

  describe('listMyAuthoredPacks', () => {
    it('returns packs authored by the logged-in user', async () => {
      packService.listMyAuthoredPacks.mockResolvedValue([mockDraftPackDto]);

      const result = await controller.listMyAuthoredPacks(authorUserId);

      expect(packService.listMyAuthoredPacks).toHaveBeenCalledWith(authorUserId);
      expect(result).toEqual([mockDraftPackDto]);
    });
  });

  describe('getAuthorProfile', () => {
    it('returns formatted author trust profile', async () => {
      authorTrustService.getOrCreateProfile.mockResolvedValue(mockProfile);

      const result = await controller.getAuthorProfile(authorUserId);

      expect(authorTrustService.getOrCreateProfile).toHaveBeenCalledWith(authorUserId);
      expect(result).toEqual<AuthorTrustProfileResponseDto>({
        userId: authorUserId,
        trustScore: 40,
        tier: 'VERIFIED',
        approvedPacksCount: 2,
        rejectedPacksCount: 0,
        upheldReportsCount: 0,
        lastEvaluatedAt: '2026-09-01T00:00:00.000Z',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      });
    });
  });

  describe('createCommunityPack', () => {
    it('delegates creation to pack service', async () => {
      const dto = {
        code: 'TEST_COMMUNITY_PACK',
        version: 1,
        status: 'DRAFT' as const,
        schemaVersion: '1.0.0',
        name: 'Test Community Pack',
        description: 'Description',
        metadata: {},
      };
      packService.createCommunityPack.mockResolvedValue(mockDraftPackDto);

      const result = await controller.createCommunityPack(authorUserId, dto);

      expect(packService.createCommunityPack).toHaveBeenCalledWith(authorUserId, dto);
      expect(result).toEqual(mockDraftPackDto);
    });
  });

  describe('submitPack', () => {
    it('submits pack for moderation', async () => {
      packService.submitPack.mockResolvedValue(mockPackDto);

      const result = await controller.submitPack(packId, authorUserId);

      expect(packService.submitPack).toHaveBeenCalledWith(packId, authorUserId);
      expect(result).toEqual(mockPackDto);
    });
  });

  describe('getPack', () => {
    it('returns pack when PUBLISHED and APPROVED, even with no token', async () => {
      packService.getPack.mockResolvedValue(mockPackDto);
      const req = { headers: {} } as never;

      const result = await controller.getPack(packId, req);

      expect(result).toEqual(mockPackDto);
    });

    it('returns non-public pack when user is the author', async () => {
      packService.getPack.mockResolvedValue(mockDraftPackDto);
      const req = {
        headers: { authorization: 'Bearer test-token' },
      } as never;
      identityPublicApi.verifyToken.mockResolvedValue({ userId: authorUserId });

      const result = await controller.getPack(packId, req);

      expect(result).toEqual(mockDraftPackDto);
    });

    it('returns non-public pack when user is platform admin', async () => {
      packService.getPack.mockResolvedValue(mockDraftPackDto);
      const req = {
        headers: { authorization: 'Bearer admin-token' },
      } as never;
      identityPublicApi.verifyToken.mockResolvedValue({ userId: adminUserId });
      identityPublicApi.isPlatformAdmin.mockResolvedValue(true);

      const result = await controller.getPack(packId, req);

      expect(result).toEqual(mockDraftPackDto);
    });

    it('throws NotFoundException when non-public pack is requested with no token', async () => {
      packService.getPack.mockResolvedValue(mockDraftPackDto);
      const req = { headers: {} } as never;

      await expect(controller.getPack(packId, req)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when non-public pack is requested by unauthorized non-admin user', async () => {
      packService.getPack.mockResolvedValue(mockDraftPackDto);
      const req = {
        headers: { authorization: 'Bearer other-token' },
      } as never;
      identityPublicApi.verifyToken.mockResolvedValue({ userId: otherUserId });
      identityPublicApi.isPlatformAdmin.mockResolvedValue(false);

      await expect(controller.getPack(packId, req)).rejects.toThrow(NotFoundException);
    });
  });
});
