import { PDFDocument } from 'pdf-lib';
import { AnnualCompliancePdfRenderer } from './annual-compliance-pdf.renderer.js';
import type { AnnualComplianceReportDto, OfficialReportResponseDto } from '@aletheia/contracts';

function buildComplianceReport(
  overrides: Partial<AnnualComplianceReportDto> = {},
): OfficialReportResponseDto {
  const content: AnnualComplianceReportDto = {
    learnerId: 'l0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    learnerName: 'Ester Sá e Conceição',
    learnerBirthDate: '2016-05-12',
    gradeLevel: '4º Ano Fundamental',
    academicYearId: 'y0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    academicYearTitle: 'Ano Letivo 2026',
    familyOrganizationName: 'Academia Família Sá',
    generatedDate: '2026-08-26',
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
      loggedDays: 204,
      requiredDays: 200,
      loggedHours: 820,
      requiredHours: 800,
      isCompliant: true,
    },
    curriculumProgress: [
      {
        subjectName: 'Língua Portuguesa',
        evaluatedCount: 18,
        averageMasteryLevel: 'MASTERED',
        calculatedGrade: 'Domínio Pleno',
      },
      {
        subjectName: 'Matemática & Lógica',
        evaluatedCount: 20,
        averageMasteryLevel: 'AUTONOMOUS',
        calculatedGrade: 'Autônomo',
      },
    ],
    legalDisclaimer:
      'Documento gerado a partir dos registros informados pela família na plataforma Aletheia. Reflete os dados lançados e não constitui comprovação oficial nem salvo-conduto jurídico ("comprovante de não abandono intelectual").',
    generalNotes: 'Cumpriu a carga horária anual estipulada.',
    ...overrides,
  };

  return {
    id: 'r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    familyId: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    learnerId: content.learnerId,
    type: 'ANNUAL_COMPLIANCE_REPORT',
    title: 'Relatório Anual de Cumprimento Legal — Ester 2026',
    gradingScale: 'MASTERY_QUALITATIVE',
    content,
    generatedAt: '2026-08-26T12:00:00.000Z',
    createdAt: '2026-08-26T12:00:00.000Z',
    updatedAt: '2026-08-26T12:00:00.000Z',
  };
}

describe('AnnualCompliancePdfRenderer', () => {
  let renderer: AnnualCompliancePdfRenderer;

  beforeEach(() => {
    renderer = new AnnualCompliancePdfRenderer();
  });

  it('renders a valid, loadable PDF with a 64-character sha256 document hash', async () => {
    const { bytes, documentHash } = await renderer.render(buildComplianceReport(), null);

    expect(Buffer.from(bytes.slice(0, 5)).toString('latin1')).toBe('%PDF-');
    expect(documentHash).toMatch(/^[0-9a-f]{64}$/);

    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('produces byte-identical output and an identical hash for the same data snapshot', async () => {
    const report = buildComplianceReport();
    const first = await renderer.render(report, 'Jane Guardian');
    const second = await renderer.render(report, 'Jane Guardian');

    expect(second.documentHash).toBe(first.documentHash);
    expect(Buffer.from(second.bytes).equals(Buffer.from(first.bytes))).toBe(true);
  });

  it('produces a different hash when the underlying data changes', async () => {
    const original = await renderer.render(buildComplianceReport(), null);
    const changed = await renderer.render(
      buildComplianceReport({ generalNotes: 'Parecer pedagógico modificado.' }),
      null,
    );

    expect(changed.documentHash).not.toBe(original.documentHash);
  });

  it('renders Portuguese diacritics and special characters without throwing', async () => {
    const report = buildComplianceReport({
      learnerName: 'Ítalo José Nuñéz-Öçalan',
      generalNotes:
        'Ênfase em leitura, narração e formação do coração. Aprendeu lições de paciência e perseverança.',
    });

    const { bytes } = await renderer.render(report, null);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it('fails with BadRequestException when required fields are missing', async () => {
    const invalid = buildComplianceReport({ learnerName: '' });
    await expect(renderer.render(invalid, null)).rejects.toThrow('learnerName');
  });
});
