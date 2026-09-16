import { createHash } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import type { AttendanceCertificateDto, OfficialReportResponseDto } from '@aletheia/contracts';

export interface RenderedAttendanceCertificatePdf {
  bytes: Uint8Array;
  documentHash: string;
}

// Same verification mechanism as TranscriptPdfRenderer (#28): a disclaimer
// on every page that never frames this as a legal safe-conduct ("comprovante
// de não abandono intelectual"), plus a SHA-256 hash of the canonical data
// snapshot and the generating user's identity. This is intentionally the
// same wording/approach as the transcript renderer -- a second, divergent
// verification scheme would defeat the point of a single trustworthy
// mechanism across document types.
const DISCLAIMER =
  'Documento gerado a partir dos registros informados pela família na plataforma Aletheia. ' +
  'Reflete os dados cadastrados até a data de geração e não constitui, por si só, comprovação ' +
  'ou validação oficial perante órgãos governamentais ou educacionais. Consulte a legislação ' +
  'da sua jurisdição para os requisitos aplicáveis.';

const PAGE_WIDTH = 595.28; // A4 at 72 dpi
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_HEIGHT = 70;
const CONTENT_BOTTOM = MARGIN + FOOTER_HEIGHT;

@Injectable()
export class AttendanceCertificatePdfRenderer {
  async render(
    report: OfficialReportResponseDto,
    generatedByLabel: string | null,
  ): Promise<RenderedAttendanceCertificatePdf> {
    const rawContent = report.content as AttendanceCertificateDto;
    this.assertRequiredFields(rawContent);
    // Sanitize AFTER validating presence -- same rationale as the transcript
    // renderer: smart quotes / em dashes / emoji degrade to a safe ASCII
    // approximation instead of crashing PDF generation, while the hash below
    // is computed from the raw, unsanitized snapshot.
    const content = sanitizeAttendanceCertificate(rawContent);

    const documentHash = this.computeContentHash(report);
    const generatedAt = new Date(report.generatedAt);

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setCreationDate(generatedAt);
    pdfDoc.setModificationDate(generatedAt);
    pdfDoc.setProducer('Aletheia');
    pdfDoc.setTitle(report.title);
    pdfDoc.setAuthor(content.familyOrganizationName);
    pdfDoc.setSubject('Declaração de Frequência Escolar');

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const cursor = new Layout(pdfDoc, font, boldFont);

    cursor.heading(content.familyOrganizationName, 16);
    cursor.text('Registro Educacional Familiar & Portfólio de Formação Integral', 9, italicFont, rgb(0.35, 0.35, 0.35));
    cursor.spacer(6);
    cursor.heading(report.title, 13);
    cursor.spacer(10);

    cursor.keyValueRow([
      ['Educando', content.learnerName],
      ['Ciclo / Série', content.gradeLevel ?? 'Não informado'],
    ]);
    cursor.keyValueRow([
      ['Ano Acadêmico', content.academicYearTitle ?? 'Não informado'],
      ['Data de Emissão', content.generatedDate],
    ]);
    if (content.learnerBirthDate) {
      cursor.keyValueRow([['Data de Nascimento', content.learnerBirthDate]]);
    }
    cursor.spacer(10);

    cursor.heading('Declaração de Frequência & Carga Horária', 11);
    cursor.spacer(4);

    const summary = content.attendanceSummary;
    cursor.keyValueRow([
      ['Dias Letivos Registrados', String(summary.totalDaysLogged)],
      ['Dias Presentes', String(summary.presentDays)],
    ]);
    cursor.keyValueRow([
      ['Ausências', String(summary.absentDays)],
      ['Horas Cumpridas', `${summary.totalHoursLogged}h`],
    ]);
    if (summary.requiredDays !== null && summary.requiredDays !== undefined) {
      cursor.keyValueRow([
        ['Dias Letivos Exigidos', String(summary.requiredDays)],
        [
          'Percentual de Cumprimento (Dias)',
          summary.daysCompliancePercentage !== null && summary.daysCompliancePercentage !== undefined
            ? `${summary.daysCompliancePercentage}%`
            : 'Não calculado',
        ],
      ]);
    }
    if (summary.requiredHours !== null && summary.requiredHours !== undefined) {
      cursor.keyValueRow([
        ['Horas Exigidas', `${summary.requiredHours}h`],
        [
          'Percentual de Cumprimento (Horas)',
          summary.hoursCompliancePercentage !== null && summary.hoursCompliancePercentage !== undefined
            ? `${summary.hoursCompliancePercentage}%`
            : 'Não calculado',
        ],
      ]);
    }
    cursor.spacer(4);
    cursor.text(`Situação: ${summary.isCompliant ? 'Conforme Metas' : 'Em Andamento'}`, 9.5, boldFont);
    cursor.spacer(12);

    if (content.generalNotes) {
      cursor.heading('Observações Gerais', 11);
      cursor.spacer(4);
      cursor.paragraph(content.generalNotes, 9, italicFont);
      cursor.spacer(12);
    }

    cursor.spacer(20);
    cursor.signatureLines();

    const pages = cursor.finish();
    const generatedLine = generatedByLabel
      ? `Gerado por ${sanitizeText(generatedByLabel)} em ${generatedAt.toLocaleString('pt-BR')}`
      : `Gerado em ${generatedAt.toLocaleString('pt-BR')}`;

    pages.forEach((page, index) => {
      drawFooter(page, font, {
        pageNumber: index + 1,
        pageCount: pages.length,
        generatedLine,
        documentHash,
      });
    });

    const bytes = await pdfDoc.save({ useObjectStreams: false });
    return { bytes, documentHash };
  }

