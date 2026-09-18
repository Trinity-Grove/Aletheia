import { createHash } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import type { LearningPortfolioDossierDto, OfficialReportResponseDto } from '@aletheia/contracts';

export interface RenderedPortfolioPdf {
  bytes: Uint8Array;
  documentHash: string;
}

const DISCLAIMER =
  'Documento gerado a partir dos registros e evidências informados pela família na plataforma Aletheia. ' +
  'Reflete o acervo pedagógico cadastrado até a data de geração e não constitui comprovação ou validação ' +
  'oficial perante órgãos governamentais ou educacionais ("não serve como salvo-conduto jurídico"). ' +
  'Consulte a legislação da sua jurisdição.';

const PAGE_WIDTH = 595.28; // A4 at 72 dpi
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_HEIGHT = 70;
const CONTENT_BOTTOM = MARGIN + FOOTER_HEIGHT;

@Injectable()
export class LearningPortfolioPdfRenderer {
  async render(
    report: OfficialReportResponseDto,
    generatedByLabel: string | null,
  ): Promise<RenderedPortfolioPdf> {
    const rawContent = report.content as LearningPortfolioDossierDto;
    this.assertRequiredFields(rawContent);

    const content = sanitizePortfolio(rawContent);
    const documentHash = this.computeContentHash(report);
    const generatedAt = new Date(report.generatedAt);

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setCreationDate(generatedAt);
    pdfDoc.setModificationDate(generatedAt);
    pdfDoc.setProducer('Aletheia');
    pdfDoc.setTitle(report.title);
    pdfDoc.setAuthor(content.familyOrganizationName);
    pdfDoc.setSubject('Dossiê do Portfólio de Aprendizagem');

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const cursor = new Layout(pdfDoc, font, boldFont);

    // Header
    cursor.heading(content.familyOrganizationName, 16);
    cursor.text(
      'Dossiê de Portfólio de Aprendizagem & Acervo de Evidências',
      9,
      italicFont,
      rgb(0.35, 0.35, 0.35),
    );
    cursor.spacer(6);
    cursor.heading(report.title, 13);
    cursor.spacer(10);

    // Learner metadata
    cursor.keyValueRow([
      ['Educando', content.learnerName],
      ['Ciclo / Série', content.gradeLevel ?? 'Não informado'],
    ]);
    cursor.keyValueRow([
      ['Ano Letivo', content.academicYearTitle ?? 'Não vinculado'],
      ['Data de Emissão', content.generatedDate],
    ]);
    cursor.spacer(12);

    // Section 1: Portfolio Items / Evidences
    cursor.sectionTitle('1. Acervo de Evidências & Obras em Destaque');
    if (content.portfolioItems && content.portfolioItems.length > 0) {
      for (const item of content.portfolioItems) {
        cursor.portfolioItemCard(item, italicFont);
      }
    } else {
      cursor.text(
        'Nenhuma evidência ou trabalho catalogado no período.',
        9,
        italicFont,
        rgb(0.45, 0.45, 0.45),
      );
      cursor.spacer(8);
    }
    cursor.spacer(12);

    // Section 2: Learning Highlights
    if (content.learningHighlights && content.learningHighlights.length > 0) {
      cursor.sectionTitle('2. Destaques do Diário de Aprendizagem');
      for (const hl of content.learningHighlights) {
        cursor.highlightRow(hl, italicFont);
      }
      cursor.spacer(12);
    }

    // Section 3: General Notes
    if (content.generalNotes) {
      cursor.sectionTitle('3. Parecer Descritivo do Educador / Observações Gerais');
      cursor.wrappedBlock(content.generalNotes, italicFont);
      cursor.spacer(12);
    }

    // Signature lines
    cursor.signatureLines();

    // Footer stamping on all pages
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

  private assertRequiredFields(content: LearningPortfolioDossierDto): void {
    const missing: string[] = [];
    if (!content.learnerName?.trim()) missing.push('learnerName');
    if (!content.familyOrganizationName?.trim()) missing.push('familyOrganizationName');
    if (!content.generatedDate?.trim()) missing.push('generatedDate');
    if (missing.length > 0) {
      throw new BadRequestException(
        `Cannot render PDF: portfolio dossier is missing required field(s): ${missing.join(', ')}.`,
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

function sanitizePortfolio(content: LearningPortfolioDossierDto): LearningPortfolioDossierDto {
  return {
    ...content,
    learnerName: sanitizeText(content.learnerName),
    familyOrganizationName: sanitizeText(content.familyOrganizationName),
    gradeLevel: content.gradeLevel ? sanitizeText(content.gradeLevel) : content.gradeLevel,
    academicYearTitle: content.academicYearTitle
      ? sanitizeText(content.academicYearTitle)
      : content.academicYearTitle,
    generalNotes: content.generalNotes ? sanitizeText(content.generalNotes) : content.generalNotes,
    portfolioItems: (content.portfolioItems || []).map((item) => ({
      ...item,
      title: sanitizeText(item.title),
      description: sanitizeText(item.description),
      evidenceTypeName: item.evidenceTypeName ? sanitizeText(item.evidenceTypeName) : undefined,
      competencyNames: item.competencyNames.map(sanitizeText),
      fileUrl: item.fileUrl ? sanitizeText(item.fileUrl) : item.fileUrl,
    })),
    learningHighlights: (content.learningHighlights || []).map((hl) => ({
      ...hl,
      subjectName: sanitizeText(hl.subjectName),
      notes: sanitizeText(hl.notes),
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

  portfolioItemCard(item: any, italicFont: PDFFont): void {
    this.ensureSpace(40);
    const headerLine = `- ${item.title} (${item.date})${item.evidenceTypeName ? ' [' + item.evidenceTypeName + ']' : ''}`;
    this.page.drawText(headerLine, {
      x: MARGIN + 4,
      y: this.y,
      size: 9.5,
      font: this.boldFont,
      color: rgb(0.12, 0.2, 0.15),
    });
    this.y -= 12;

    if (item.competencyNames && item.competencyNames.length > 0) {
      const compText = `Competências: ${item.competencyNames.join(', ')}`;
      const compLines = wrapText(compText, italicFont, 8, CONTENT_WIDTH - 15);
      for (const cl of compLines) {
        this.ensureSpace(10);
        this.page.drawText(cl, {
          x: MARGIN + 12,
          y: this.y,
          size: 8,
          font: italicFont,
          color: rgb(0.35, 0.45, 0.35),
        });
        this.y -= 10;
      }
    }

    if (item.description) {
      const descLines = wrapText(item.description, this.font, 8.5, CONTENT_WIDTH - 15);
      for (const dl of descLines) {
        this.ensureSpace(11);
        this.page.drawText(dl, {
          x: MARGIN + 12,
          y: this.y,
          size: 8.5,
          font: this.font,
          color: rgb(0.2, 0.2, 0.2),
        });
        this.y -= 11;
      }
    }
    this.y -= 6;
  }

  highlightRow(hl: any, italicFont: PDFFont): void {
    this.ensureSpace(24);
    this.page.drawText(`- ${hl.subjectName} (${hl.date})`, {
      x: MARGIN + 4,
      y: this.y,
      size: 9,
      font: this.boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.y -= 11;

    const noteLines = wrapText(hl.notes, italicFont, 8.5, CONTENT_WIDTH - 15);
    for (const nl of noteLines) {
      this.ensureSpace(11);
      this.page.drawText(nl, {
        x: MARGIN + 12,
        y: this.y,
        size: 8.5,
        font: italicFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      this.y -= 11;
    }
    this.y -= 4;
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
