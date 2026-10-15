import { describe, expect, it } from 'vitest';
import {
  createActivityDefinitionSchema,
  addActivityDefinitionCompetencySchema,
  addActivityDefinitionEvidenceTypeSchema,
} from './activity-definition.js';

const COMPETENCY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const EVIDENCE_TYPE_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

describe('Activity Definition Contracts', () => {
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
});
