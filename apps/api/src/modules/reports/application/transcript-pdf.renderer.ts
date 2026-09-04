import { createHash } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import type { AcademicTranscriptDto, OfficialReportResponseDto } from '@aletheia/contracts';

export interface RenderedTranscriptPdf {
  bytes: Uint8Array;
  documentHash: string;
}

// Printed on every page — the whole point of #28 is that this document
// must never be mistaken for a legal safe-conduct ("comprovante de não
// abandono intelectual"). It states what the document is (a snapshot of
// family-reported data) and what it is not (an official validation).
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
export class TranscriptPdfRenderer {
  async render(
    report: OfficialReportResponseDto,
    generatedByLabel: string | null,
  ): Promise<RenderedTranscriptPdf> {
    const rawContent = report.content as AcademicTranscriptDto;
    this.assertRequiredFields(rawContent);
    // Sanitize AFTER validating presence, so a family typing smart quotes,
    // an em dash, or an emoji into a notes field degrades to a safe ASCII
    // approximation instead of crashing PDF generation outright — but the
    // hash below is computed from the raw, unsanitized snapshot, so it
    // still reflects exactly what was stored.
    const content = sanitizeTranscript(rawContent);

    const documentHash = this.computeContentHash(report);
    const generatedAt = new Date(report.generatedAt);

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setCreationDate(generatedAt);
    pdfDoc.setModificationDate(generatedAt);
    pdfDoc.setProducer('Aletheia');
    pdfDoc.setTitle(report.title);
    pdfDoc.setAuthor(content.familyOrganizationName);
    pdfDoc.setSubject('Histórico escolar');

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

    cursor.text(`Critério de avaliação: ${GRADING_SCALE_LABELS[content.gradingScale] ?? content.gradingScale}`, 9, font);
    cursor.spacer(12);

    cursor.heading('Disciplinas & Avaliações Acadêmicas', 11);
    cursor.spacer(4);
    cursor.subjectGradesTable(content.subjectGrades);
    cursor.spacer(12);

    if (content.attendanceSummary) {
      const summary = content.attendanceSummary;
      cursor.heading('Registro de Frequência & Carga Horária', 11);
      cursor.spacer(4);
      cursor.text(
        `Dias letivos totais: ${summary.totalDaysLogged}    Dias presentes: ${summary.presentDays}    ` +
          `Ausências: ${summary.absentDays}    Horas cumpridas: ${summary.totalHoursLogged}h    ` +
          `Situação: ${summary.isCompliant ? 'Conforme Metas' : 'Em Andamento'}`,
        9,
        font,
      );
      cursor.spacer(12);
    }

    if (content.generalNotes) {
      cursor.heading('Observações Gerais & Formação do Caráter', 11);
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

  private assertRequiredFields(content: AcademicTranscriptDto): void {
    const missing: string[] = [];
    if (!content.learnerName?.trim()) missing.push('learnerName');
    if (!content.familyOrganizationName?.trim()) missing.push('familyOrganizationName');
    if (!content.generatedDate?.trim()) missing.push('generatedDate');
    if (!content.gradingScale) missing.push('gradingScale');
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
      gradingScale: report.gradingScale,
      content: report.content,
    });
    return createHash('sha256').update(canonical).digest('hex');
  }
}

const GRADING_SCALE_LABELS: Record<string, string> = {
  MASTERY_QUALITATIVE: 'Escala Qualitativa de Domínio (Exposição - Autonomia - Domínio)',
  LETTER_A_F: 'Conceito Letrado Tradicional (A, B, C, D, F)',
  NUMERIC_0_10: 'Escala Numérica Decimal (0.0 a 10.0)',
  NUMERIC_0_100: 'Escala Numérica Percentual (0 a 100)',
  NARRATIVE: 'Avaliação Descritiva e Narrativa Contínua',
};

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

// Common punctuation that WinAnsi (the encoding pdf-lib's standard fonts
// use) doesn't support but that shows up constantly in real user text —
// smart quotes from copy-paste, en/em dashes, ellipsis, bullets, arrows.
// Mapped to a safe ASCII equivalent before falling back to '?' for
// anything else outside the encodable range, so an unexpected character
// degrades gracefully instead of crashing PDF generation.
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

