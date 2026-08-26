import { describe, expect, it } from 'vitest';
import {
  createPortfolioItemSchema,
  updatePortfolioItemSchema,
  portfolioItemFilterSchema,
  portfolioItemResponseSchema,
} from './portfolio.js';

const LEARNER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const SUBJECT_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const YEAR_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const RECORD_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
const FAMILY_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
const PORTFOLIO_ID = '90eebc99-9c0b-4ef8-bb6d-6bb9bd380a99';

describe('Portfolio Contracts', () => {
  it('validates a valid portfolio item with default tags and highlight false', () => {
    const valid = {
      learnerId: LEARNER_ID,
      title: 'Desenho de Paisagem em Aquarela',
      type: 'IMAGE' as const,
      fileUrl: 'https://storage.example.com/art/landscape.jpg',
    };

    const parsed = createPortfolioItemSchema.parse(valid);
    expect(parsed.title).toBe('Desenho de Paisagem em Aquarela');
    expect(parsed.type).toBe('IMAGE');
    expect(parsed.isHighlight).toBe(false);
    expect(parsed.tags).toEqual([]);
  });

  it('validates a portfolio item with text content and tags', () => {
    const textItem = {
      learnerId: LEARNER_ID,
      learningRecordId: RECORD_ID,
      subjectId: SUBJECT_ID,
      academicYearId: YEAR_ID,
      title: 'Redação: Minha Primeira Aventura na Floresta',
      description: 'Texto narrativo elaborado após aula de campo',
      type: 'TEXT' as const,
      textContent: 'Era uma manhã ensolarada quando ouvimos o primeiro canto do sabiá...',
      capturedAt: '2026-03-17',
      isHighlight: true,
      tags: ['redação', 'português', 'natureza', 'narração'],
    };

    const parsed = createPortfolioItemSchema.parse(textItem);
    expect(parsed.type).toBe('TEXT');
    expect(parsed.isHighlight).toBe(true);
    expect(parsed.tags).toHaveLength(4);
    expect(parsed.capturedAt).toBe('2026-03-17');
  });

  it('rejects invalid capturedAt date format', () => {
    const invalid = {
      learnerId: LEARNER_ID,
      title: 'Foto',
      type: 'IMAGE' as const,
      capturedAt: '17/03/2026',
    };

    expect(() => createPortfolioItemSchema.parse(invalid)).toThrow(
      'capturedAt must be in YYYY-MM-DD format',
    );
  });

  it('validates partial update schema', () => {
    const update = {
      isHighlight: true,
      tags: ['destaque', 'ciências'],
    };

    const parsed = updatePortfolioItemSchema.parse(update);
    expect(parsed.isHighlight).toBe(true);
    expect(parsed.tags).toEqual(['destaque', 'ciências']);
  });

  it('validates portfolio filter schema', () => {
    const filter = {
      learnerId: LEARNER_ID,
      type: 'CERTIFICATE' as const,
      isHighlight: true,
      tag: 'olimpiada',
    };

    const parsed = portfolioItemFilterSchema.parse(filter);
    expect(parsed.learnerId).toBe(LEARNER_ID);
    expect(parsed.type).toBe('CERTIFICATE');
    expect(parsed.isHighlight).toBe(true);
    expect(parsed.tag).toBe('olimpiada');
  });

  it('validates portfolio item response schema', () => {
    const response = {
      id: PORTFOLIO_ID,
      familyId: FAMILY_ID,
      learnerId: LEARNER_ID,
      learnerName: 'Ester Sá',
      learningRecordId: RECORD_ID,
      academicYearId: YEAR_ID,
      subjectId: SUBJECT_ID,
      subjectName: 'Artes',
      title: 'Desenho de Paisagem em Aquarela',
      description: 'Pintura ao ar livre',
      type: 'IMAGE' as const,
      fileUrl: 'https://storage.example.com/art/landscape.jpg',
      textContent: null,
      mimeType: 'image/jpeg',
      fileSizeBytes: 2048500,
      capturedAt: '2026-03-17',
      isHighlight: true,
      tags: ['arte', 'aquarela'],
      createdAt: '2026-03-17T10:00:00.000Z',
      updatedAt: '2026-03-17T10:00:00.000Z',
    };

    const parsed = portfolioItemResponseSchema.parse(response);
    expect(parsed.id).toBe(PORTFOLIO_ID);
    expect(parsed.isHighlight).toBe(true);
    expect(parsed.tags).toEqual(['arte', 'aquarela']);
  });
});
