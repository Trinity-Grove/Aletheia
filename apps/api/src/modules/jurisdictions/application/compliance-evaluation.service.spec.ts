import { NotFoundException } from '@nestjs/common';
import { ComplianceEvaluationService } from './compliance-evaluation.service.js';
import type { JurisdictionComplianceMetadata } from '@aletheia/contracts';

describe('ComplianceEvaluationService', () => {
  let service: ComplianceEvaluationService;
  let prisma: any;
  let jurisdictionRepo: any;

  const FAMILY_ID = '11111111-1111-4111-8111-111111111111';
  const OTHER_FAMILY_ID = '99999999-9999-4999-8999-999999999999';
  const LEARNER_ID = '22222222-2222-4222-8222-222222222222';
  const YEAR_ID = '33333333-3333-4333-8333-333333333333';
  const USER_ID = '44444444-4444-4444-8444-444444444444';
  const JURISDICTION_ID = '55555555-5555-4555-8555-555555555555';

  const mockLearner = {
    id: LEARNER_ID,
    familyId: FAMILY_ID,
    firstName: 'Alice',
    lastName: 'Silva',
    birthDate: new Date('2016-05-10'), // 10 years old in 2026
  };

  const mockAcademicYear = {
    id: YEAR_ID,
    familyId: FAMILY_ID,
    year: 2026,
    title: 'Ano Letivo 2026',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-12-15'),
    isCurrent: true,
  };

  const brazilMetadata: JurisdictionComplianceMetadata = {
    minInstructionalDays: 200,
    minInstructionalHours: 800,
    minLearnerAge: 4,
    maxLearnerAge: 17,
    requiredSubjects: [],
    evaluationRequirements: 'Sem regulamentacao formal federal.',
    notificationRequirements: 'Sem exigencia legal de matricula para homeschooling.',
    filingDeadlines: null,
    officialSource: 'LDB Lei 9.394/1996, Art. 24, I; STF RE 888.815',
    sourceCheckedOn: '2026-09-15',
    confidenceLevel: 'CONTESTED',
    legalBasisNotes: 'Educacao domiciliar em zona de disputa juridica no Brasil.',
  };

  const texasMetadata: JurisdictionComplianceMetadata = {
    minInstructionalDays: null,
    minInstructionalHours: null,
    minLearnerAge: 6,
    maxLearnerAge: 19,
    requiredSubjects: ['reading', 'spelling', 'grammar', 'mathematics', 'good_citizenship'],
    evaluationRequirements: 'No state-mandated standardized testing or portfolio review.',
    notificationRequirements: 'No notification required when beginning homeschooling directly.',
    filingDeadlines: null,
    officialSource: 'Texas Education Code § 25.085; Leeper v. Arlington ISD (1994)',
    sourceCheckedOn: '2026-09-18',
    confidenceLevel: 'ESTABLISHED',
    legalBasisNotes: 'Texas considers bona fide home schools as unaccredited private schools.',
  };

  const uruguayMetadata: JurisdictionComplianceMetadata = {
    minInstructionalDays: null,
    minInstructionalHours: null,
    minLearnerAge: 4,
    maxLearnerAge: 17,
    requiredSubjects: [],
    evaluationRequirements: null,
    notificationRequirements: 'Ley 18.437 estipula obligatoriedad de inscripcion formal.',
    filingDeadlines: null,
    officialSource: 'Ley General de Educacion N 18.437',
    sourceCheckedOn: '2026-09-18',
    confidenceLevel: 'UNCERTAIN',
    legalBasisNotes: 'Incertidumbre juridica alta sobre homeschooling.',
  };

  beforeEach(() => {
    prisma = {
      learner: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === LEARNER_ID) return Promise.resolve(mockLearner);
          return Promise.resolve(null);
        }),
      },
      academicYear: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === YEAR_ID) return Promise.resolve(mockAcademicYear);
          return Promise.resolve(null);
        }),
        findFirst: jest.fn().mockResolvedValue(mockAcademicYear),
      },
      attendanceRecord: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      complianceRequirement: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      complianceManualOverride: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) =>
          Promise.resolve({
            id: '66666666-6666-4666-8666-666666666666',
            ...data,
            createdAt: new Date('2026-09-18T10:00:00Z'),
            overriddenByUser: { fullName: 'Pai Responsavel' },
          }),
        ),
      },
      subject: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    jurisdictionRepo = {
      findById: jest.fn().mockResolvedValue(null),
      findCurrentPublishedByCode: jest.fn().mockResolvedValue(null),
    };

    service = new ComplianceEvaluationService(prisma, jurisdictionRepo);
  });

  describe('Multi-tenant and validation checks', () => {
    it('throws NotFoundException if learner does not exist or belongs to another family', async () => {
      await expect(service.evaluateCompliance(OTHER_FAMILY_ID, LEARNER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException if academic year does not belong to family', async () => {
      prisma.academicYear.findUnique.mockResolvedValue({
        ...mockAcademicYear,
        familyId: OTHER_FAMILY_ID,
      });

      await expect(service.evaluateCompliance(FAMILY_ID, LEARNER_ID, YEAR_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Missing or uncertain jurisdiction', () => {
    it('returns REVIEW_NEEDED when no jurisdiction is configured (never presumes compliance)', async () => {
      const result = await service.evaluateCompliance(FAMILY_ID, LEARNER_ID, YEAR_ID);

      expect(result.overallStatus).toBe('REVIEW_NEEDED');
      expect(result.jurisdiction.code).toBe('UNKNOWN');
      expect(result.statusSummary).toContain('Revisão');
      expect(result.legalDisclaimer).toBeDefined();
      expect(result.legalDisclaimer.length).toBeGreaterThan(20);
    });

    it('returns REVIEW_NEEDED when jurisdiction has confidenceLevel UNCERTAIN (e.g. Uruguay)', async () => {
      jurisdictionRepo.findCurrentPublishedByCode.mockResolvedValue({
        id: JURISDICTION_ID,
        code: 'UY',
        version: 1,
        name: 'Uruguay',
        metadata: uruguayMetadata,
      });
      prisma.complianceRequirement.findUnique.mockResolvedValue({
        jurisdiction: 'UY',
        jurisdictionDefinitionId: JURISDICTION_ID,
      });

      const result = await service.evaluateCompliance(FAMILY_ID, LEARNER_ID, YEAR_ID);

      expect(result.overallStatus).toBe('REVIEW_NEEDED');
      expect(result.jurisdiction.confidenceLevel).toBe('UNCERTAIN');
      expect(result.statusSummary).toContain('incerteza');
    });
  });

  describe('Brazil jurisdiction (BR)', () => {
    beforeEach(() => {
      jurisdictionRepo.findCurrentPublishedByCode.mockResolvedValue({
        id: JURISDICTION_ID,
        code: 'BR',
        version: 1,
        name: 'Brasil',
        metadata: brazilMetadata,
      });
      prisma.complianceRequirement.findUnique.mockResolvedValue({
        jurisdiction: 'BR',
        jurisdictionDefinitionId: JURISDICTION_ID,
        minInstructionalDays: 200,
        minInstructionalHours: 800,
      });
    });

    it('evaluates instructional days and hours as IN_PROGRESS during active school year', async () => {
      prisma.attendanceRecord.findMany.mockResolvedValue([
        { status: 'PRESENT', hoursSpent: 4.5 },
        { status: 'FIELD_TRIP', hoursSpent: 5 },
        { status: 'EXCUSED_ABSENCE', hoursSpent: 0 },
      ]);

      const result = await service.evaluateCompliance(FAMILY_ID, LEARNER_ID, YEAR_ID);

      const daysCriterion = result.criteriaBreakdown.find(
        (c) => c.criterion === 'INSTRUCTIONAL_DAYS',
      );
      const hoursCriterion = result.criteriaBreakdown.find(
        (c) => c.criterion === 'INSTRUCTIONAL_HOURS',
      );

      expect(daysCriterion).toBeDefined();
      expect(daysCriterion?.currentValue).toBe(2);
      expect(daysCriterion?.targetValue).toBe(200);
      expect(daysCriterion?.status).toBe('IN_PROGRESS');

      expect(hoursCriterion).toBeDefined();
      expect(hoursCriterion?.currentValue).toBe(9.5);
      expect(hoursCriterion?.targetValue).toBe(800);
      expect(hoursCriterion?.status).toBe('IN_PROGRESS');
    });

    it('evaluates learner age against compulsory schooling range', async () => {
      const result = await service.evaluateCompliance(FAMILY_ID, LEARNER_ID, YEAR_ID);

      const ageCriterion = result.criteriaBreakdown.find((c) => c.criterion === 'LEARNER_AGE');
      expect(ageCriterion).toBeDefined();
      expect(ageCriterion?.status).toBe('COMPLIANT');
      expect(ageCriterion?.explanation).toContain('dentro da faixa');
    });
  });

  describe('Texas jurisdiction (US-TX)', () => {
    beforeEach(() => {
      jurisdictionRepo.findCurrentPublishedByCode.mockResolvedValue({
        id: JURISDICTION_ID,
        code: 'US-TX',
        version: 1,
        name: 'Texas (USA)',
        metadata: texasMetadata,
      });
      prisma.complianceRequirement.findUnique.mockResolvedValue({
        jurisdiction: 'US-TX',
        jurisdictionDefinitionId: JURISDICTION_ID,
      });
    });

    it('marks instructional days and hours as EXEMPT when no statutory minimum is required', async () => {
      const result = await service.evaluateCompliance(FAMILY_ID, LEARNER_ID, YEAR_ID);

      const daysCriterion = result.criteriaBreakdown.find(
        (c) => c.criterion === 'INSTRUCTIONAL_DAYS',
      );
      const hoursCriterion = result.criteriaBreakdown.find(
        (c) => c.criterion === 'INSTRUCTIONAL_HOURS',
      );

      expect(daysCriterion?.status).toBe('EXEMPT');
      expect(hoursCriterion?.status).toBe('EXEMPT');
    });

    it('evaluates required subjects and marks IN_PROGRESS when some are missing', async () => {
      prisma.subject.findMany.mockResolvedValue([
        { name: 'Matemática', archivedAt: null },
        { name: 'Reading & Literature', archivedAt: null },
      ]);

      const result = await service.evaluateCompliance(FAMILY_ID, LEARNER_ID, YEAR_ID);

      const subjectsCriterion = result.criteriaBreakdown.find(
        (c) => c.criterion === 'REQUIRED_SUBJECTS',
      );
      expect(subjectsCriterion).toBeDefined();
      expect(subjectsCriterion?.status).toBe('IN_PROGRESS');
      expect(subjectsCriterion?.explanation).toContain('disciplinas obrigatórias');
    });

    it('evaluates required subjects as COMPLIANT when all 5 are present', async () => {
      prisma.subject.findMany.mockResolvedValue([
        { name: 'Mathematics', archivedAt: null },
        { name: 'Reading', archivedAt: null },
        { name: 'Spelling', archivedAt: null },
        { name: 'Grammar', archivedAt: null },
        { name: 'Good Citizenship and Civics', archivedAt: null },
      ]);

      const result = await service.evaluateCompliance(FAMILY_ID, LEARNER_ID, YEAR_ID);

      const subjectsCriterion = result.criteriaBreakdown.find(
        (c) => c.criterion === 'REQUIRED_SUBJECTS',
      );
      expect(subjectsCriterion?.status).toBe('COMPLIANT');
    });
  });

  describe('Audited Manual Override', () => {
    it('applies manual override to overallStatus and includes audit data and reason', async () => {
      prisma.complianceManualOverride.findFirst.mockResolvedValue({
        id: '66666666-6666-4666-8666-666666666666',
        familyId: FAMILY_ID,
        learnerId: LEARNER_ID,
        academicYearId: YEAR_ID,
        status: 'EXEMPT',
        reason: 'Educando realizou programa de intercâmbio com documentação própria.',
        overriddenByUserId: USER_ID,
        overriddenByUser: { fullName: 'Maria Silva' },
        createdAt: new Date('2026-09-18T10:00:00Z'),
      });

      const result = await service.evaluateCompliance(FAMILY_ID, LEARNER_ID, YEAR_ID);

      expect(result.overallStatus).toBe('EXEMPT');
      expect(result.manualOverride).toBeDefined();
      expect(result.manualOverride?.status).toBe('EXEMPT');
      expect(result.manualOverride?.reason).toContain('intercâmbio');
      expect(result.manualOverride?.overriddenByName).toBe('Maria Silva');
      expect(result.statusSummary).toContain('Sobreposição manual');
    });

    it('records a new manual override successfully', async () => {
      const dto = {
        learnerId: LEARNER_ID,
        academicYearId: YEAR_ID,
        status: 'COMPLIANT' as const,
        reason: 'Comprovantes complementares arquivados em pasta física.',
      };

      const overrideResult = await service.recordManualOverride(FAMILY_ID, USER_ID, dto);

      expect(overrideResult.id).toBe('66666666-6666-4666-8666-666666666666');
      expect(overrideResult.status).toBe('COMPLIANT');
      expect(overrideResult.reason).toBe(dto.reason);
      expect(prisma.complianceManualOverride.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            familyId: FAMILY_ID,
            learnerId: LEARNER_ID,
            academicYearId: YEAR_ID,
            status: 'COMPLIANT',
            overriddenByUserId: USER_ID,
          }),
        }),
      );
    });
  });
});
