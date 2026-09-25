import { BadRequestException } from '@nestjs/common';
import type { CreatePackReportOutput, PackReportResponseDto } from '@aletheia/contracts';
import { CurriculumPackReportController } from './curriculum-pack-report.controller.js';

describe('CurriculumPackReportController', () => {
  const packId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const userId = '11111111-1111-4111-8111-111111111111';
  const familyId = 'f1111111-1111-4111-8111-111111111111';

  const mockReportResponse: PackReportResponseDto = {
    id: 'r1111111-1111-4111-8111-111111111111',
    packId,
    reporterUserId: userId,
    reporterFamilyId: familyId,
    reason: 'SPAM_COMMERCIAL',
    details: 'Spam content',
    status: 'OPEN',
    createdAt: '2026-09-24T00:00:00.000Z',
    resolvedAt: null,
    resolvedByUserId: null,
  };

  const dto: CreatePackReportOutput = {
    reason: 'SPAM_COMMERCIAL',
    details: 'Spam content',
  };

  let reportService: {
    createReport: jest.Mock;
    listReportsByPack: jest.Mock;
  };

  let controller: CurriculumPackReportController;

  beforeEach(() => {
    reportService = {
      createReport: jest.fn(),
      listReportsByPack: jest.fn(),
    };

    controller = new CurriculumPackReportController(reportService as never);
  });

  describe('createReport', () => {
    it('creates report using familyId from request.family', async () => {
      reportService.createReport.mockResolvedValue(mockReportResponse);
      const req = {
        family: { familyId },
        headers: {},
      } as never;

      const result = await controller.createReport(packId, userId, req, dto);

      expect(reportService.createReport).toHaveBeenCalledWith(packId, userId, familyId, dto);
      expect(result).toEqual(mockReportResponse);
    });

    it('creates report using familyId from x-family-id header when request.family is absent', async () => {
      reportService.createReport.mockResolvedValue(mockReportResponse);
      const req = {
        headers: { 'x-family-id': familyId },
      } as never;

      const result = await controller.createReport(packId, userId, req, dto);

      expect(reportService.createReport).toHaveBeenCalledWith(packId, userId, familyId, dto);
      expect(result).toEqual(mockReportResponse);
    });

    it('throws BadRequestException when familyId is not available in request.family or headers', async () => {
      const req = {
        headers: {},
      } as never;

      await expect(controller.createReport(packId, userId, req, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.createReport(packId, userId, req, dto)).rejects.toThrow(
        'Family tenancy scope is required.',
      );

      expect(reportService.createReport).not.toHaveBeenCalled();
    });
  });
});
