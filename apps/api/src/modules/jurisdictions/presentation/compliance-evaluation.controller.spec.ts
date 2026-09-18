import { BadRequestException } from '@nestjs/common';
import { ComplianceEvaluationController } from './compliance-evaluation.controller.js';
import type { ComplianceEvaluationResponseDto, ManualComplianceOverrideResponseDto } from '@aletheia/contracts';

describe('ComplianceEvaluationController', () => {
  let controller: ComplianceEvaluationController;
  let service: any;

  const FAMILY_ID = '11111111-1111-4111-8111-111111111111';
  const LEARNER_ID = '22222222-2222-4222-8222-222222222222';
  const YEAR_ID = '33333333-3333-4333-8333-333333333333';
  const ACTOR_ID = '44444444-4444-4444-8444-444444444444';

  const mockEvaluationResponse: ComplianceEvaluationResponseDto = {
    learnerId: LEARNER_ID,
    learnerName: 'Alice Silva',
    academicYearId: YEAR_ID,
    academicYearTitle: 'Ano Letivo 2026',
    overallStatus: 'IN_PROGRESS',
    statusSummary: 'Em andamento: 120 de 200 dias letivos.',
    jurisdiction: {
      id: '55555555-5555-4555-8555-555555555555',
      code: 'BR',
      version: 1,
      name: 'Brasil',
      confidenceLevel: 'CONTESTED',
      officialSource: 'LDB Lei 9.394/1996',
      legalBasisNotes: 'Zona de disputa jurídica.',
    },
    criteriaBreakdown: [],
    manualOverride: null,
    legalDisclaimer: 'Aviso legal Aletheia.',
    evaluatedAt: new Date().toISOString(),
  };

  const mockOverrideResponse: ManualComplianceOverrideResponseDto = {
    id: '66666666-6666-4666-8666-666666666666',
    status: 'COMPLIANT',
    reason: 'Comprovantes arquivados fisicamente pelo responsável.',
    overriddenByUserId: ACTOR_ID,
    overriddenByName: 'Responsável',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    service = {
      evaluateCompliance: jest.fn().mockResolvedValue(mockEvaluationResponse),
      recordManualOverride: jest.fn().mockResolvedValue(mockOverrideResponse),
    };

    controller = new ComplianceEvaluationController(service);
  });

  describe('GET evaluate', () => {
    it('delegates to service when learnerId is provided', async () => {
      const result = await controller.evaluate(FAMILY_ID, LEARNER_ID, YEAR_ID);

      expect(service.evaluateCompliance).toHaveBeenCalledWith(FAMILY_ID, LEARNER_ID, YEAR_ID);
      expect(result).toEqual(mockEvaluationResponse);
    });

    it('throws BadRequestException when learnerId is missing', async () => {
      await expect(controller.evaluate(FAMILY_ID, undefined, YEAR_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('POST override', () => {
    it('delegates manual override recording to service with actorId and body dto', async () => {
      const dto = {
        learnerId: LEARNER_ID,
        academicYearId: YEAR_ID,
        status: 'COMPLIANT' as const,
        reason: 'Comprovantes arquivados fisicamente pelo responsável.',
      };

      const result = await controller.override(FAMILY_ID, ACTOR_ID, dto);

      expect(service.recordManualOverride).toHaveBeenCalledWith(FAMILY_ID, ACTOR_ID, dto);
      expect(result).toEqual(mockOverrideResponse);
    });
  });
});
