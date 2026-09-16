import { BadRequestException } from '@nestjs/common';
import { computeStatusTransition } from './definition-status-transition.js';

// Same test suite as curriculum's definition-status-transition.spec.ts --
// this module duplicates that pure state machine (see the comment in
// definition-status-transition.ts), so it needs the same coverage.
describe('computeStatusTransition (jurisdictions)', () => {
  const NOW = new Date('2026-09-15T12:00:00Z');

  it('allows DRAFT -> PUBLISHED and stamps publishedAt', () => {
    const result = computeStatusTransition('DRAFT', 'PUBLISHED', NOW);
    expect(result).toEqual({ status: 'PUBLISHED', publishedAt: NOW });
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

  it('rejects ARCHIVED -> anything (terminal)', () => {
    expect(() => computeStatusTransition('ARCHIVED', 'PUBLISHED', NOW)).toThrow(BadRequestException);
  });

  it('rejects going backwards (PUBLISHED -> DRAFT)', () => {
    expect(() => computeStatusTransition('PUBLISHED', 'DRAFT', NOW)).toThrow(BadRequestException);
  });

  it('rejects a same-status no-op transition', () => {
    expect(() => computeStatusTransition('DRAFT', 'DRAFT', NOW)).toThrow(BadRequestException);
  });
});
