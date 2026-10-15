import { describe, expect, it } from 'vitest';
import {
  createActivityDefinitionSchema,
  activityDefinitionResponseSchema,
  addActivityDefinitionCompetencySchema,
  addActivityDefinitionEvidenceTypeSchema,
  searchActivityDefinitionsQuerySchema,
} from './activity-definition.js';

const COMPETENCY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const EVIDENCE_TYPE_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

describe('Activity Definition Contracts', () => {
  it('exposes materials as a typed response field', () => {
    const parsed = activityDefinitionResponseSchema.parse({
      id: '9c5d2e6a-4b7c-4a2a-9d43-5e4c1f3b8a11',
      code: 'OUTDOOR.FIRE',
      version: 1,
      status: 'PUBLISHED',
      schemaVersion: '1.0.0',
      name: 'Fogueira',
      supervisionRequired: true,
      riskLevel: 'HIGH',
      evidenceRequirementMode: 'ANY',
      materials: ['lenha', 'balde de água'],
      metadata: { materials: ['lenha', 'balde de água'] },
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(parsed.materials).toEqual(['lenha', 'balde de água']);
  });

  it('defaults materials for legacy responses', () => {
    const parsed = activityDefinitionResponseSchema.parse({
      id: '9c5d2e6a-4b7c-4a2a-9d43-5e4c1f3b8a11',
      code: 'TEST.ACTIVITY',
      version: 1,
      status: 'PUBLISHED',
      schemaVersion: '1.0.0',
      name: 'Atividade legada',
      supervisionRequired: false,
      evidenceRequirementMode: 'ANY',
      metadata: {},
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(parsed.materials).toEqual([]);
  });

  it('rejects an inverted age range', () => {
    expect(() => createActivityDefinitionSchema.parse({
      code: 'TEST.AGE', name: 'Age range', ageMin: 17, ageMax: 10,
    })).toThrow();
  });

  it.each([
    { ageMin: 10, ageMax: 10 },
    { ageMin: 10 },
    { ageMax: 10 },
    { ageMin: null, ageMax: null },
  ])('accepts a valid or open age range %j', (range) => {
    expect(createActivityDefinitionSchema.safeParse({
      code: 'TEST.AGE', name: 'Age range', ...range,
    }).success).toBe(true);
  });

  it('validates a minimal activity with defaults', () => {
    const parsed = createActivityDefinitionSchema.parse({
      code: 'MUSIC.BASS.PRACTICE_SESSION',
      name: 'Sessão de prática de contrabaixo',
    });
    expect(parsed.status).toBe('DRAFT');
    expect(parsed.supervisionRequired).toBe(false);
    expect(parsed.evidenceRequirementMode).toBe('ANY');
  });

  it('validates an activity with full fields', () => {
    const parsed = createActivityDefinitionSchema.parse({
      code: 'OUTDOOR.FIRE_SAFETY.CAMPFIRE_BUILD',
      name: 'Construir uma fogueira com segurança',
      ageMin: 10,
      ageMax: 17,
      estimatedDurationMinutes: 45,
      supervisionRequired: true,
      riskLevel: 'medium',
      evidenceRequirementMode: 'ALL',
      metadata: { materials: ['fósforos', 'lenha', 'balde de água'] },
    });
    expect(parsed.supervisionRequired).toBe(true);
    expect(parsed.evidenceRequirementMode).toBe('ALL');
    expect(parsed.metadata.materials).toEqual(['fósforos', 'lenha', 'balde de água']);
  });

  it('accepts a structured safety policy without changing legacy safety fields', () => {
    const parsed = createActivityDefinitionSchema.parse({
      code: 'OUTDOOR.FIRE_SAFETY.CAMPFIRE_BUILD',
      name: 'Construir uma fogueira com segurança',
      supervisionRequired: true,
      riskLevel: 'medium',
      metadata: {
        materials: ['fósforos', 'lenha'],
        safetyPolicy: {
          riskLevel: 'HIGH',
          supervision: 'ADULT_ONLY',
          minimumAge: 12,
          requiresAdultConsent: true,
          requiredTrainingCodes: ['SAFETY.FIRE.INTRO'],
          instructions: 'Mantenha água disponível e apague o fogo completamente ao terminar.',
        },
      },
    });

    expect(parsed.supervisionRequired).toBe(true);
    expect(parsed.riskLevel).toBe('medium');
    expect(parsed.metadata.safetyPolicy).toEqual({
      riskLevel: 'HIGH',
      supervision: 'ADULT_ONLY',
      minimumAge: 12,
      requiresAdultConsent: true,
      requiredTrainingCodes: ['SAFETY.FIRE.INTRO'],
      instructions: 'Mantenha água disponível e apague o fogo completamente ao terminar.',
    });
  });

  it.each([
    ['rejects high risk without required supervision', { riskLevel: 'HIGH', supervision: 'NONE' }],
    ['rejects adult-only supervision without adult consent', { riskLevel: 'MODERATE', supervision: 'ADULT_ONLY' }],
    ['rejects unknown safety policy fields', { riskLevel: 'LOW', supervision: 'NONE', unsupportedFlag: true }],
  ])('%s', (_name, safetyPolicy) => {
    expect(() => createActivityDefinitionSchema.parse({
      code: 'OUTDOOR.FIRE_SAFETY.CAMPFIRE_BUILD',
      name: 'Construir uma fogueira com segurança',
      metadata: { safetyPolicy },
    })).toThrow();
  });

  it('rejects an invalid evidenceRequirementMode', () => {
    expect(() =>
      createActivityDefinitionSchema.parse({
        code: 'MUSIC.BASS.PRACTICE_SESSION',
        name: 'x',
        evidenceRequirementMode: 'SOME',
      }),
    ).toThrow();
  });

  it('rejects a lowercase activity code', () => {
    expect(() =>
      createActivityDefinitionSchema.parse({ code: 'music.bass.practice', name: 'x' }),
    ).toThrow();
  });

  it('validates a competency link with defaults', () => {
    const parsed = addActivityDefinitionCompetencySchema.parse({ competencyId: COMPETENCY_ID });
    expect(parsed.required).toBe(true);
    expect(parsed.order).toBe(0);
  });

  it('validates an evidence type link', () => {
    const parsed = addActivityDefinitionEvidenceTypeSchema.parse({ evidenceTypeId: EVIDENCE_TYPE_ID });
    expect(parsed.evidenceTypeId).toBe(EVIDENCE_TYPE_ID);
  });

  describe('search query', () => {
    it('accepts optional text, status and age filters', () => {
      expect(searchActivityDefinitionsQuerySchema.parse({
        q: '  FOGO  ',
        status: 'PUBLISHED',
        age: '12',
      })).toEqual({ q: 'FOGO', status: 'PUBLISHED', age: 12 });
    });

    it('accepts an empty query for the backwards-compatible full list', () => {
      expect(searchActivityDefinitionsQuerySchema.parse({})).toEqual({});
    });

    it.each([
      { q: '   ' },
      { status: 'UNKNOWN' },
      { age: '-1' },
      { age: '121' },
      { age: 'not-a-number' },
    ])('rejects invalid filters %j', (query) => {
      expect(searchActivityDefinitionsQuerySchema.safeParse(query).success).toBe(false);
    });
  });
});