  private assertRequiredFields(content: AttendanceCertificateDto): void {
    const missing: string[] = [];
    if (!content.learnerName?.trim()) missing.push('learnerName');
    if (!content.familyOrganizationName?.trim()) missing.push('familyOrganizationName');
    if (!content.generatedDate?.trim()) missing.push('generatedDate');
    if (!content.attendanceSummary) missing.push('attendanceSummary');
    if (missing.length > 0) {
      throw new BadRequestException(
        `Cannot render PDF: report is missing required field(s): ${missing.join(', ')}.`,
      );
    }
  }

  private computeContentHash(report: OfficialReportResponseDto): string {
    const canonical = JSON.stringify({
      id: report.id,
      type: report.type,
      content: report.content,
    });
    return createHash('sha256').update(canonical).digest('hex');
  }
}

function drawFooter(
  page: PDFPage,
  font: PDFFont,
  info: { pageNumber: number; pageCount: number; generatedLine: string; documentHash: string },
): void {
  const lines = wrapText(DISCLAIMER, font, 7.5, CONTENT_WIDTH);
  let y = MARGIN + 34;
  page.drawLine({
    start: { x: MARGIN, y: y + 8 },
    end: { x: PAGE_WIDTH - MARGIN, y: y + 8 },
    thickness: 0.5,
    color: rgb(0.75, 0.75, 0.75),
  });
  for (const line of lines) {
    page.drawText(line, { x: MARGIN, y, size: 7.5, font, color: rgb(0.45, 0.45, 0.45) });
    y -= 9;
  }
  page.drawText(info.generatedLine, { x: MARGIN, y: MARGIN - 2, size: 7.5, font, color: rgb(0.45, 0.45, 0.45) });
  page.drawText(`Hash: ${info.documentHash.slice(0, 16)}…`, {
    x: MARGIN,
    y: MARGIN - 12,
    size: 7.5,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });
  const pageLabel = `Página ${info.pageNumber} de ${info.pageCount}`;
  page.drawText(pageLabel, {
    x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(pageLabel, 7.5),
    y: MARGIN - 2,
    size: 7.5,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });
}

// Same replacement table as TranscriptPdfRenderer -- WinAnsi (the encoding
// pdf-lib's standard fonts use) doesn't support smart quotes, en/em dashes,
// ellipsis, bullets or arrows, so they're mapped to a safe ASCII equivalent
// before falling back to '?' for anything else outside the encodable range.
const CHAR_REPLACEMENTS: ReadonlyArray<[string, string]> = [
  ['‘', "'"],
  ['’', "'"],
  ['“', '"'],
  ['”', '"'],
  ['–', '-'],
  ['—', '-'],
  ['…', '...'],
  ['•', '-'],
  ['→', '-'],
  ['←', '-'],
  ['↑', '-'],
  ['↓', '-'],
];

