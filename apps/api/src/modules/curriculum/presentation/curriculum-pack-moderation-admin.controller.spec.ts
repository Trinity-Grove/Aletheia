import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import type {
  AdminModeratePackOutput,
  AdminResolveReportOutput,
  CurriculumPackResponseDto,
  PackReportResponseDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, PlatformAdminGuard } from '../../../platform/auth/index.js';
import { CurriculumPackModerationAdminController } from './curriculum-pack-moderation-admin.controller.js';
import type { ModerationQueueItem } from '../application/curriculum-pack-moderation.service.js';

describe('CurriculumPackModerationAdminController', () => {
  const adminUserId = '88888888-8888-4888-8888-888888888888';
  const packId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const reportId = 'r1111111-1111-4111-8111-111111111111';

  const mockPackDto: CurriculumPackResponseDto = {
    id: packId,
    code: 'TEST_PACK',
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: '1.0.0',
    name: 'Test Pack',
    description: 'Description',
    metadata: {},
    authorUserId: '99999999-9999-4999-8999-999999999999',
    moderationStatus: 'APPROVED',
    moderationNotes: null,
    moderatedAt: '2026-09-24T00:00:00.000Z',
    moderatedByUserId: adminUserId,
    createdAt: '2026-09-01T00:00:00.000Z',
    publishedAt: '2026-09-24T00:00:00.000Z',
    deprecatedAt: null,
  };

  const mockQueueItem: ModerationQueueItem = {
    pack: mockPackDto,
    authorTrustProfile: {
      userId: '99999999-9999-4999-8999-999999999999',
      trustScore: 45,
      tier: 'VERIFIED',
      approvedPacksCount: 2,
      rejectedPacksCount: 0,
      upheldReportsCount: 0,
      lastEvaluatedAt: '2026-09-24T00:00:00.000Z',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-09-24T00:00:00.000Z',
    },
    openReportsCount: 0,
  };

  const mockReportDto: PackReportResponseDto = {
    id: reportId,
    packId,
    reporterUserId: '11111111-1111-4111-8111-111111111111',
    reporterFamilyId: 'f1111111-1111-4111-8111-111111111111',
    reason: 'HARMFUL_INAPPROPRIATE',
    details: 'Inappropriate content',
    status: 'OPEN',
    createdAt: '2026-09-24T02:00:00.000Z',
    resolvedAt: null,
    resolvedByUserId: null,
  };

  let moderationService: {
    getModerationQueue: jest.Mock;
    moderatePack: jest.Mock;
    listReports: jest.Mock;
    resolveReport: jest.Mock;
  };

  let controller: CurriculumPackModerationAdminController;

  beforeEach(() => {
    moderationService = {
      getModerationQueue: jest.fn(),
      moderatePack: jest.fn(),
      listReports: jest.fn(),
      resolveReport: jest.fn(),
    };

    controller = new CurriculumPackModerationAdminController(moderationService as never);
  });

  it('has JwtAuthGuard and PlatformAdminGuard applied to the controller class', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, CurriculumPackModerationAdminController);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(PlatformAdminGuard);
  });

  describe('GET /queue', () => {
    it('returns moderation queue from service', async () => {
      moderationService.getModerationQueue.mockResolvedValue([mockQueueItem]);

      const result = await controller.getModerationQueue();

      expect(moderationService.getModerationQueue).toHaveBeenCalled();
      expect(result).toEqual([mockQueueItem]);
    });
  });

  describe('POST /packs/:id/moderate', () => {
    it('delegates moderation action to service', async () => {
      moderationService.moderatePack.mockResolvedValue(mockPackDto);

      const dto: AdminModeratePackOutput = {
        action: 'APPROVE',
        notes: 'Looks good',
      };

      const result = await controller.moderatePack(packId, adminUserId, dto);

      expect(moderationService.moderatePack).toHaveBeenCalledWith(packId, adminUserId, dto);
      expect(result).toEqual(mockPackDto);
    });
  });

  describe('GET /reports', () => {
    it('delegates reports listing with filters to service', async () => {
      moderationService.listReports.mockResolvedValue([mockReportDto]);

      const result = await controller.listReports('OPEN', packId);

      expect(moderationService.listReports).toHaveBeenCalledWith({
        status: 'OPEN',
        packId,
      });
      expect(result).toEqual([mockReportDto]);
    });

    it('works when no filters are provided', async () => {
      moderationService.listReports.mockResolvedValue([mockReportDto]);

      const result = await controller.listReports();

      expect(moderationService.listReports).toHaveBeenCalledWith({});
      expect(result).toEqual([mockReportDto]);
    });
  });

  describe('POST /reports/:id/resolve', () => {
    it('delegates report resolution to service', async () => {
      const resolvedReportDto: PackReportResponseDto = {
        ...mockReportDto,
        status: 'UPHELD',
        resolvedAt: '2026-09-24T05:00:00.000Z',
        resolvedByUserId: adminUserId,
      };
      moderationService.resolveReport.mockResolvedValue(resolvedReportDto);

      const dto: AdminResolveReportOutput = {
        status: 'UPHELD',
        notes: 'Infraction confirmed',
      };

      const result = await controller.resolveReport(reportId, adminUserId, dto);

      expect(moderationService.resolveReport).toHaveBeenCalledWith(reportId, adminUserId, dto);
      expect(result).toEqual(resolvedReportDto);
    });
  });
});
