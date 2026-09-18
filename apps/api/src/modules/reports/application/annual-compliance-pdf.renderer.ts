import { createHash } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import type { AnnualComplianceReportDto, OfficialReportResponseDto } from '@aletheia/contracts';

export interface RenderedCompliancePdf {
  bytes: Uint8Array;
  documentHash: string;
}

const DISCLAIMER =
  'Documento gerado a partir dos registros autodeclarados e informados pela família na plataforma Aletheia. ' +
  'Reflete exclusivamente os dados lançados e não constitui, por si só, comprovação ou validação estatal automática, ' +
  'nem salvo-conduto jurídico ("não serve como comprovante de não abandono intelectual"). ' +
  'Consulte a legislação da sua jurisdição.';

const PAGE_WIDTH = 595.28; // A4 at 72 dpi
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_HEIGHT = 70;
const CONTENT_BOTTOM = MARGIN + FOOTER_HEIGHT;

@Injectable()
export class AnnualCompliancePdfRenderer {
  async render(
    report: OfficialReportResponseDto,
    generatedByLabel: string | null,
  ): Promise<RenderedCompliancePdf> {
    const rawContent = report.content as AnnualComplianceReportDto;
    this.assertRequiredFields(rawContent);

    const content = sanitizeCompliance(rawContent);
    const documentHash = this.computeContentHash(report);
    const generatedAt = new Date(report.generatedAt);

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setCreationDate(generatedAt);
    pdfDoc.setModificationDate(generatedAt);
    pdfDoc.setProducer('Aletheia');
    pdfDoc.setTitle(report.title);
    pdfDoc.setAuthor(content.familyOrganizationName);
    pdfDoc.setSubject('Relatório Anual de Cumprimento Legal & Parâmetros Curriculares');

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const cursor = new Layout(pdfDoc, font, boldFont);

    // Header
    cursor.heading(content.familyOrganizationName, 16);
    cursor.text(
      'Relatório Anual de Cumprimento Legal & Parâmetros Curriculares',
      9,
      italicFont,
      rgb(0.35, 0.35, 0.35),
    );
    cursor.spacer(6);
    cursor.heading(report.title, 13);
    cursor.spacer(10);

    // Metadata
    cursor.keyValueRow([
      ['Educando', content.learnerName],
      ['Ciclo / Série', content.gradeLevel ?? 'Não informado'],
    ]);
    cursor.keyValueRow([
      ['Ano Letivo', content.academicYearTitle ?? 'Não vinculado'],
      ['Data de Emissão', content.generatedDate],
    ]);
    cursor.spacer(12);

    // Section 1: Jurisdiction & Legal References
    cursor.sectionTitle('1. Referencial Normativo & Parâmetros da Jurisdição');
    cursor.keyValueRow([
      ['Jurisdição', `${content.jurisdiction.name} (${content.jurisdiction.code} v${content.jurisdiction.version})`],
      ['Nível de Certeza', content.jurisdiction.confidenceLevel ?? 'ESTABLISHED'],
    ]);
    if (content.jurisdiction.officialSource) {
      cursor.spacer(4);
      cursor.text(`Fonte Oficial: ${content.jurisdiction.officialSource}`, 8.5, italicFont, rgb(0.3, 0.3, 0.3));
    }
    cursor.spacer(12);

    // Section 2: Attendance and Instructional Time Compliance
    cursor.sectionTitle('2. Carga Horária & Frequência Letiva Cumprida');
    const daysReq = content.attendanceCompliance.requiredDays
      ? String(content.attendanceCompliance.requiredDays)
      : 'N/A';
    const hoursReq = content.attendanceCompliance.requiredHours
      ? `${content.attendanceCompliance.requiredHours}h`
      : 'N/A';
    const complianceStatus = content.attendanceCompliance.isCompliant
      ? 'CONFORME (Requisitos Mínimos Atendidos)'
      : 'EM ANDAMENTO / REGISTRO PARCIAL';

    cursor.keyValueRow([
      ['Dias Letivos Registrados', `${content.attendanceCompliance.loggedDays} dias (Exigido: ${daysReq})`],
      ['Horas Totais de Instrução', `${content.attendanceCompliance.loggedHours}h (Exigido: ${hoursReq})`],
    ]);
    cursor.spacer(4);
    cursor.text(`Situação da Frequência: ${complianceStatus}`, 9, boldFont, content.attendanceCompliance.isCompliant ? rgb(0.1, 0.45, 0.2) : rgb(0.65, 0.35, 0.1));
    cursor.spacer(12);

    // Section 3: Curriculum Progress
    cursor.sectionTitle('3. Progresso Curricular por Disciplinas');
    if (content.curriculumProgress && content.curriculumProgress.length > 0) {
      cursor.curriculumTable(content.curriculumProgress);
    } else {
      cursor.text('Nenhuma disciplina avaliada no período letivo.', 9, italicFont, rgb(0.4, 0.4, 0.4));
      cursor.spacer(8);
    }
    cursor.spacer(12);

    // Section 4: Legal Disclaimer
    cursor.sectionTitle('4. Declaração de Limitação & Ressalvas Jurídicas');
    cursor.disclaimerBox(content.legalDisclaimer, italicFont);
    cursor.spacer(12);

    // Section 5: General Notes if present
    if (content.generalNotes) {
      cursor.sectionTitle('5. Observações da Família Educadora');
      cursor.wrappedBlock(content.generalNotes, italicFont);
      cursor.spacer(12);
    }

    // Signatures
    cursor.signatureLines();

    // Footer stamping
    const pages = cursor.finish();
    const pageCount = pages.length;
    const generatedLine = generatedByLabel
      ? `Gerado por ${sanitizeText(generatedByLabel)} em ${content.generatedDate}`
      : `Gerado em ${content.generatedDate}`;

    pages.forEach((page, index) => {
      drawFooter(page, font, {
        pageNumber: index + 1,
        pageCount,
        generatedLine,
        documentHash,
      });
    });

    const bytes = await pdfDoc.save({ useObjectStreams: false });
    return { bytes, documentHash };
  }

