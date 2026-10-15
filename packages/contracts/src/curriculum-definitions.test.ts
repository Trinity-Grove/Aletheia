import { describe, expect, it } from 'vitest';
import {
  createLearningDomainSchema,
  createCompetencyDefinitionSchema,
  definitionStatusSchema,
  updateLearningDomainActivationSchema,
} from './curriculum-definitions.js';

const DOMAIN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

describe('Curriculum Definition Contracts', () => {
  it('accepts every generic definition status', () => {
    for (const status of ['DRAFT', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED']) {
      expect(definitionStatusSchema.parse(status)).toBe(status);
    }
  });

  it('rejects an unknown definition status', () => {
    expect(() => definitionStatusSchema.parse('LIVE')).toThrow();
  });

  it('validates a minimal learning domain with defaults', () => {
    const parsed = createLearningDomainSchema.parse({
      code: 'MUSIC',
      name: 'Música',
    });
    expect(parsed.version).toBe(1);
    expect(parsed.status).toBe('DRAFT');
    expect(parsed.schemaVersion).toBe('1.0.0');
    expect(parsed.metadata).toEqual({});
  });

  it('rejects a lowercase domain code', () => {
    expect(() =>
      createLearningDomainSchema.parse({ code: 'music', name: 'Música' }),
    ).toThrow();
  });

  it('requires an explicit activation state', () => {
    expect(updateLearningDomainActivationSchema.parse({ isActive: false })).toEqual({ isActive: false });
    expect(() => updateLearningDomainActivationSchema.parse({})).toThrow();
  });

  it('validates a learning domain with a parent', () => {
    const parsed = createLearningDomainSchema.parse({
      code: 'MUSIC.BASS',
      name: 'Contrabaixo',
      parentId: DOMAIN_ID,
      description: 'Trilha de contrabaixo dentro do domínio de música.',
    });
    expect(parsed.parentId).toBe(DOMAIN_ID);
  });

  it('validates the CompetencyDefinition example JSON from issue #96', () => {
    const parsed = createCompetencyDefinitionSchema.parse({
      code: 'MUSIC.BASS.LEVEL_01.RHYTHM',
      domainId: DOMAIN_ID,
      title: 'Manter pulsação básica no contrabaixo',
      description: 'Mantém uma pulsação estável em um exercício musical simples.',
      level: 1,
      metadata: {
        ageRecommendation: { min: 8 },
        prerequisites: [],
        evidenceTypes: ['video', 'mentor_assessment'],
        assessmentPolicy: { type: 'rubric', minimumScore: 3 },
      },
    });
    expect(parsed.title).toBe('Manter pulsação básica no contrabaixo');
    expect(parsed.description).toBe('Mantém uma pulsação estável em um exercício musical simples.');
    expect(parsed.metadata.assessmentPolicy?.minimumScore).toBe(3);
    expect(parsed.metadata.evidenceTypes).toEqual(['video', 'mentor_assessment']);
  });

  it('rejects an invalid competency assessment policy type', () => {
    expect(() =>
      createCompetencyDefinitionSchema.parse({
        code: 'MUSIC.BASS.LEVEL_01.RHYTHM',
        domainId: DOMAIN_ID,
        title: 'Manter pulsação básica no contrabaixo',
        metadata: { assessmentPolicy: { type: 'peer_vibes' } },
      }),
    ).toThrow();
  });

  it('rejects a competency code that is not upper snake/dot case', () => {
    expect(() =>
      createCompetencyDefinitionSchema.parse({
        code: 'music.bass.level_01.rhythm',
        domainId: DOMAIN_ID,
        title: 'Manter pulsação básica no contrabaixo',
      }),
    ).toThrow();
  });
});
