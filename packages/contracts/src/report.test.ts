import { describe, expect, it } from 'vitest';
import {
  gradingScaleSchema,
  reportTypeSchema,
  exportFormatSchema,
  generateReportSchema,
  officialReportResponseSchema,
  subjectGradeSnapshotSchema,
  academicTranscriptSchema,
  learningPortfolioDossierSchema,
  annualComplianceReportSchema,
  reportVerificationResponseSchema,
  reportPreviewSchema,
} from './report.js';

const LEARNER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const YEAR_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const SUBJECT_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const REPORT_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
const FAMILY_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

describe('Report and Academic Transcript Contracts', () => {
  describe('Enums', () => {
    it('validates all allowed grading scales', () => {
      const scales = [
        'MASTERY_QUALITATIVE',
        'LETTER_A_F',
        'NUMERIC_0_10',
        'NUMERIC_0_100',
        'NARRATIVE',
      ] as const;

      for (const scale of scales) {
        expect(gradingScaleSchema.parse(scale)).toBe(scale);
      }
    });

    it('validates all allowed report types', () => {
      const types = [
        'ATTENDANCE_SUMMARY',
        'ACADEMIC_TRANSCRIPT',
        'LEARNING_PORTFOLIO_DOSSIER',
        'ANNUAL_COMPLIANCE_REPORT',
      ] as const;

      for (const t of types) {
        expect(reportTypeSchema.parse(t)).toBe(t);
      }
    });

    it('validates export formats', () => {
      const formats = ['PDF', 'CSV', 'JSON'] as const;
      for (const format of formats) {
        expect(exportFormatSchema.parse(format)).toBe(format);
      }
    });
  });

  describe('generateReportSchema', () => {
    it('validates a generate report payload with defaults', () => {
      const payload = {
        learnerId: LEARNER_ID,
        type: 'ACADEMIC_TRANSCRIPT' as const,
        title: 'Histórico Escolar Oficial - 2026',
      };

      const parsed = generateReportSchema.parse(payload);
      expect(parsed.learnerId).toBe(LEARNER_ID);
      expect(parsed.type).toBe('ACADEMIC_TRANSCRIPT');
      expect(parsed.title).toBe('Histórico Escolar Oficial - 2026');
      expect(parsed.gradingScale).toBe('MASTERY_QUALITATIVE');
      expect(parsed.includeAttendance).toBe(true);
      expect(parsed.includePortfolioHighlights).toBe(true);
    });

    it('validates custom generate report payload', () => {
      const payload = {
        learnerId: LEARNER_ID,
        academicYearId: YEAR_ID,
        type: 'ATTENDANCE_SUMMARY' as const,
        title: 'Relatório de Frequência e Horas Letivas',
        gradingScale: 'NUMERIC_0_100' as const,
        includeAttendance: true,
        includePortfolioHighlights: false,
        notes: 'Documento para comprovação anual',
      };

      const parsed = generateReportSchema.parse(payload);
      expect(parsed.gradingScale).toBe('NUMERIC_0_100');
      expect(parsed.includePortfolioHighlights).toBe(false);
      expect(parsed.notes).toBe('Documento para comprovação anual');
    });

    it('rejects empty title', () => {
      const invalid = {
        learnerId: LEARNER_ID,
        type: 'ACADEMIC_TRANSCRIPT' as const,
        title: '',
      };

      expect(() => generateReportSchema.parse(invalid)).toThrow();
    });
  });

  describe('subjectGradeSnapshotSchema', () => {
    it('validates subject grade snapshot with letter and numeric conversions', () => {
      const snapshot = {
        subjectId: SUBJECT_ID,
        subjectName: 'Matemática e Lógica',
        evaluationCount: 14,
        averageMasteryLevel: 'AUTONOMOUS',
        calculatedGrade: 'A (92/100)',
        letterGrade: 'A',
        numericGrade: 92,
        narrativeSummary: 'Demonstra excelente raciocínio analítico e autonomia na resolução de problemas.',
      };

      const parsed = subjectGradeSnapshotSchema.parse(snapshot);
      expect(parsed.subjectId).toBe(SUBJECT_ID);
      expect(parsed.subjectName).toBe('Matemática e Lógica');
      expect(parsed.numericGrade).toBe(92);
    });
  });

  describe('academicTranscriptSchema', () => {
    it('validates full academic transcript DTO', () => {
      const transcript = {
        learnerId: LEARNER_ID,
        learnerName: 'Ester Sá',
        learnerBirthDate: '2016-05-12',
        gradeLevel: '4º Ano Fundamental',
        academicYearId: YEAR_ID,
        academicYearTitle: 'Ano Letivo 2026',
        familyOrganizationName: 'Família Sá Homeschool',
        gradingScale: 'LETTER_A_F' as const,
        generatedDate: '2026-12-15',
        attendanceSummary: {
          learnerId: LEARNER_ID,
          totalDaysLogged: 204,
          presentDays: 200,
          absentDays: 4,
          totalHoursLogged: 840,
          requiredDays: 200,
          requiredHours: 800,
          daysCompliancePercentage: 100,
          hoursCompliancePercentage: 100,
          isCompliant: true,
        },
        subjectGrades: [
          {
            subjectId: SUBJECT_ID,
            subjectName: 'Matemática e Lógica',
            evaluationCount: 14,
            averageMasteryLevel: 'AUTONOMOUS',
            calculatedGrade: 'A',
            letterGrade: 'A',
            numericGrade: 92,
            narrativeSummary: 'Excelente desempenho.',
          },
        ],
        generalNotes: 'Aluno cumpriu todos os requisitos pedagógicos do ciclo.',
      };

      const parsed = academicTranscriptSchema.parse(transcript);
      expect(parsed.learnerName).toBe('Ester Sá');
      expect(parsed.subjectGrades).toHaveLength(1);
      expect(parsed.attendanceSummary?.isCompliant).toBe(true);
    });
  });

  describe('officialReportResponseSchema', () => {
    it('validates official report response DTO', () => {
      const response = {
        id: REPORT_ID,
        familyId: FAMILY_ID,
        learnerId: LEARNER_ID,
        learnerName: 'Ester Sá',
        academicYearId: YEAR_ID,
        academicYearTitle: 'Ano Letivo 2026',
        type: 'ACADEMIC_TRANSCRIPT' as const,
        title: 'Histórico Escolar Oficial - 2026',
        gradingScale: 'LETTER_A_F' as const,
        content: {
          learnerName: 'Ester Sá',
          gpa: '3.85',
        },
        generatedAt: '2026-12-15T10:00:00.000Z',
        createdAt: '2026-12-15T10:00:00.000Z',
        updatedAt: '2026-12-15T10:00:00.000Z',
      };

      const parsed = officialReportResponseSchema.parse(response);
      expect(parsed.id).toBe(REPORT_ID);
      expect(parsed.type).toBe('ACADEMIC_TRANSCRIPT');
      expect(parsed.content).toBeDefined();
    });
  });

  describe('learningPortfolioDossierSchema', () => {
    it('validates a complete learning portfolio dossier DTO', () => {
      const dossier = {
        learnerId: LEARNER_ID,
        learnerName: 'Ester Sá',
        learnerBirthDate: '2016-05-12',
        gradeLevel: '4º Ano Fundamental',
        academicYearId: YEAR_ID,
        academicYearTitle: 'Ano Letivo 2026',
        familyOrganizationName: 'Família Sá Homeschool',
        generatedDate: '2026-12-15',
        portfolioItems: [
          {
            title: 'Maquete do Sistema Solar',
            description: 'Trabalho tridimensional em argila e tinta acrílica.',
            evidenceTypeName: 'PROJECT_PHOTO',
            competencyNames: ['Astronomia Básica', 'Modelagem Tridimensional'],
            fileUrl: 'https://storage.aletheia.app/photos/solar-system.jpg',
            date: '2026-04-10',
            status: 'VALIDATED',
          },
        ],
        learningHighlights: [
          {
            subjectName: 'Ciências Naturais',
            notes: 'Compreendeu os movimentos de rotação e translação perfeitamente.',
            date: '2026-04-15',
          },
        ],
        generalNotes: 'Portfólio com foco em artes manuais e ciências experimentais.',
      };

      const parsed = learningPortfolioDossierSchema.parse(dossier);
      expect(parsed.learnerName).toBe('Ester Sá');
      expect(parsed.portfolioItems).toHaveLength(1);
      expect(parsed.portfolioItems[0]?.title).toBe('Maquete do Sistema Solar');
      expect(parsed.learningHighlights).toHaveLength(1);
    });
  });

  describe('annualComplianceReportSchema', () => {
    it('validates a full annual compliance report with jurisdiction reference', () => {
      const report = {
        learnerId: LEARNER_ID,
        learnerName: 'Ester Sá',
        learnerBirthDate: '2016-05-12',
        gradeLevel: '4º Ano Fundamental',
        academicYearId: YEAR_ID,
        academicYearTitle: 'Ano Letivo 2026',
        familyOrganizationName: 'Família Sá Homeschool',
        generatedDate: '2026-12-15',
        jurisdiction: {
          code: 'BR',
          version: 1,
          name: 'Brasil (Referencial Nacional)',
          minInstructionalDays: 200,
          minInstructionalHours: 800,
          officialSource: 'LDB Lei nº 9.394/1996 art. 24',
          confidenceLevel: 'ESTABLISHED',
        },
        attendanceCompliance: {
          loggedDays: 205,
          requiredDays: 200,
          loggedHours: 820,
          requiredHours: 800,
          isCompliant: true,
        },
        curriculumProgress: [
          {
            subjectName: 'Língua Portuguesa',
            evaluatedCount: 22,
            averageMasteryLevel: 'MASTERED',
            calculatedGrade: 'Domínio Pleno',
          },
        ],
        legalDisclaimer:
          'Documento gerado a partir dos registros autodeclarados pela família na plataforma Aletheia. Não constitui salvo-conduto ou validação estatal automática.',
        generalNotes: 'Cumpriu a carga horária anual estipulada.',
      };

      const parsed = annualComplianceReportSchema.parse(report);
      expect(parsed.jurisdiction.code).toBe('BR');
      expect(parsed.attendanceCompliance.isCompliant).toBe(true);
      expect(parsed.legalDisclaimer.toLowerCase()).toContain('não constitui salvo-conduto');
    });
  });

  describe('reportVerificationResponseSchema', () => {
    it('validates verified report lookup response', () => {
      const verified = {
        status: 'VERIFIED' as const,
        documentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        reportId: REPORT_ID,
        reportType: 'ACADEMIC_TRANSCRIPT' as const,
        title: 'Histórico Escolar Oficial - 2026',
        learnerName: 'Ester Sá',
        familyOrganizationName: 'Família Sá Homeschool',
        generatedAt: '2026-12-15T10:00:00.000Z',
        academicYearTitle: 'Ano Letivo 2026',
        legalDisclaimer:
          'Documento gerado pela família na plataforma Aletheia. A plataforma atesta a integridade do arquivo gerado, mas não substitui autorização estatal.',
      };

      const parsed = reportVerificationResponseSchema.parse(verified);
      expect(parsed.status).toBe('VERIFIED');
      expect(parsed.documentHash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      expect(parsed.reportType).toBe('ACADEMIC_TRANSCRIPT');
    });

    it('validates not found report lookup response', () => {
      const notFound = {
        status: 'NOT_FOUND' as const,
        documentHash: '0000000000000000000000000000000000000000000000000000000000000000',
        reportId: null,
        reportType: null,
        title: null,
        learnerName: null,
        familyOrganizationName: null,
        generatedAt: null,
        academicYearTitle: null,
        legalDisclaimer: 'Documento não localizado no registro imutável do Aletheia.',
      };

      const parsed = reportVerificationResponseSchema.parse(notFound);
      expect(parsed.status).toBe('NOT_FOUND');
      expect(parsed.reportId).toBeNull();
    });
  });

  describe('reportPreviewSchema', () => {
    it('validates preview DTO', () => {
      const preview = {
        type: 'LEARNING_PORTFOLIO_DOSSIER' as const,
        title: 'Pré-visualização: Dossiê de Portfólio',
        learnerName: 'Ester Sá',
        familyOrganizationName: 'Família Sá Homeschool',
        academicYearTitle: 'Ano Letivo 2026',
        previewSummary: {
          itemsCount: 15,
          subjectsCount: 5,
        },
        draftContent: {
          someField: 'value',
        },
      };

      const parsed = reportPreviewSchema.parse(preview);
      expect(parsed.type).toBe('LEARNING_PORTFOLIO_DOSSIER');
      expect(parsed.previewSummary.itemsCount).toBe(15);
    });
  });
});