function sanitizeText(value: string): string {
  let result = value;
  for (const [from, to] of CHAR_REPLACEMENTS) {
    result = result.split(from).join(to);
  }
  return Array.from(result)
    .map((ch) => ((ch.codePointAt(0) ?? 0) <= 0xff ? ch : '?'))
    .join('');
}

function sanitizeAttendanceCertificate(content: AttendanceCertificateDto): AttendanceCertificateDto {
  return {
    ...content,
    learnerName: sanitizeText(content.learnerName),
    familyOrganizationName: sanitizeText(content.familyOrganizationName),
    gradeLevel: content.gradeLevel ? sanitizeText(content.gradeLevel) : content.gradeLevel,
    academicYearTitle: content.academicYearTitle
      ? sanitizeText(content.academicYearTitle)
      : content.academicYearTitle,
    generalNotes: content.generalNotes ? sanitizeText(content.generalNotes) : content.generalNotes,
  };
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Same tiny append-only layout helper as TranscriptPdfRenderer: tracks a Y
// cursor down the current page and starts a new page automatically when
// content would overflow into the footer band.
class Layout {
  private pages: PDFPage[] = [];
  private page: PDFPage;
  private y: number;

  constructor(
    private readonly doc: PDFDocument,
    private readonly font: PDFFont,
    private readonly boldFont: PDFFont,
  ) {
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pages.push(this.page);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private ensureSpace(needed: number): void {
    if (this.y - needed < CONTENT_BOTTOM) {
      this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.pages.push(this.page);
      this.y = PAGE_HEIGHT - MARGIN;
    }
  }

  heading(text: string, size: number): void {
    this.ensureSpace(size + 4);
    this.page.drawText(text, { x: MARGIN, y: this.y, size, font: this.boldFont, color: rgb(0.1, 0.1, 0.1) });
    this.y -= size + 4;
  }

  text(value: string, size: number, font: PDFFont = this.font, color = rgb(0.15, 0.15, 0.15)): void {
    this.ensureSpace(size + 3);
    this.page.drawText(value, { x: MARGIN, y: this.y, size, font, color });
    this.y -= size + 3;
  }

  paragraph(value: string, size: number, font: PDFFont = this.font): void {
    for (const line of wrapText(value, font, size, CONTENT_WIDTH)) {
      this.text(line, size, font);
    }
  }

  spacer(amount: number): void {
    this.y -= amount;
  }

  keyValueRow(pairs: Array<[string, string]>): void {
    const size = 9.5;
    this.ensureSpace(size + 4);
    const colWidth = CONTENT_WIDTH / pairs.length;
    pairs.forEach(([label, value], index) => {
      const x = MARGIN + colWidth * index;
      this.page.drawText(`${label}: `, { x, y: this.y, size, font: this.boldFont, color: rgb(0.2, 0.2, 0.2) });
      const labelWidth = this.boldFont.widthOfTextAtSize(`${label}: `, size);
      this.page.drawText(value, { x: x + labelWidth, y: this.y, size, font: this.font, color: rgb(0.15, 0.15, 0.15) });
    });
    this.y -= size + 6;
  }

  signatureLines(): void {
    this.ensureSpace(60);
    const colWidth = CONTENT_WIDTH / 2;
    const lineY = this.y - 30;
    this.page.drawLine({ start: { x: MARGIN, y: lineY }, end: { x: MARGIN + colWidth - 20, y: lineY }, thickness: 0.75, color: rgb(0.3, 0.3, 0.3) });
    this.page.drawLine({ start: { x: MARGIN + colWidth, y: lineY }, end: { x: MARGIN + colWidth * 2 - 20, y: lineY }, thickness: 0.75, color: rgb(0.3, 0.3, 0.3) });
    this.page.drawText('Responsável Legal / Educador Titular', { x: MARGIN, y: lineY - 12, size: 8.5, font: this.boldFont });
    this.page.drawText('Coordenador Pedagógico / Responsável', { x: MARGIN + colWidth, y: lineY - 12, size: 8.5, font: this.boldFont });
    this.y = lineY - 24;
  }

  finish(): PDFPage[] {
    return this.pages;
  }
}