  private assertRequiredFields(content: AnnualComplianceReportDto): void {
    const missing: string[] = [];
    if (!content.learnerName?.trim()) missing.push('learnerName');
    if (!content.familyOrganizationName?.trim()) missing.push('familyOrganizationName');
    if (!content.generatedDate?.trim()) missing.push('generatedDate');
    if (!content.jurisdiction) missing.push('jurisdiction');
    if (missing.length > 0) {
      throw new BadRequestException(
        `Cannot render PDF: annual compliance report is missing required field(s): ${missing.join(', ')}.`,
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

function sanitizeCompliance(content: AnnualComplianceReportDto): AnnualComplianceReportDto {
  return {
    ...content,
    learnerName: sanitizeText(content.learnerName),
    familyOrganizationName: sanitizeText(content.familyOrganizationName),
    gradeLevel: content.gradeLevel ? sanitizeText(content.gradeLevel) : content.gradeLevel,
    academicYearTitle: content.academicYearTitle
      ? sanitizeText(content.academicYearTitle)
      : content.academicYearTitle,
    legalDisclaimer: sanitizeText(content.legalDisclaimer),
    generalNotes: content.generalNotes ? sanitizeText(content.generalNotes) : content.generalNotes,
    jurisdiction: {
      ...content.jurisdiction,
      name: sanitizeText(content.jurisdiction.name),
      officialSource: content.jurisdiction.officialSource
        ? sanitizeText(content.jurisdiction.officialSource)
        : content.jurisdiction.officialSource,
    },
    curriculumProgress: (content.curriculumProgress || []).map((p) => ({
      ...p,
      subjectName: sanitizeText(p.subjectName),
      calculatedGrade: sanitizeText(p.calculatedGrade),
      averageMasteryLevel: p.averageMasteryLevel
        ? sanitizeText(p.averageMasteryLevel)
        : p.averageMasteryLevel,
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
    this.page.drawText(text, {
      x: MARGIN,
      y: this.y,
      size,
      font: this.boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    this.y -= size + 4;
  }

  text(text: string, size: number, font: PDFFont, color = rgb(0.15, 0.15, 0.15)): void {
    this.ensureSpace(size + 3);
    this.page.drawText(text, { x: MARGIN, y: this.y, size, font, color });
    this.y -= size + 3;
  }

  spacer(height: number): void {
    this.y -= height;
  }

  sectionTitle(title: string): void {
    this.ensureSpace(24);
    this.page.drawText(title, {
      x: MARGIN,
      y: this.y,
      size: 11,
      font: this.boldFont,
      color: rgb(0.15, 0.25, 0.15),
    });
    this.y -= 4;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.75,
      color: rgb(0.75, 0.75, 0.75),
    });
    this.y -= 10;
  }

  keyValueRow(pairs: Array<[string, string]>): void {
    this.ensureSpace(14);
    const colWidth = CONTENT_WIDTH / pairs.length;
    pairs.forEach(([key, val], i) => {
      const x = MARGIN + i * colWidth;
      this.page.drawText(`${key}:`, {
        x,
        y: this.y,
        size: 8.5,
        font: this.boldFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      const keyWidth = this.boldFont.widthOfTextAtSize(`${key}: `, 8.5);
      this.page.drawText(val, {
        x: x + keyWidth,
        y: this.y,
        size: 8.5,
        font: this.font,
        color: rgb(0.1, 0.1, 0.1),
      });
    });
    this.y -= 14;
  }

  curriculumTable(items: any[]): void {
    this.ensureSpace(30);
    const columns = [
      { header: 'Disciplina', width: 0.45 },
      { header: 'Avaliações', width: 0.18 },
      { header: 'Domínio', width: 0.18 },
      { header: 'Situação', width: 0.19 },
    ];

    // Header
    let hX = MARGIN;
    columns.forEach((col) => {
      this.page.drawText(col.header, {
        x: hX,
        y: this.y,
        size: 8.5,
        font: this.boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      hX += CONTENT_WIDTH * col.width;
    });
    this.y -= 12;

    for (const item of items) {
      this.ensureSpace(14);
      let rX = MARGIN;
      const values = [
        item.subjectName,
        String(item.evaluatedCount),
        item.averageMasteryLevel ?? '—',
        item.calculatedGrade,
      ];
      values.forEach((v, i) => {
        this.page.drawText(v, {
          x: rX,
          y: this.y,
          size: 8,
          font: this.font,
          color: rgb(0.15, 0.15, 0.15),
        });
        rX += CONTENT_WIDTH * columns[i]!.width;
      });
      this.y -= 12;
    }
  }

  disclaimerBox(text: string, italicFont: PDFFont): void {
    const lines = wrapText(text, italicFont, 8, CONTENT_WIDTH - 16);
    const boxHeight = lines.length * 10 + 12;
    this.ensureSpace(boxHeight + 8);

    const boxY = this.y - boxHeight;
    this.page.drawRectangle({
      x: MARGIN,
      y: boxY,
      width: CONTENT_WIDTH,
      height: boxHeight,
      color: rgb(0.97, 0.97, 0.95),
      borderColor: rgb(0.85, 0.85, 0.8),
      borderWidth: 0.5,
    });

    let textY = this.y - 12;
    for (const line of lines) {
      this.page.drawText(line, {
        x: MARGIN + 8,
        y: textY,
        size: 8,
        font: italicFont,
        color: rgb(0.35, 0.35, 0.35),
      });
      textY -= 10;
    }
    this.y = boxY - 6;
  }

  wrappedBlock(text: string, italicFont: PDFFont): void {
    const lines = wrapText(text, italicFont, 9, CONTENT_WIDTH);
    for (const line of lines) {
      this.ensureSpace(12);
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size: 9,
        font: italicFont,
        color: rgb(0.25, 0.25, 0.25),
      });
      this.y -= 12;
    }
  }

  signatureLines(): void {
    this.ensureSpace(60);
    const colWidth = CONTENT_WIDTH / 2;
    const lineY = this.y - 30;
    this.page.drawLine({
      start: { x: MARGIN, y: lineY },
      end: { x: MARGIN + colWidth - 20, y: lineY },
      thickness: 0.75,
      color: rgb(0.3, 0.3, 0.3),
    });
    this.page.drawLine({
      start: { x: MARGIN + colWidth, y: lineY },
      end: { x: MARGIN + colWidth * 2 - 20, y: lineY },
      thickness: 0.75,
      color: rgb(0.3, 0.3, 0.3),
    });
    this.page.drawText('Responsável Legal / Educador Titular', {
      x: MARGIN,
      y: lineY - 12,
      size: 8.5,
      font: this.boldFont,
    });
    this.page.drawText('Coordenador Pedagógico / Responsável', {
      x: MARGIN + colWidth,
      y: lineY - 12,
      size: 8.5,
      font: this.boldFont,
    });
    this.y = lineY - 24;
  }

  finish(): PDFPage[] {
    return this.pages;
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
  page.drawText(info.generatedLine, {
    x: MARGIN,
    y: MARGIN - 2,
    size: 7.5,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });
  page.drawText(`Hash: ${info.documentHash.slice(0, 16)}…`, {
    x: MARGIN,
    y: MARGIN - 12,
    size: 7.5,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });
  const pageStr = `Página ${info.pageNumber} de ${info.pageCount}`;
  const pageWidth = font.widthOfTextAtSize(pageStr, 7.5);
  page.drawText(pageStr, {
    x: PAGE_WIDTH - MARGIN - pageWidth,
    y: MARGIN - 2,
    size: 7.5,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });
}
