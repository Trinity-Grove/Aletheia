import { ConflictException, NotFoundException } from '@nestjs/common';
import type { CurriculumPack, CurriculumPackReport } from '@prisma/client';
import type { CreatePackReportDto } from '@aletheia/contracts';
import { CurriculumPackReportService } from './curriculum-pack-report.service.js';

describe('CurriculumPackReportService - Community Reporting Engine & Auto-Suspension', () => {
  const packId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const authorUserId = '99999999-9999-4999-8999-999999999999';

  const user1Id = '11111111-1111-4111-8111-111111111111';
  const family1Id = 'f1111111-1111-4111-8111-111111111111';

  const user2Id = '22222222-2222-4222-8222-222222222222';
  const family2Id = 'f2222222-2222-4222-8222-222222222222';

  const user3Id = '33333333-3333-4333-8333-333333333333';
  const family3Id = 'f3333333-3333-4333-8333-333333333333';

  const mockApprovedPack: CurriculumPack = {
    id: packId,
    code: 'APPROVED_PACK',
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: '1.0.0',
    name: 'Approved Pack',
    description: 'An approved community pack',
    metadata: {},
    authorUserId,
    moderationStatus: 'APPROVED',
    moderationNotes: null,
    moderatedAt: new Date('2026-09-20T00:00:00Z'),
    moderatedByUserId: '88888888-8888-4888-8888-888888888888',
    createdAt: new Date('2026-09-01T00:00:00Z'),
    publishedAt: new Date('2026-09-20T00:00:00Z'),
    deprecatedAt: null,
  };

  const mockReport1: CurriculumPackReport = {
    id: 'r1111111-1111-4111-8111-111111111111',
    packId,
    reporterUserId: user1Id,
    reporterFamilyId: family1Id,
    reason: 'SPAM_COMMERCIAL',
    details: 'Spam promotional content detected.',
    status: 'OPEN',
    createdAt: new Date('2026-09-24T00:00:00Z'),
    resolvedAt: null,
    resolvedByUserId: null,
  };

  const mockReport2: CurriculumPackReport = {
    id: 'r2222222-2222-4222-8222-222222222222',
    packId,
    reporterUserId: user2Id,
    reporterFamilyId: family2Id,
    reason: 'MALFORMED_QUALITY',
    details: 'Broken references and invalid content structure.',
    status: 'OPEN',
    createdAt: new Date('2026-09-24T01:00:00Z'),
    resolvedAt: null,
    resolvedByUserId: null,
  };

  const mockReport3: CurriculumPackReport = {
    id: 'r3333333-3333-4333-8333-333333333333',
    packId,
    reporterUserId: user3Id,
    reporterFamilyId: family3Id,
    reason: 'HARMFUL_INAPPROPRIATE',
    details: 'Harmful instructions unsuitable for home education.',
    status: 'OPEN',
    createdAt: new Date('2026-09-24T02:00:00Z'),
    resolvedAt: null,
    resolvedByUserId: null,
  };

  let reportRepository: {
    createReport: jest.Mock;
    findReportByPackAndFamily: jest.Mock;
    countOpenDistinctReports: jest.Mock;
    listReportsByPack: jest.Mock;
    listReports: jest.Mock;
    updateReportStatus: jest.Mock;
  };

  let packRepository: {
    findPackById: jest.Mock;
    updateModeration: jest.Mock;
  };

  let service: CurriculumPackReportService;

  beforeEach(() => {
    reportRepository = {
      createReport: jest.fn(),
      findReportByPackAndFamily: jest.fn(),
      countOpenDistinctReports: jest.fn(),
      listReportsByPack: jest.fn(),
      listReports: jest.fn(),
      updateReportStatus: jest.fn(),
    };

    packRepository = {
      findPackById: jest.fn(),
      updateModeration: jest.fn(),
    };

    service = new CurriculumPackReportService(
      reportRepository as never,
      packRepository as never,
    );
  });

  describe('createReport', () => {
    const dto: CreatePackReportDto = {
      reason: 'SPAM_COMMERCIAL',
      details: 'Spam promotional content detected.',
    };

    it('Teste 1: Família 1 denuncia pack existente -> Report criado com status OPEN, pack permanece APPROVED (1 denúncia < 3)', async () => {
      packRepository.findPackById.mockResolvedValue(mockApprovedPack);
      reportRepository.findReportByPackAndFamily.mockResolvedValue(null);
      reportRepository.createReport.mockResolvedValue(mockReport1);
      reportRepository.countOpenDistinctReports.mockResolvedValue(1);

      const result = await service.createReport(packId, user1Id, family1Id, dto);

      expect(packRepository.findPackById).toHaveBeenCalledWith(packId);
      expect(reportRepository.findReportByPackAndFamily).toHaveBeenCalledWith(packId, family1Id);
      expect(reportRepository.createReport).toHaveBeenCalledWith({
        packId,
        reporterUserId: user1Id,
        reporterFamilyId: family1Id,
        reason: 'SPAM_COMMERCIAL',
        details: 'Spam promotional content detected.',
      });
      expect(reportRepository.countOpenDistinctReports).toHaveBeenCalledWith(packId);
      expect(packRepository.updateModeration).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: mockReport1.id,
        packId: mockReport1.packId,
        reporterUserId: mockReport1.reporterUserId,
        reporterFamilyId: mockReport1.reporterFamilyId,
        reason: mockReport1.reason,
        details: mockReport1.details,
        status: 'OPEN',
        createdAt: mockReport1.createdAt.toISOString(),
        resolvedAt: null,
        resolvedByUserId: null,
      });
    });

    it('Teste 2: Família 1 tenta denunciar o mesmo pack novamente -> Lança ConflictException (anti-brigading)', async () => {
      packRepository.findPackById.mockResolvedValue(mockApprovedPack);
      reportRepository.findReportByPackAndFamily.mockResolvedValue(mockReport1);

      await expect(service.createReport(packId, user1Id, family1Id, dto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createReport(packId, user1Id, family1Id, dto)).rejects.toThrow(
        'Your family has already submitted a report for this pack.',
      );

      expect(reportRepository.createReport).not.toHaveBeenCalled();
      expect(reportRepository.countOpenDistinctReports).not.toHaveBeenCalled();
      expect(packRepository.updateModeration).not.toHaveBeenCalled();
    });

    it('Teste 3: Família 2 denuncia o pack -> 2 denúncias abertas, pack permanece APPROVED (2 < 3)', async () => {
      packRepository.findPackById.mockResolvedValue(mockApprovedPack);
      reportRepository.findReportByPackAndFamily.mockResolvedValue(null);
      reportRepository.createReport.mockResolvedValue(mockReport2);
      reportRepository.countOpenDistinctReports.mockResolvedValue(2);

      const dto2: CreatePackReportDto = {
        reason: 'MALFORMED_QUALITY',
        details: 'Broken references and invalid content structure.',
      };

      const result = await service.createReport(packId, user2Id, family2Id, dto2);

      expect(reportRepository.createReport).toHaveBeenCalledWith({
        packId,
        reporterUserId: user2Id,
        reporterFamilyId: family2Id,
        reason: 'MALFORMED_QUALITY',
        details: 'Broken references and invalid content structure.',
      });
      expect(reportRepository.countOpenDistinctReports).toHaveBeenCalledWith(packId);
      expect(packRepository.updateModeration).not.toHaveBeenCalled();
      expect(result.status).toBe('OPEN');
    });

    it('Teste 4: Família 3 denuncia o pack -> 3 denúncias atingem limiar: pack é automaticamente suspenso (moderationStatus = SUSPENDED)', async () => {
      packRepository.findPackById.mockResolvedValue(mockApprovedPack);
      reportRepository.findReportByPackAndFamily.mockResolvedValue(null);
      reportRepository.createReport.mockResolvedValue(mockReport3);
      reportRepository.countOpenDistinctReports.mockResolvedValue(3);

      const dto3: CreatePackReportDto = {
        reason: 'HARMFUL_INAPPROPRIATE',
        details: 'Harmful instructions unsuitable for home education.',
      };

      const result = await service.createReport(packId, user3Id, family3Id, dto3);

      expect(reportRepository.countOpenDistinctReports).toHaveBeenCalledWith(packId);
      expect(packRepository.updateModeration).toHaveBeenCalledWith(packId, {
        moderationStatus: 'SUSPENDED',
        moderationNotes: 'Suspenso preventivamente por acúmulo de 3 ou mais denúncias de famílias distintas.',
        moderatedAt: expect.any(Date),
      });
      expect(result.status).toBe('OPEN');
    });

    it('Teste 5: Denúncia para pack inexistente -> Lança NotFoundException', async () => {
      packRepository.findPackById.mockResolvedValue(null);

      await expect(service.createReport('non-existent-pack', user1Id, family1Id, dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(reportRepository.findReportByPackAndFamily).not.toHaveBeenCalled();
      expect(reportRepository.createReport).not.toHaveBeenCalled();
      expect(reportRepository.countOpenDistinctReports).not.toHaveBeenCalled();
      expect(packRepository.updateModeration).not.toHaveBeenCalled();
    });
  });

  describe('listReportsByPack', () => {
    it('returns reports list when pack exists', async () => {
      packRepository.findPackById.mockResolvedValue(mockApprovedPack);
      reportRepository.listReportsByPack.mockResolvedValue([mockReport1, mockReport2]);

      const result = await service.listReportsByPack(packId);

      expect(packRepository.findPackById).toHaveBeenCalledWith(packId);
      expect(reportRepository.listReportsByPack).toHaveBeenCalledWith(packId);
      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe(mockReport1.id);
      expect(result[1]!.id).toBe(mockReport2.id);
    });

    it('throws NotFoundException when pack does not exist', async () => {
      packRepository.findPackById.mockResolvedValue(null);

      await expect(service.listReportsByPack('non-existent-pack')).rejects.toThrow(
        NotFoundException,
      );
      expect(reportRepository.listReportsByPack).not.toHaveBeenCalled();
    });
  });
});
