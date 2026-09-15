import { DefinitionsService } from '../application/definitions.service.js';
import { PortugueseSubjectSeeder } from './portuguese-subject.seeder.js';
import { buildPortugueseSubjectSeedData } from './portuguese-subject.seed-data.js';

const DOMAIN_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const EARLY_YEARS_PATH_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const PRIMARY_GRAMMAR_PATH_ID = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

function pathIdFor(code: string): string {
  return code.endsWith('EARLY_YEARS') ? EARLY_YEARS_PATH_ID : PRIMARY_GRAMMAR_PATH_ID;
}

describe('PortugueseSubjectSeeder', () => {
  const seedData = buildPortugueseSubjectSeedData();
  const totalCompetencies = seedData.paths.reduce((sum, path) => sum + path.competencies.length, 0);

  it('creates the domain, both grade-band paths and every competency on a first run', async () => {
    const definitionsService = {
      listLearningDomains: jest.fn().mockResolvedValue([]),
      listLearningPaths: jest.fn().mockResolvedValue([]),
      listCompetencyDefinitions: jest.fn().mockResolvedValue([]),
      createLearningDomain: jest.fn().mockResolvedValue({ id: DOMAIN_ID, code: seedData.domain.code, version: 1, status: 'DRAFT' }),
      transitionLearningDomainStatus: jest.fn().mockResolvedValue({}),
      createLearningPath: jest.fn().mockImplementation(async (dto) => ({ id: pathIdFor(dto.code), code: dto.code, version: 1, status: 'DRAFT' })),
      transitionLearningPathStatus: jest.fn().mockResolvedValue({}),
      createCompetencyDefinition: jest.fn().mockImplementation(async (dto) => ({ id: `new-${dto.code}`, code: dto.code, version: 1, status: 'DRAFT' })),
      transitionCompetencyDefinitionStatus: jest.fn().mockResolvedValue({}),
    } as unknown as DefinitionsService;

    const result = await new PortugueseSubjectSeeder(definitionsService).seed();

    expect(result).toEqual({ domainCreated: true, pathsCreated: seedData.paths.length, competenciesCreated: totalCompetencies });
    expect(definitionsService.createLearningDomain).toHaveBeenCalledTimes(1);
    expect(definitionsService.createLearningPath).toHaveBeenCalledTimes(seedData.paths.length);
    expect(definitionsService.createCompetencyDefinition).toHaveBeenCalledTimes(totalCompetencies);
    for (const pathData of seedData.paths) {
      expect(definitionsService.createLearningPath).toHaveBeenCalledWith(
        expect.objectContaining({ domainId: DOMAIN_ID, code: pathData.path.code }),
      );
      for (const competency of pathData.competencies) {
        expect(definitionsService.createCompetencyDefinition).toHaveBeenCalledWith(
          expect.objectContaining({ code: competency.code, domainId: DOMAIN_ID, pathId: pathIdFor(pathData.path.code) }),
        );
      }
    }
  });

  it.each(['PUBLISHED', 'DEPRECATED', 'ARCHIVED', 'DRAFT'])(
    'does not recreate or re-transition existing content in %s status',
    async (status) => {
      const definitionsService = {
        listLearningDomains: jest.fn().mockResolvedValue([{ id: DOMAIN_ID, code: seedData.domain.code, version: 1, status }]),
        listLearningPaths: jest.fn().mockResolvedValue(seedData.paths.map((path, index) => ({ id: `path-${index}`, code: path.path.code, version: 1, status }))),
        listCompetencyDefinitions: jest.fn().mockResolvedValue(
          seedData.paths.flatMap((path) => path.competencies.map((competency) => ({ id: `competency-${competency.code}`, code: competency.code, version: 1, status }))),
        ),
        createLearningDomain: jest.fn(),
        transitionLearningDomainStatus: jest.fn(),
        createLearningPath: jest.fn(),
        transitionLearningPathStatus: jest.fn(),
        createCompetencyDefinition: jest.fn(),
        transitionCompetencyDefinitionStatus: jest.fn(),
      } as unknown as DefinitionsService;

      const result = await new PortugueseSubjectSeeder(definitionsService).seed();

      expect(result).toEqual({ domainCreated: false, pathsCreated: 0, competenciesCreated: 0 });
      expect(definitionsService.createLearningDomain).not.toHaveBeenCalled();
      expect(definitionsService.createLearningPath).not.toHaveBeenCalled();
      expect(definitionsService.createCompetencyDefinition).not.toHaveBeenCalled();
      expect(definitionsService.transitionLearningDomainStatus).not.toHaveBeenCalled();
      expect(definitionsService.transitionLearningPathStatus).not.toHaveBeenCalled();
      expect(definitionsService.transitionCompetencyDefinitionStatus).not.toHaveBeenCalled();
    },
  );

  it('keeps the early-years band age-appropriate and makes primary grammar genuinely more advanced', () => {
    const earlyYears = seedData.paths.find((path) => path.path.code === 'PORTUGUESE.EARLY_YEARS');
    const primaryGrammar = seedData.paths.find((path) => path.path.code === 'PORTUGUESE.PRIMARY_GRAMMAR');
    expect(earlyYears).toBeDefined();
    expect(primaryGrammar).toBeDefined();

    for (const competency of earlyYears!.competencies) {
      expect(competency.ageRecommendation.max).toBeLessThanOrEqual(6);
    }
    for (const competency of primaryGrammar!.competencies) {
      expect(competency.ageRecommendation.min).toBeGreaterThanOrEqual(6);
    }

    const earlyText = earlyYears!.competencies.flatMap((competency) => [competency.title, ...competency.starterObjectives]).join(' ').toLowerCase();
    expect(earlyText).not.toContain('concordância');
    expect(earlyText).not.toContain('oração subordinada');
    const primaryText = primaryGrammar!.competencies.flatMap((competency) => [competency.title, ...competency.starterObjectives]).join(' ').toLowerCase();
    expect(primaryText).toContain('compreensão');
    expect(primaryText).toContain('ortografia');
  });
});
