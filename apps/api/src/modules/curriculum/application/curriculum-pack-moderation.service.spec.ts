import { NotFoundException } from '@nestjs/common';
import type { CurriculumPack, CurriculumPackReport, AuthorTrustProfile } from '@prisma/client';
import type { AdminModeratePackDto, AdminResolveReportDto, PackReportStatus } from '@aletheia/contracts';
import { CurriculumPackModerationService } from './curriculum-pack-moderation.service.js';

describe('CurriculumPackModerationService - Admin Moderation Queue, Pack Actions & Report Resolution', () => {
  const adminUserId = '88888888-8888-4888-8888-888888888888';
  const authorUserId = '99999999-9999-4999-8999-999999999999';
  const pendingPackId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const suspendedPackId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const reportId = 'r1111111-1111-4111-8111-111111111111';

  const mockPendingPack: CurriculumPack = {
    id: pendingPackId,
    code: 'PENDING_PACK',
    version: 1,
    status: 'DRAFT',
    schemaVersion: '1.0.0',
    name: 'Pending Community Pack',
    description: 'A pack waiting for review',
    metadata: {},
    authorUserId,
    moderationStatus: 'PENDING_REVIEW',
    moderationNotes: null,
    moderatedAt: null,
    moderatedByUserId: null,
    createdAt: new Date('2026-09-24T00:00:00Z'),
    publishedAt: null,
    deprecatedAt: null,
  };

  const mockSuspendedPack: CurriculumPack = {
    id: suspendedPackId,
    code: 'SUSPENDED_PACK',
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: '1.0.0',
    name: 'Suspended Community Pack',
    description: 'A pack suspended after reports',
    metadata: {},
    authorUserId,
    moderationStatus: 'SUSPENDED',
    moderationNotes: 'Suspenso preventivamente por acúmulo de denúncias',
    moderatedAt: new Date('2026-09-24T01:00:00Z'),
    moderatedByUserId: null,
    createdAt: new Date('2026-09-20T00:00:00Z'),
    publishedAt: new Date('2026-09-21T00:00:00Z'),
    deprecatedAt: null,
  };

  const mockAuthorProfile: AuthorTrustProfile = {
    userId: authorUserId,
    trustScore: 45,
    tier: 'VERIFIED',
    approvedPacksCount: 2,
    rejectedPacksCount: 0,
    upheldReportsCount: 0,
    lastEvaluatedAt: new Date('2026-09-24T00:00:00Z'),
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-09-24T00:00:00Z'),
  };

  const mockReport: CurriculumPackReport = {
    id: reportId,
    packId: suspendedPackId,
    reporterUserId: '11111111-1111-4111-8111-111111111111',
    reporterFamilyId: 'f1111111-1111-4111-8111-111111111111',
    reason: 'HARMFUL_INAPPROPRIATE',
    details: 'Contém links externos inadequados',
    status: 'OPEN',
    createdAt: new Date('2026-09-24T02:00:00Z'),
    resolvedAt: null,
    resolvedByUserId: null,
  };

  let packRepository: {
    findPackById: jest.Mock;
    listModerationQueue: jest.Mock;
    updateModeration: jest.Mock;
  };

  let reportRepository: {
    findReportById: jest.Mock;
    countOpenDistinctReports: jest.Mock;
    listReports: jest.Mock;
    updateReportStatus: jest.Mock;
  };

  let authorTrustService: {
    getOrCreateProfile: jest.Mock;
    onPackApproved: jest.Mock;
    onPackRejected: jest.Mock;
    onReportUpheld: jest.Mock;
  };

  let service: CurriculumPackModerationService;

  beforeEach(() => {
    packRepository = {
      findPackById: jest.fn(),
      listModerationQueue: jest.fn(),
      updateModeration: jest.fn(),
    };

    reportRepository = {
      findReportById: jest.fn(),
      countOpenDistinctReports: jest.fn(),
      listReports: jest.fn(),
      updateReportStatus: jest.fn(),
    };

    authorTrustService = {
      getOrCreateProfile: jest.fn(),
      onPackApproved: jest.fn(),
      onPackRejected: jest.fn(),
      onReportUpheld: jest.fn(),
    };

    service = new CurriculumPackModerationService(
      packRepository as never,
      reportRepository as never,
      authorTrustService as never,
    );
  });

  describe('getModerationQueue', () => {
    it('Teste 1: getModerationQueue -> retorna packs com status PENDING_REVIEW e SUSPENDED juntamente com perfil do autor e contagem de denúncias abertas', async () => {
      packRepository.listModerationQueue.mockResolvedValue([mockPendingPack, mockSuspendedPack]);
      authorTrustService.getOrCreateProfile.mockResolvedValue(mockAuthorProfile);
      reportRepository.countOpenDistinctReports
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(3);

      const result = await service.getModerationQueue();

      expect(packRepository.listModerationQueue).toHaveBeenCalled();
      expect(authorTrustService.getOrCreateProfile).toHaveBeenCalledWith(authorUserId);
      expect(reportRepository.countOpenDistinctReports).toHaveBeenCalledWith(pendingPackId);
      expect(reportRepository.countOpenDistinctReports).toHaveBeenCalledWith(suspendedPackId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        pack: {
          id: mockPendingPack.id,
          code: mockPendingPack.code,
          version: mockPendingPack.version,
          status: 'DRAFT',
          schemaVersion: mockPendingPack.schemaVersion,
          name: mockPendingPack.name,
          description: mockPendingPack.description,
          metadata: {},
          authorUserId: mockPendingPack.authorUserId,
          moderationStatus: 'PENDING_REVIEW',
          moderationNotes: null,
          moderatedAt: null,
          moderatedByUserId: null,
          createdAt: mockPendingPack.createdAt.toISOString(),
          publishedAt: null,
          deprecatedAt: null,
        },
        authorTrustProfile: {
          userId: mockAuthorProfile.userId,
          trustScore: 45,
          tier: 'VERIFIED',
          approvedPacksCount: 2,
          rejectedPacksCount: 0,
          upheldReportsCount: 0,
          lastEvaluatedAt: mockAuthorProfile.lastEvaluatedAt.toISOString(),
          createdAt: mockAuthorProfile.createdAt.toISOString(),
          updatedAt: mockAuthorProfile.updatedAt.toISOString(),
        },
        openReportsCount: 0,
      });

      expect(result[1]!.pack.id).toBe(suspendedPackId);
      expect(result[1]!.openReportsCount).toBe(3);
    });

    it('returns null authorTrustProfile when pack has no authorUserId', async () => {
      const packWithoutAuthor: CurriculumPack = {
        ...mockPendingPack,
        authorUserId: null,
      };
      packRepository.listModerationQueue.mockResolvedValue([packWithoutAuthor]);
      reportRepository.countOpenDistinctReports.mockResolvedValue(0);

      const result = await service.getModerationQueue();

      expect(result).toHaveLength(1);
      expect(result[0]!.authorTrustProfile).toBeNull();
      expect(authorTrustService.getOrCreateProfile).not.toHaveBeenCalled();
    });
  });

  describe('moderatePack', () => {
    it('Teste 2: moderatePack com APPROVE -> atualiza pack para APPROVED e PUBLISHED, invoca authorTrustService.onPackApproved(authorUserId)', async () => {
      packRepository.findPackById.mockResolvedValue(mockPendingPack);
      const approvedPack: CurriculumPack = {
        ...mockPendingPack,
        moderationStatus: 'APPROVED',
        status: 'PUBLISHED',
        moderatedAt: new Date('2026-09-24T03:00:00Z'),
        moderatedByUserId: adminUserId,
        moderationNotes: 'Aprovado após revisão detalhada',
        publishedAt: new Date('2026-09-24T03:00:00Z'),
      };
      packRepository.updateModeration.mockResolvedValue(approvedPack);
      authorTrustService.onPackApproved.mockResolvedValue({} as never);

      const dto: AdminModeratePackDto = {
        action: 'APPROVE',
        notes: 'Aprovado após revisão detalhada',
      };

      const result = await service.moderatePack(pendingPackId, adminUserId, dto);

      expect(packRepository.findPackById).toHaveBeenCalledWith(pendingPackId);
      expect(packRepository.updateModeration).toHaveBeenCalledWith(pendingPackId, {
        moderationStatus: 'APPROVED',
        status: 'PUBLISHED',
        publishedAt: expect.any(Date),
        moderatedAt: expect.any(Date),
        moderatedByUserId: adminUserId,
        moderationNotes: 'Aprovado após revisão detalhada',
      });
      expect(authorTrustService.onPackApproved).toHaveBeenCalledWith(authorUserId);
      expect(result.moderationStatus).toBe('APPROVED');
      expect(result.status).toBe('PUBLISHED');
      expect(result.moderatedByUserId).toBe(adminUserId);
    });

    it('Teste 3: moderatePack com REJECT -> atualiza pack para REJECTED, invoca authorTrustService.onPackRejected(authorUserId)', async () => {
      packRepository.findPackById.mockResolvedValue(mockPendingPack);
      const rejectedPack: CurriculumPack = {
        ...mockPendingPack,
        moderationStatus: 'REJECTED',
        moderatedAt: new Date('2026-09-24T03:00:00Z'),
        moderatedByUserId: adminUserId,
        moderationNotes: 'Rejeitado por conteúdo inadequado',
      };
      packRepository.updateModeration.mockResolvedValue(rejectedPack);
      authorTrustService.onPackRejected.mockResolvedValue({} as never);

      const dto: AdminModeratePackDto = {
        action: 'REJECT',
        notes: 'Rejeitado por conteúdo inadequado',
      };

      const result = await service.moderatePack(pendingPackId, adminUserId, dto);

      expect(packRepository.findPackById).toHaveBeenCalledWith(pendingPackId);
      expect(packRepository.updateModeration).toHaveBeenCalledWith(pendingPackId, {
        moderationStatus: 'REJECTED',
        moderatedAt: expect.any(Date),
        moderatedByUserId: adminUserId,
        moderationNotes: 'Rejeitado por conteúdo inadequado',
      });
      expect(authorTrustService.onPackRejected).toHaveBeenCalledWith(authorUserId);
      expect(result.moderationStatus).toBe('REJECTED');
    });

    it('Teste 4: moderatePack com SUSPEND -> atualiza pack para SUSPENDED', async () => {
      packRepository.findPackById.mockResolvedValue(mockPendingPack);
      const suspendedPack: CurriculumPack = {
        ...mockPendingPack,
        moderationStatus: 'SUSPENDED',
        moderatedAt: new Date('2026-09-24T03:00:00Z'),
        moderatedByUserId: adminUserId,
        moderationNotes: 'Suspenso para investigação',
      };
      packRepository.updateModeration.mockResolvedValue(suspendedPack);

      const dto: AdminModeratePackDto = {
        action: 'SUSPEND',
        notes: 'Suspenso para investigação',
      };

      const result = await service.moderatePack(pendingPackId, adminUserId, dto);

      expect(packRepository.updateModeration).toHaveBeenCalledWith(pendingPackId, {
        moderationStatus: 'SUSPENDED',
        moderatedAt: expect.any(Date),
        moderatedByUserId: adminUserId,
        moderationNotes: 'Suspenso para investigação',
      });
      expect(authorTrustService.onPackApproved).not.toHaveBeenCalled();
      expect(authorTrustService.onPackRejected).not.toHaveBeenCalled();
      expect(result.moderationStatus).toBe('SUSPENDED');
    });

    it('Teste 5: moderatePack com RESTORE -> atualiza pack para APPROVED e PUBLISHED', async () => {
      packRepository.findPackById.mockResolvedValue(mockSuspendedPack);
      const restoredPack: CurriculumPack = {
        ...mockSuspendedPack,
        moderationStatus: 'APPROVED',
        status: 'PUBLISHED',
        moderatedAt: new Date('2026-09-24T03:00:00Z'),
        moderatedByUserId: adminUserId,
        moderationNotes: 'Restaurado após verificação',
      };
      packRepository.updateModeration.mockResolvedValue(restoredPack);

      const dto: AdminModeratePackDto = {
        action: 'RESTORE',
        notes: 'Restaurado após verificação',
      };

      const result = await service.moderatePack(suspendedPackId, adminUserId, dto);

      expect(packRepository.updateModeration).toHaveBeenCalledWith(suspendedPackId, {
        moderationStatus: 'APPROVED',
        status: 'PUBLISHED',
        publishedAt: mockSuspendedPack.publishedAt,
        moderatedAt: expect.any(Date),
        moderatedByUserId: adminUserId,
        moderationNotes: 'Restaurado após verificação',
      });
      expect(authorTrustService.onPackApproved).not.toHaveBeenCalled();
      expect(result.moderationStatus).toBe('APPROVED');
      expect(result.status).toBe('PUBLISHED');
    });

    it('throws NotFoundException when pack does not exist', async () => {
      packRepository.findPackById.mockResolvedValue(null);

      const dto: AdminModeratePackDto = { action: 'APPROVE' };
      await expect(service.moderatePack('non-existent-id', adminUserId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(packRepository.updateModeration).not.toHaveBeenCalled();
    });

    it('is idempotent when pack is already in the target state (does not re-invoke trust triggers)', async () => {
      const alreadyApprovedPack: CurriculumPack = {
        ...mockPendingPack,
        moderationStatus: 'APPROVED',
        status: 'PUBLISHED',
      };
      packRepository.findPackById.mockResolvedValue(alreadyApprovedPack);

      const result = await service.moderatePack(pendingPackId, adminUserId, { action: 'APPROVE' });

      expect(result.moderationStatus).toBe('APPROVED');
      expect(packRepository.updateModeration).not.toHaveBeenCalled();
      expect(authorTrustService.onPackApproved).not.toHaveBeenCalled();

      const alreadyRejectedPack: CurriculumPack = {
        ...mockPendingPack,
        moderationStatus: 'REJECTED',
      };
      packRepository.findPackById.mockResolvedValue(alreadyRejectedPack);

      const rejectResult = await service.moderatePack(pendingPackId, adminUserId, { action: 'REJECT' });

      expect(rejectResult.moderationStatus).toBe('REJECTED');
      expect(packRepository.updateModeration).not.toHaveBeenCalled();
      expect(authorTrustService.onPackRejected).not.toHaveBeenCalled();
    });
  });

  describe('listReports', () => {
    it('returns filtered reports mapped to DTOs', async () => {
      reportRepository.listReports.mockResolvedValue([mockReport]);

      const filter = { status: 'OPEN' as PackReportStatus, packId: suspendedPackId };
      const result = await service.listReports(filter);

      expect(reportRepository.listReports).toHaveBeenCalledWith(filter);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockReport.id,
        packId: mockReport.packId,
        reporterUserId: mockReport.reporterUserId,
        reporterFamilyId: mockReport.reporterFamilyId,
        reason: mockReport.reason,
        details: mockReport.details,
        status: 'OPEN',
        createdAt: mockReport.createdAt.toISOString(),
        resolvedAt: null,
        resolvedByUserId: null,
      });
    });
  });

  describe('resolveReport', () => {
    it('Teste 6: resolveReport com UPHELD -> atualiza status do report para UPHELD, invoca authorTrustService.onReportUpheld(pack.authorUserId)', async () => {
      reportRepository.findReportById.mockResolvedValue(mockReport);
      packRepository.findPackById.mockResolvedValue(mockSuspendedPack);
      const updatedReport: CurriculumPackReport = {
        ...mockReport,
        status: 'UPHELD',
        resolvedAt: new Date('2026-09-24T04:00:00Z'),
        resolvedByUserId: adminUserId,
      };
      reportRepository.updateReportStatus.mockResolvedValue(updatedReport);
      authorTrustService.onReportUpheld.mockResolvedValue({} as never);

      const dto: AdminResolveReportDto = {
        status: 'UPHELD',
        notes: 'Denúncia procedente por links inadequados',
      };

      const result = await service.resolveReport(reportId, adminUserId, dto);

      expect(reportRepository.findReportById).toHaveBeenCalledWith(reportId);
      expect(packRepository.findPackById).toHaveBeenCalledWith(mockReport.packId);
      expect(authorTrustService.onReportUpheld).toHaveBeenCalledWith(authorUserId);
      expect(reportRepository.updateReportStatus).toHaveBeenCalledWith(
        reportId,
        'UPHELD',
        adminUserId,
        expect.any(Date),
      );
      expect(result.status).toBe('UPHELD');
      expect(result.resolvedByUserId).toBe(adminUserId);
      expect(result.resolvedAt).toBe(updatedReport.resolvedAt?.toISOString());
    });

    it('Teste 7: resolveReport com DISMISSED -> atualiza status para DISMISSED, não aplica penalidade ao autor', async () => {
      reportRepository.findReportById.mockResolvedValue(mockReport);
      packRepository.findPackById.mockResolvedValue(mockSuspendedPack);
      const updatedReport: CurriculumPackReport = {
        ...mockReport,
        status: 'DISMISSED',
        resolvedAt: new Date('2026-09-24T04:00:00Z'),
        resolvedByUserId: adminUserId,
      };
      reportRepository.updateReportStatus.mockResolvedValue(updatedReport);

      const dto: AdminResolveReportDto = {
        status: 'DISMISSED',
        notes: 'Denúncia infundada',
      };

      const result = await service.resolveReport(reportId, adminUserId, dto);

      expect(reportRepository.findReportById).toHaveBeenCalledWith(reportId);
      expect(reportRepository.updateReportStatus).toHaveBeenCalledWith(
        reportId,
        'DISMISSED',
        adminUserId,
        expect.any(Date),
      );
      expect(authorTrustService.onReportUpheld).not.toHaveBeenCalled();
      expect(result.status).toBe('DISMISSED');
    });

    it('throws NotFoundException when report does not exist', async () => {
      reportRepository.findReportById.mockResolvedValue(null);

      const dto: AdminResolveReportDto = { status: 'DISMISSED' };
      await expect(service.resolveReport('non-existent-report', adminUserId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(reportRepository.updateReportStatus).not.toHaveBeenCalled();
      expect(authorTrustService.onReportUpheld).not.toHaveBeenCalled();
    });

    it('is idempotent when report is already in the target resolved status', async () => {
      const alreadyUpheldReport: CurriculumPackReport = {
        ...mockReport,
        status: 'UPHELD',
        resolvedAt: new Date('2026-09-24T04:00:00Z'),
        resolvedByUserId: adminUserId,
      };
      reportRepository.findReportById.mockResolvedValue(alreadyUpheldReport);

      const result = await service.resolveReport(reportId, adminUserId, { status: 'UPHELD' });

      expect(result.status).toBe('UPHELD');
      expect(reportRepository.updateReportStatus).not.toHaveBeenCalled();
      expect(authorTrustService.onReportUpheld).not.toHaveBeenCalled();
    });
  });
});
