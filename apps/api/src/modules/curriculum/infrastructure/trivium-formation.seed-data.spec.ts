import {
  buildTriviumFormationSeedData,
  buildTriviumFormationDomainDto,
  buildTriviumFormationPathDto,
  buildTriviumFormationCompetencyDto,
} from './trivium-formation.seed-data.js';

const DOMAIN_ID = '00000000-0000-4000-8000-000000000001';
const PATH_ID = '00000000-0000-4000-8000-000000000002';

describe('Trivium formation seed data', () => {
  it('defines three distinct paths with universal advisory stages and actionable competencies', () => {
    const data = buildTriviumFormationSeedData();

    expect(data.domain.code).toBe('CLASSICAL_EDUCATION');
    expect(data.paths.map((path) => path.code)).toEqual([
      'TRIVIUM.GRAMMAR',
      'TRIVIUM.LOGIC',
      'TRIVIUM.RHETORIC',
    ]);
    expect(data.paths.every((path) => path.competencies.length >= 3)).toBe(true);
    expect(data.paths.flatMap((path) => path.competencies).every((competency) => competency.starterObjectives.length > 0)).toBe(true);
    expect(data.paths.flatMap((path) => path.competencies).map((competency) => competency.code).length)
      .toBe(new Set(data.paths.flatMap((path) => path.competencies).map((competency) => competency.code)).size);

    const stages = data.paths.flatMap((path) => path.educationalStages);
    expect(stages.every((stage) => ['EARLY_YEARS', 'PRIMARY', 'LOWER_SECONDARY', 'UPPER_SECONDARY'].includes(stage))).toBe(true);
    expect(data.paths.every((path) => path.ageRecommendation.min > 0 && path.ageRecommendation.max >= path.ageRecommendation.min)).toBe(true);
  });

  it('builds schema-valid definitions linked to their domain and paths', () => {
    const data = buildTriviumFormationSeedData();
    const domain = buildTriviumFormationDomainDto(data.domain);
    const firstPath = data.paths[0]!;
    const firstCompetency = firstPath.competencies[0]!;
    const path = buildTriviumFormationPathDto(firstPath, DOMAIN_ID);
    const competency = buildTriviumFormationCompetencyDto(firstCompetency, DOMAIN_ID, PATH_ID);

    expect(domain.code).toBe('CLASSICAL_EDUCATION');
    expect(path.domainId).toBe(DOMAIN_ID);
    expect(competency.domainId).toBe(DOMAIN_ID);
    expect(competency.pathId).toBe(PATH_ID);
    expect(competency.metadata).toMatchObject({
      starterObjectives: [firstCompetency.starterObjectives[0]],
    });
  });
});
