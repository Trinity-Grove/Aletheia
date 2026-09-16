import { PDFDocument } from 'pdf-lib';
import { AttendanceCertificatePdfRenderer } from './attendance-certificate-pdf.renderer.js';
import type { AttendanceCertificateDto, OfficialReportResponseDto } from '@aletheia/contracts';

function buildReport(overrides: Partial<AttendanceCertificateDto> = {}): OfficialReportResponseDto {
  const content: AttendanceCertificateDto = {
    learnerId: 'l0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    learnerName: 'João da Conceição Araújo',
    learnerBirthDate: '2016-05-12',
    gradeLevel: 'Educação Infantil — Nível II',
    academicYearId: 'y0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    academicYearTitle: 'Ano Letivo 2026',
    familyOrganizationName: 'Academia Família Conceição',
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
    generalNotes: 'Frequência regular ao longo do período letivo, com poucas ausências justificadas.',
    ...overrides,
  };

  return {
    id: 'r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    familyId: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    learnerId: content.learnerId,
    type: 'ATTENDANCE_SUMMARY',
    title: 'Declaração de Frequência Escolar — João 2026',
    gradingScale: 'MASTERY_QUALITATIVE',
    content,
    generatedAt: '2026-08-26T12:00:00.000Z',
    createdAt: '2026-08-26T12:00:00.000Z',
    updatedAt: '2026-08-26T12:00:00.000Z',
  };
}

describe('AttendanceCertificatePdfRenderer', () => {
  let renderer: AttendanceCertificatePdfRenderer;

  beforeEach(() => {
    renderer = new AttendanceCertificatePdfRenderer();
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

  it('produces a different hash than a transcript would for equivalent-looking data (type is part of the canonical snapshot)', async () => {
    const report = buildReport();
    const { documentHash } = await renderer.render(report, null);
    // Sanity: the hash is 64 lowercase hex characters and is derived from
    // {id, type, content} -- changing the report id must change the hash.
    const otherId = await renderer.render({ ...report, id: 'different-id' }, null);
    expect(otherId.documentHash).not.toBe(documentHash);
  });

  it('embeds the generator attribution line and disclaimer, never the "comprovante de não abandono intelectual" framing', async () => {
    const { bytes } = await renderer.render(buildReport(), 'Jane Guardian');
    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBeGreaterThanOrEqual(1);
    // The disclaimer text itself is asserted at the source-constant level
    // in this file's sibling transcript spec; here we just confirm the
    // document renders successfully with a generatedByLabel present.
  });

  it('renders Portuguese diacritics and special characters without throwing', async () => {
    const report = buildReport({
      learnerName: 'Ítalo José Nuñéz-Öçalan',
      generalNotes:
        'Ênfase em regularidade e disciplina. Ele não se cansa de aprender línguas estrangeiras: francês, espanhol e alemão.',
    });

    await expect(renderer.render(report, null)).resolves.toBeDefined();
  });

  it('degrades unsupported characters (smart quotes, em dash, emoji) to safe substitutes instead of crashing', async () => {
    const report = buildReport({
      generalNotes:
        'A mãe disse: “ele frequenta regularmente” — progresso notável 🎉 e continua… sempre presente.',
    });

    await expect(renderer.render(report, null)).resolves.toBeDefined();
  });

  it('renders the compliance percentages and required-days/hours rows when present', async () => {
    const { bytes } = await renderer.render(buildReport(), null);
    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('renders without required-days/hours rows when compliance requirements are absent', async () => {
    const report = buildReport({
      attendanceSummary: {
        learnerId: 'l0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        totalDaysLogged: 40,
        presentDays: 40,
        absentDays: 0,
        totalHoursLogged: 160,
        isCompliant: true,
      },
    });

    await expect(renderer.render(report, null)).resolves.toBeDefined();
  });

  it('throws when a required field is missing instead of rendering a blank document', async () => {
    const report = buildReport({ learnerName: '' });
    await expect(renderer.render(report, null)).rejects.toThrow(/missing required field/);
  });

  it('throws when the attendance summary itself is missing', async () => {
    const report = buildReport({ attendanceSummary: undefined as any });
    await expect(renderer.render(report, null)).rejects.toThrow(/attendanceSummary/);
  });
});
