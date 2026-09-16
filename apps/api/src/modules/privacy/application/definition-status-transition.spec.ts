import { BadRequestException } from '@nestjs/common';
import { computeStatusTransition } from './definition-status-transition.js';

describe('computeStatusTransition (privacy consent definitions)', () => {
  const NOW = new Date('2026-09-16T12:00:00Z');

  it('allows DRAFT -> PUBLISHED and stamps publishedAt', () => {
    const result = computeStatusTransition('DRAFT', 'PUBLISHED', NOW);
    expect(result).toEqual({ status: 'PUBLISHED', publishedAt: NOW });
  });

  it('allows DRAFT -> ARCHIVED without timestamp', () => {
    const result = computeStatusTransition('DRAFT', 'ARCHIVED', NOW);
    expect(result).toEqual({ status: 'ARCHIVED' });
  });

  it('allows PUBLISHED -> DEPRECATED and stamps deprecatedAt', () => {
    const result = computeStatusTransition('PUBLISHED', 'DEPRECATED', NOW);
    expect(result).toEqual({ status: 'DEPRECATED', deprecatedAt: NOW });
  });

  it('allows PUBLISHED -> ARCHIVED directly', () => {
    const result = computeStatusTransition('PUBLISHED', 'ARCHIVED', NOW);
    expect(result).toEqual({ status: 'ARCHIVED' });
  });

  it('allows DEPRECATED -> ARCHIVED', () => {
    const result = computeStatusTransition('DEPRECATED', 'ARCHIVED', NOW);
    expect(result).toEqual({ status: 'ARCHIVED' });
  });

  it('rejects ARCHIVED -> anything (terminal status)', () => {
    expect(() => computeStatusTransition('ARCHIVED', 'PUBLISHED', NOW)).toThrow(BadRequestException);
    expect(() => computeStatusTransition('ARCHIVED', 'DRAFT', NOW)).toThrow(BadRequestException);
  });

  it('rejects going backwards (PUBLISHED -> DRAFT)', () => {
    expect(() => computeStatusTransition('PUBLISHED', 'DRAFT', NOW)).toThrow(BadRequestException);
  });

  it('rejects a same-status no-op transition', () => {
    expect(() => computeStatusTransition('DRAFT', 'DRAFT', NOW)).toThrow(BadRequestException);
  });
});
