import { PDFDocument } from 'pdf-lib';
import { TranscriptPdfRenderer } from './transcript-pdf.renderer.js';
import type { AcademicTranscriptDto, OfficialReportResponseDto } from '@aletheia/contracts';

function buildReport(overrides: Partial<AcademicTranscriptDto> = {}): OfficialReportResponseDto {
  const content: AcademicTranscriptDto = {
    learnerId: 'l0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    learnerName: 'João da Conceição Araújo',
    learnerBirthDate: '2016-05-12',
    gradeLevel: 'Educação Infantil — Nível II',
    academicYearId: 'y0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    academicYearTitle: 'Ano Letivo 2026',
    familyOrganizationName: 'Academia Família Conceição',
    gradingScale: 'MASTERY_QUALITATIVE',
    generatedDate: '2026-08-26',
    attendanceSummary: {
      learnerId: 'l0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      learnerName: 'João',
      academicYearId: 'y0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      totalDaysLogged: 160,
      presentDays: 155,
      absentDays: 5,
      totalHoursLogged: 620,
      requiredDays: 200,
      requiredHours: 800,
      daysCompliancePercentage: 78,
      hoursCompliancePercentage: 78,
      isCompliant: false,
    },
    subjectGrades: [
      {
        subjectId: 's0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        subjectName: 'Educação Religiosa & Formação de Caráter',
        evaluationCount: 12,
        averageMasteryLevel: 'AUTONOMOUS',
        calculatedGrade: 'Autônomo',
        letterGrade: 'B',
        numericGrade: 8.5,
        narrativeSummary: 'Demonstrou compreensão sólida das narrações bíblicas e reverência.',
      },
    ],
    generalNotes: 'Aluno dedicado, com atenção e diligência crescentes ao longo do período letivo.',
    ...overrides,
  };

  return {
    id: 'r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    familyId: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    learnerId: content.learnerId,
    type: 'ACADEMIC_TRANSCRIPT',
    title: 'Histórico Escolar Oficial — João 2026',
    gradingScale: content.gradingScale,
    content,
    generatedAt: '2026-08-26T12:00:00.000Z',
    createdAt: '2026-08-26T12:00:00.000Z',
    updatedAt: '2026-08-26T12:00:00.000Z',
  };
}

describe('TranscriptPdfRenderer', () => {
  let renderer: TranscriptPdfRenderer;

  beforeEach(() => {
    renderer = new TranscriptPdfRenderer();
  });

  it('renders a valid, loadable PDF with a 64-character sha256 document hash', async () => {
    const { bytes, documentHash } = await renderer.render(buildReport(), null);

    expect(Buffer.from(bytes.slice(0, 5)).toString('latin1')).toBe('%PDF-');
    expect(documentHash).toMatch(/^[0-9a-f]{64}$/);

    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('produces byte-identical output and an identical hash for the same data snapshot', async () => {
    const report = buildReport();
    const first = await renderer.render(report, 'Jane Guardian');
    const second = await renderer.render(report, 'Jane Guardian');

    expect(second.documentHash).toBe(first.documentHash);
    expect(Buffer.from(second.bytes).equals(Buffer.from(first.bytes))).toBe(true);
  });

  it('produces a different hash when the underlying data changes', async () => {
    const original = await renderer.render(buildReport(), null);
    const changed = await renderer.render(
      buildReport({ generalNotes: 'Texto diferente do original.' }),
      null,
    );

    expect(changed.documentHash).not.toBe(original.documentHash);
  });

  it('renders Portuguese diacritics and special characters without throwing', async () => {
    const report = buildReport({
      learnerName: 'Ítalo José Nuñéz-Öçalan',
      generalNotes:
        'Ênfase em leitura, redação e educação física. Ele não se cansa de aprender línguas estrangeiras: francês, espanhol e alemão.',
      subjectGrades: [
        {
          subjectId: 's0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
          subjectName: 'Língua Portuguesa & Composição',
          evaluationCount: 4,
          averageMasteryLevel: 'MASTERED',
          calculatedGrade: 'Domínio Pleno',
          letterGrade: null,
          numericGrade: null,
          narrativeSummary: 'Excelente domínio da língua-mãe, incluindo acentuação e pontuação.',
        },
      ],
    });

    await expect(renderer.render(report, null)).resolves.toBeDefined();
  });

  it('adds extra pages when the subject-grades table overflows a single page', async () => {
    const manySubjects: AcademicTranscriptDto['subjectGrades'] = Array.from({ length: 60 }, (_, i) => ({
      subjectId: `s${i}-eebc99-9c0b-4ef8-bb6d-6bb9bd380a00`,
      subjectName: `Disciplina Eletiva Número ${i + 1}`,
      evaluationCount: i,
      averageMasteryLevel: 'DEVELOPING',
      calculatedGrade: 'Em Desenvolvimento',
      letterGrade: null,
      numericGrade: null,
      narrativeSummary: 'Progresso satisfatório de acordo com o plano curricular.',
    }));

    const { bytes } = await renderer.render(buildReport({ subjectGrades: manySubjects }), null);
    const reloaded = await PDFDocument.load(bytes);

    expect(reloaded.getPageCount()).toBeGreaterThan(1);
  });

  it('degrades unsupported characters (smart quotes, em dash, emoji) to safe substitutes instead of crashing', async () => {
    const report = buildReport({
      generalNotes:
        'A mãe disse: “ele está indo muito bem” — progresso notável 🎉 e continua… sempre motivado.',
    });

    await expect(renderer.render(report, null)).resolves.toBeDefined();
  });

  it('throws when a required field is missing instead of rendering a blank document', async () => {
    const report = buildReport({ learnerName: '' });
    await expect(renderer.render(report, null)).rejects.toThrow(/missing required field/);
  });
});
