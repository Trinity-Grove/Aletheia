import { buildBiblicalFormationSeedData } from './biblical-formation.seed-data.js';

describe('biblical formation follow-up competencies', () => {
  const competencies = buildBiblicalFormationSeedData().competencies;

  it('publishes the three introductory topics deferred from issue #95 section 5', () => {
    const letters = competencies.find((item) => item.code === 'FAITH.BIBLICAL_FORMATION.LETTERS_INTRODUCTION');
    const memorization = competencies.find((item) => item.code === 'FAITH.BIBLICAL_FORMATION.TEXT_MEMORIZATION');
    const devotionals = competencies.find((item) => item.code === 'FAITH.BIBLICAL_FORMATION.DEVOTIONALS');

    expect(letters).toMatchObject({ title: 'Introdução às Cartas', level: 1, ageRecommendation: { min: 9, max: 11 } });
    expect(memorization).toMatchObject({ title: 'Memorização de Textos Bíblicos', level: 1, ageRecommendation: { min: 6, max: 11 } });
    expect(devotionals).toMatchObject({ title: 'Devocionais', level: 1, ageRecommendation: { min: 6, max: 11 } });

    expect(letters?.evidenceTypes).toContain('text');
    expect(memorization?.evidenceTypes).toContain('audio');
    expect(devotionals?.evidenceTypes).toContain('observation');

    expect(letters?.starterObjectives.join(' ').toLowerCase()).toContain('destinat');
    expect(memorization?.starterObjectives.join(' ').toLowerCase()).toContain('contexto');
    expect(devotionals?.starterObjectives.join(' ').toLowerCase()).toContain('reflex');
  });
});
