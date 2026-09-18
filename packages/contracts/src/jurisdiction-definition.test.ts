import { describe, expect, it } from 'vitest';
import {
  complianceEvaluationResponseSchema,
  complianceEvaluationStatusSchema,
  createJurisdictionDefinitionSchema,
  createManualComplianceOverrideSchema,
  criterionEvaluationSchema,
  jurisdictionConfidenceLevelSchema,
} from './jurisdiction-definition';

describe('Jurisdiction Definition & Compliance Evaluation Contracts (Issue #26)', () => {
  describe('Jurisdiction Definition Schema', () => {
    it('validates a valid country-level jurisdiction definition', () => {
      const parsed = createJurisdictionDefinitionSchema.parse({
        code: 'BR',
        name: 'Brasil',
        metadata: {
          minInstructionalDays: 200,
          minInstructionalHours: 800,
          confidenceLevel: 'CONTESTED',
          officialSource: 'LDB Lei 9.394/1996 art. 24, I',
        },
      });

      expect(parsed.code).toBe('BR');
      expect(parsed.version).toBe(1);
      expect(parsed.status).toBe('DRAFT');
      expect(parsed.metadata.minInstructionalDays).toBe(200);
      expect(parsed.metadata.confidenceLevel).toBe('CONTESTED');
    });

    it('validates a subdivision-level code like US-TX or BR-SP', () => {
      const parsed = createJurisdictionDefinitionSchema.parse({
        code: 'US-TX',
        name: 'United States - Texas',
        metadata: {
          confidenceLevel: 'ESTABLISHED',
          officialSource: 'Texas Education Code § 25.085 / Leeper v. Arlington ISD (1987)',
          requiredSubjects: ['reading', 'spelling', 'grammar', 'mathematics', 'good citizenship'],
        },
      });

      expect(parsed.code).toBe('US-TX');
      expect(parsed.metadata.requiredSubjects).toEqual([
        'reading',
        'spelling',
        'grammar',
        'mathematics',
        'good citizenship',
      ]);
    });

    it('rejects invalid jurisdiction codes', () => {
      expect(() =>
        createJurisdictionDefinitionSchema.parse({
          code: 'invalid-code-1234',
          name: 'Invalid',
        })
      ).toThrow();
    });
  });

  describe('Compliance Evaluation Schemas', () => {
    it('validates all allowed compliance evaluation statuses', () => {
      const statuses = ['COMPLIANT', 'IN_PROGRESS', 'NON_COMPLIANT', 'REVIEW_NEEDED', 'EXEMPT'] as const;
      for (const st of statuses) {
        expect(complianceEvaluationStatusSchema.parse(st)).toBe(st);
      }
      expect(() => complianceEvaluationStatusSchema.parse('PRESUMED_COMPLIANT')).toThrow();
    });

    it('validates a single criterion evaluation breakdown', () => {
      const criterion = criterionEvaluationSchema.parse({
        criterion: 'INSTRUCTIONAL_DAYS',
        label: 'Dias Letivos Mínimos',
        status: 'IN_PROGRESS',
        currentValue: 155,
        targetValue: 200,
        explanation: '155 dias registrados de 200 exigidos (77.5%).',
        ruleCitation: 'LDB Art. 24, I',
      });

      expect(criterion.criterion).toBe('INSTRUCTIONAL_DAYS');
      expect(criterion.status).toBe('IN_PROGRESS');
      expect(criterion.currentValue).toBe(155);
    });

    it('validates a full compliance evaluation response with criteria and legal disclaimer', () => {
      const payload = {
        learnerId: '11111111-1111-4111-8111-111111111111',
        learnerName: 'Samuel Silva',
        academicYearId: '22222222-2222-4222-8222-222222222222',
        academicYearTitle: 'Ano Letivo 2026',
        overallStatus: 'REVIEW_NEEDED',
        statusSummary: 'Revisão necessária: o referencial da jurisdição é classificado como contestado no âmbito federal.',
        jurisdiction: {
          id: '33333333-3333-4333-8333-333333333333',
          code: 'BR',
          version: 1,
          name: 'Brasil',
          confidenceLevel: 'CONTESTED',
          officialSource: 'LDB Lei 9.394/1996 Art. 24, I',
          legalBasisNotes: 'A prática não possui lei federal específica; parâmetros aplicados por analogia.',
        },
        criteriaBreakdown: [
          {
            criterion: 'INSTRUCTIONAL_DAYS',
            label: 'Dias Letivos',
            status: 'COMPLIANT',
            currentValue: 205,
            targetValue: 200,
            explanation: 'Meta mínima atingida.',
            ruleCitation: 'LDB Art. 24, I',
          },
          {
            criterion: 'REQUIRED_SUBJECTS',
            label: 'Disciplinas Mínimas',
            status: 'REVIEW_NEEDED',
            explanation: 'Nenhuma lista taxativa de matérias para homeschooling definida em lei federal.',
            ruleCitation: 'Tema 822 STF (2018)',
          },
        ],
        manualOverride: null,
        legalDisclaimer:
          'Esta avaliação atesta o alinhamento pedagógico aos parâmetros cadastrados e não constitui salvo-conduto, garantia jurídica ou substituição de orientação legal especializada.',
        evaluatedAt: '2026-08-26T12:00:00.000Z',
      };

      const parsed = complianceEvaluationResponseSchema.parse(payload);
      expect(parsed.overallStatus).toBe('REVIEW_NEEDED');
      expect(parsed.criteriaBreakdown.length).toBe(2);
      expect(parsed.legalDisclaimer).toContain('não constitui salvo-conduto');
    });

    it('validates manual compliance override creation with reason length constraints', () => {
      const valid = createManualComplianceOverrideSchema.parse({
        learnerId: '11111111-1111-4111-8111-111111111111',
        academicYearId: '22222222-2222-4222-8222-222222222222',
        status: 'COMPLIANT',
        reason: 'Cumprimento integral verificado mediante avaliação médica e tutoria privada.',
      });

      expect(valid.status).toBe('COMPLIANT');

      // Reason too short (< 10 chars)
      expect(() =>
        createManualComplianceOverrideSchema.parse({
          learnerId: '11111111-1111-4111-8111-111111111111',
          academicYearId: '22222222-2222-4222-8222-222222222222',
          status: 'COMPLIANT',
          reason: 'ok',
        })
      ).toThrow();
    });
  });
});
