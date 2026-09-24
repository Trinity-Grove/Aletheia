import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CurriculumPackService } from './curriculum-pack.service.js';
import type { CurriculumPack, AuthorTrustProfile } from '@prisma/client';
import type { CreateCurriculumPackOutput } from '@aletheia/contracts';

describe('CurriculumPackService - Community & Moderation', () => {
  const authorUserId = '11111111-1111-4111-8111-111111111111';
  const otherUserId = '22222222-2222-4222-8222-222222222222';
  const packId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  const mockPack: CurriculumPack = {
    id: packId,
    code: 'COMMUNITY_TEST_PACK',
    version: 1,
    status: 'DRAFT',
    schemaVersion: '1.0.0',
    name: 'Community Test Pack',
    description: 'A test pack for community features',
    metadata: {},
    authorUserId,
    moderationStatus: 'DRAFT',
    moderationNotes: null,
    moderatedAt: null,
    moderatedByUserId: null,
    createdAt: new Date('2026-09-01T00:00:00Z'),
    publishedAt: null,
    deprecatedAt: null,
  };

  const noviceProfile: AuthorTrustProfile = {
    userId: authorUserId,
    trustScore: 10,
    tier: 'NOVICE',
    approvedPacksCount: 0,
    rejectedPacksCount: 0,
    upheldReportsCount: 0,
    lastEvaluatedAt: new Date('2026-09-01T00:00:00Z'),
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-01T00:00:00Z'),
  };

  const trustedProfile: AuthorTrustProfile = {
    userId: authorUserId,
    trustScore: 85,
    tier: 'TRUSTED',
    approvedPacksCount: 5,
    rejectedPacksCount: 0,
    upheldReportsCount: 0,
    lastEvaluatedAt: new Date('2026-09-01T00:00:00Z'),
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-01T00:00:00Z'),
  };

  let repository: {
    createPack: jest.Mock;
    createCommunityPack: jest.Mock;
    listPacks: jest.Mock;
    listPublishedPacks: jest.Mock;
    listMyAuthoredPacks: jest.Mock;
    findPackById: jest.Mock;
    findPackByCodeVersion: jest.Mock;
    updatePackStatus: jest.Mock;
    updateModeration: jest.Mock;
    addItem: jest.Mock;
    listItems: jest.Mock;
    addDependency: jest.Mock;
    listDependencies: jest.Mock;
  };

  let authorTrustService: {
    getOrCreateProfile: jest.Mock;
    onPackApproved: jest.Mock;
    recalculateScore: jest.Mock;
    onPackRejected: jest.Mock;
    onReportUpheld: jest.Mock;
  };

  let service: CurriculumPackService;

  beforeEach(() => {
    repository = {
      createPack: jest.fn(),
      createCommunityPack: jest.fn(),
      listPacks: jest.fn(),
      listPublishedPacks: jest.fn(),
      listMyAuthoredPacks: jest.fn(),
      findPackById: jest.fn(),
      findPackByCodeVersion: jest.fn(),
      updatePackStatus: jest.fn(),
      updateModeration: jest.fn(),
      addItem: jest.fn(),
      listItems: jest.fn(),
      addDependency: jest.fn(),
      listDependencies: jest.fn(),
    };

    authorTrustService = {
      getOrCreateProfile: jest.fn(),
      onPackApproved: jest.fn(),
      recalculateScore: jest.fn(),
      onPackRejected: jest.fn(),
      onReportUpheld: jest.fn(),
    };

    service = new CurriculumPackService(repository as never, authorTrustService as never);
  });

  describe('createCommunityPack', () => {
    it('creates a community pack with authorUserId, DRAFT status and DRAFT moderationStatus', async () => {
      const dto: CreateCurriculumPackOutput = {
        code: 'COMMUNITY_TEST_PACK',
        version: 1,
        status: 'DRAFT',
        schemaVersion: '1.0.0',
        name: 'Community Test Pack',
        description: 'A test pack for community features',
        metadata: {},
      };

      repository.createCommunityPack.mockResolvedValue(mockPack);

      const result = await service.createCommunityPack(authorUserId, dto);

      expect(repository.createCommunityPack).toHaveBeenCalledWith(authorUserId, dto);
      expect(result).toMatchObject({
        id: packId,
        code: 'COMMUNITY_TEST_PACK',
        status: 'DRAFT',
        authorUserId,
        moderationStatus: 'DRAFT',
      });
    });
  });

  describe('submitPack', () => {
    it('sets moderationStatus to PENDING_REVIEW when author is NOVICE (status remains DRAFT)', async () => {
      repository.findPackById.mockResolvedValue(mockPack);
      authorTrustService.getOrCreateProfile.mockResolvedValue(noviceProfile);

      const pendingPack: CurriculumPack = {
        ...mockPack,
        moderationStatus: 'PENDING_REVIEW',
      };
      repository.updateModeration.mockResolvedValue(pendingPack);

      const result = await service.submitPack(packId, authorUserId);

      expect(authorTrustService.getOrCreateProfile).toHaveBeenCalledWith(authorUserId);
      expect(repository.updateModeration).toHaveBeenCalledWith(packId, {
        moderationStatus: 'PENDING_REVIEW',
      });
      expect(authorTrustService.onPackApproved).not.toHaveBeenCalled();
      expect(result.moderationStatus).toBe('PENDING_REVIEW');
      expect(result.status).toBe('DRAFT');
    });

    it('auto-approves pack to APPROVED and PUBLISHED when author is TRUSTED, calling onPackApproved', async () => {
      repository.findPackById.mockResolvedValue(mockPack);
      authorTrustService.getOrCreateProfile.mockResolvedValue(trustedProfile);

      const approvedPack: CurriculumPack = {
        ...mockPack,
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED',
        publishedAt: new Date('2026-09-23T12:00:00Z'),
        moderatedAt: new Date('2026-09-23T12:00:00Z'),
        moderationNotes: 'Auto-approved (TRUSTED author)',
      };
      repository.updateModeration.mockResolvedValue(approvedPack);
      authorTrustService.onPackApproved.mockResolvedValue({
        ...trustedProfile,
        approvedPacksCount: 6,
      });

      const result = await service.submitPack(packId, authorUserId);

      expect(authorTrustService.getOrCreateProfile).toHaveBeenCalledWith(authorUserId);
      expect(repository.updateModeration).toHaveBeenCalledWith(packId, {
        moderationStatus: 'APPROVED',
        status: 'PUBLISHED',
        publishedAt: expect.any(Date),
        moderatedAt: expect.any(Date),
        moderationNotes: 'Auto-approved (TRUSTED author)',
      });
      expect(authorTrustService.onPackApproved).toHaveBeenCalledWith(authorUserId);
      expect(result.moderationStatus).toBe('APPROVED');
      expect(result.status).toBe('PUBLISHED');
      expect(result.publishedAt).toBeDefined();
    });

    it('throws ForbiddenException when a user attempts to submit a pack authored by someone else', async () => {
      repository.findPackById.mockResolvedValue(mockPack);

      await expect(service.submitPack(packId, otherUserId)).rejects.toThrow(ForbiddenException);

      expect(repository.updateModeration).not.toHaveBeenCalled();
      expect(authorTrustService.getOrCreateProfile).not.toHaveBeenCalled();
      expect(authorTrustService.onPackApproved).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the pack does not exist', async () => {
      repository.findPackById.mockResolvedValue(null);

      await expect(service.submitPack(packId, authorUserId)).rejects.toThrow(NotFoundException);

      expect(repository.updateModeration).not.toHaveBeenCalled();
      expect(authorTrustService.getOrCreateProfile).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when submitting an already APPROVED pack', async () => {
      const approvedPack: CurriculumPack = {
        ...mockPack,
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED',
      };
      repository.findPackById.mockResolvedValue(approvedPack);

      await expect(service.submitPack(packId, authorUserId)).rejects.toThrow(BadRequestException);

      expect(repository.updateModeration).not.toHaveBeenCalled();
      expect(authorTrustService.onPackApproved).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when submitting a SUSPENDED pack', async () => {
      const suspendedPack: CurriculumPack = {
        ...mockPack,
        moderationStatus: 'SUSPENDED',
      };
      repository.findPackById.mockResolvedValue(suspendedPack);

      await expect(service.submitPack(packId, authorUserId)).rejects.toThrow(BadRequestException);

      expect(repository.updateModeration).not.toHaveBeenCalled();
      expect(authorTrustService.onPackApproved).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when submitting a pack whose status is not DRAFT', async () => {
      const archivedPack: CurriculumPack = {
        ...mockPack,
        status: 'ARCHIVED',
        moderationStatus: 'DRAFT',
      };
      repository.findPackById.mockResolvedValue(archivedPack);

      await expect(service.submitPack(packId, authorUserId)).rejects.toThrow(BadRequestException);

      expect(repository.updateModeration).not.toHaveBeenCalled();
      expect(authorTrustService.onPackApproved).not.toHaveBeenCalled();
    });
  });

  describe('listPublicPacks', () => {
    it('calls repository.listPublishedPacks and returns only published and approved packs', async () => {
      const publicPack: CurriculumPack = {
        ...mockPack,
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED',
        publishedAt: new Date('2026-09-23T00:00:00Z'),
      };
      repository.listPublishedPacks.mockResolvedValue([publicPack]);

      const result = await service.listPublicPacks();

      expect(repository.listPublishedPacks).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]!.status).toBe('PUBLISHED');
      expect(result[0]!.moderationStatus).toBe('APPROVED');
    });
  });

  describe('listMyAuthoredPacks', () => {
    it('calls repository.listMyAuthoredPacks and returns packs authored by user', async () => {
      repository.listMyAuthoredPacks.mockResolvedValue([mockPack]);

      const result = await service.listMyAuthoredPacks(authorUserId);

      expect(repository.listMyAuthoredPacks).toHaveBeenCalledWith(authorUserId);
      expect(result).toHaveLength(1);
      expect(result[0]!.authorUserId).toBe(authorUserId);
    });
  });
});
