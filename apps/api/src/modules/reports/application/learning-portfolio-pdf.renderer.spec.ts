import { PDFDocument } from 'pdf-lib';
import { LearningPortfolioPdfRenderer } from './learning-portfolio-pdf.renderer.js';
import type { LearningPortfolioDossierDto, OfficialReportResponseDto } from '@aletheia/contracts';

function buildDossierReport(
  overrides: Partial<LearningPortfolioDossierDto> = {},
): OfficialReportResponseDto {
  const content: LearningPortfolioDossierDto = {
    learnerId: 'l0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    learnerName: 'Ester Sá e Conceição',
    learnerBirthDate: '2016-05-12',
    gradeLevel: '4º Ano Fundamental',
    academicYearId: 'y0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    academicYearTitle: 'Ano Letivo 2026',
    familyOrganizationName: 'Academia Família Sá',
    generatedDate: '2026-08-26',
    portfolioItems: [
      {
        title: 'Maquete do Sistema Solar',
        description: 'Trabalho em argila e tinta acrílica explorando escala e distâncias planetárias.',
        evidenceTypeName: 'PROJECT_PHOTO',
        competencyNames: ['Astronomia Básica', 'Modelagem'],
        fileUrl: 'https://storage.test/solar.jpg',
        date: '2026-04-10',
        status: 'VALIDATED',
      },
    ],
    learningHighlights: [
      {
        subjectName: 'Ciências Naturais',
        notes: 'Compreendeu os movimentos celestes com clareza.',
        date: '2026-04-15',
      },
    ],
    generalNotes: 'Excelente progresso reflexivo e domínio prático demonstrado ao longo do período.',
    ...overrides,
  };

  return {
    id: 'r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    familyId: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    learnerId: content.learnerId,
    type: 'LEARNING_PORTFOLIO_DOSSIER',
    title: 'Dossiê Anual de Portfólio — Ester 2026',
    gradingScale: 'MASTERY_QUALITATIVE',
    content,
    generatedAt: '2026-08-26T12:00:00.000Z',
    createdAt: '2026-08-26T12:00:00.000Z',
    updatedAt: '2026-08-26T12:00:00.000Z',
  };
}

describe('LearningPortfolioPdfRenderer', () => {
  let renderer: LearningPortfolioPdfRenderer;

  beforeEach(() => {
    renderer = new LearningPortfolioPdfRenderer();
  });

  it('renders a valid, loadable PDF with a 64-character sha256 document hash', async () => {
    const { bytes, documentHash } = await renderer.render(buildDossierReport(), null);

    expect(Buffer.from(bytes.slice(0, 5)).toString('latin1')).toBe('%PDF-');
    expect(documentHash).toMatch(/^[0-9a-f]{64}$/);

    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('produces byte-identical output and an identical hash for the same data snapshot', async () => {
    const report = buildDossierReport();
    const first = await renderer.render(report, 'Jane Guardian');
    const second = await renderer.render(report, 'Jane Guardian');

    expect(second.documentHash).toBe(first.documentHash);
    expect(Buffer.from(second.bytes).equals(Buffer.from(first.bytes))).toBe(true);
  });

  it('produces a different hash when the underlying data changes', async () => {
    const original = await renderer.render(buildDossierReport(), null);
    const changed = await renderer.render(
      buildDossierReport({ generalNotes: 'Novo parecer descritivo modificado.' }),
      null,
    );

    expect(changed.documentHash).not.toBe(original.documentHash);
  });

  it('renders Portuguese diacritics and special characters without throwing', async () => {
    const report = buildDossierReport({
      learnerName: 'Ítalo José Nuñéz-Öçalan',
      generalNotes:
        'Ênfase em leitura, narração e formação do coração. Aprendeu lições de paciência e perseverança.',
    });

    const { bytes } = await renderer.render(report, null);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it('fails with BadRequestException when required fields are missing', async () => {
    const invalid = buildDossierReport({ learnerName: '' });
    await expect(renderer.render(invalid, null)).rejects.toThrow('learnerName');
  });
});
