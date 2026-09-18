import { PublicReportVerificationController } from './public-report-verification.controller.js';

describe('PublicReportVerificationController', () => {
  let controller: PublicReportVerificationController;
  let reportService: any;

  beforeEach(() => {
    reportService = {
      verifyReport: jest.fn().mockResolvedValue({
        status: 'VERIFIED',
        documentHash: 'a'.repeat(64),
        reportId: 'r-1',
        title: 'Histórico Escolar',
        learnerName: 'Ester',
        legalDisclaimer: 'Documento gerado na plataforma Aletheia.',
      }),
    };
    controller = new PublicReportVerificationController(reportService);
  });

  it('delegates report verification to ReportService', async () => {
    const hash = 'a'.repeat(64);
    const result = await controller.verifyReport(hash);

    expect(reportService.verifyReport).toHaveBeenCalledWith(hash);
    expect(result.status).toBe('VERIFIED');
    expect(result.documentHash).toBe(hash);
  });
});