function sanitizeTranscript(content: AcademicTranscriptDto): AcademicTranscriptDto {
  return {
    ...content,
    learnerName: sanitizeText(content.learnerName),
    familyOrganizationName: sanitizeText(content.familyOrganizationName),
    gradeLevel: content.gradeLevel ? sanitizeText(content.gradeLevel) : content.gradeLevel,
    academicYearTitle: content.academicYearTitle
      ? sanitizeText(content.academicYearTitle)
      : content.academicYearTitle,
    generalNotes: content.generalNotes ? sanitizeText(content.generalNotes) : content.generalNotes,
    subjectGrades: content.subjectGrades.map((grade) => ({
      ...grade,
      subjectName: sanitizeText(grade.subjectName),
      calculatedGrade: sanitizeText(grade.calculatedGrade),
      letterGrade: grade.letterGrade ? sanitizeText(grade.letterGrade) : grade.letterGrade,
      averageMasteryLevel: grade.averageMasteryLevel
        ? sanitizeText(grade.averageMasteryLevel)
        : grade.averageMasteryLevel,
      narrativeSummary: grade.narrativeSummary
        ? sanitizeText(grade.narrativeSummary)
        : grade.narrativeSummary,
    })),
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

// Tiny append-only layout helper: tracks a Y cursor down the current page
// and starts a new page automatically when content would overflow into the
// footer band. Keeping this here (rather than pulling in a layout library)
// keeps the PDF generation dependency-free beyond pdf-lib itself.
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

  subjectGradesTable(grades: AcademicTranscriptDto['subjectGrades']): void {
    const columns = [
      { label: 'Disciplina', width: 0.32 },
      { label: 'Avaliações', width: 0.12 },
      { label: 'Domínio Médio', width: 0.16 },
      { label: 'Nota/Conceito', width: 0.16 },
      { label: 'Síntese', width: 0.24 },
    ] as const;
    const size = 8.5;
    const rowHeight = 16;

    const drawHeader = () => {
      this.ensureSpace(rowHeight + 4);
      let x = MARGIN;
      this.page.drawRectangle({
        x: MARGIN,
        y: this.y - rowHeight + 4,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: rgb(0.93, 0.93, 0.9),
      });
      for (const col of columns) {
        this.page.drawText(col.label, { x: x + 2, y: this.y - 10, size, font: this.boldFont, color: rgb(0.2, 0.2, 0.2) });
        x += CONTENT_WIDTH * col.width;
      }
      this.y -= rowHeight;
    };

    drawHeader();

    if (grades.length === 0) {
      this.ensureSpace(rowHeight);
      this.page.drawText('Nenhuma disciplina avaliada neste período letivo.', {
        x: MARGIN + 2,
        y: this.y - 10,
        size,
        font: this.font,
        color: rgb(0.4, 0.4, 0.4),
      });
      this.y -= rowHeight;
      return;
    }

    for (const grade of grades) {
      if (this.y - rowHeight < CONTENT_BOTTOM) {
        this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        this.pages.push(this.page);
        this.y = PAGE_HEIGHT - MARGIN;
        drawHeader();
      }

      const gradeLabel = [
        grade.calculatedGrade,
        grade.letterGrade ? `(${grade.letterGrade})` : '',
        grade.numericGrade !== null && grade.numericGrade !== undefined ? `[${grade.numericGrade}]` : '',
      ]
        .filter(Boolean)
        .join(' ');

      const values = [
        grade.subjectName,
        String(grade.evaluationCount),
        grade.averageMasteryLevel ?? '—',
        gradeLabel,
        truncate(grade.narrativeSummary ?? 'Progresso satisfatório de acordo com o plano curricular.', 60),
      ];

      let x = MARGIN;
      values.forEach((value, i) => {
        this.page.drawText(value, {
          x: x + 2,
          y: this.y - 10,
          size,
          font: this.font,
          color: rgb(0.15, 0.15, 0.15),
        });
        x += CONTENT_WIDTH * columns[i]!.width;
      });
      this.y -= rowHeight;
    }
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

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}
