import { DefinitionsService } from '../application/definitions.service.js';
import { LanguageSubjectSeeder } from './language-subject.seeder.js';
import { buildLanguageSubjectCatalogSeedData } from './language-subject.seed-data.js';

const seedData = buildLanguageSubjectCatalogSeedData();

describe('LanguageSubjectSeeder', () => {
  const totalPaths = seedData.reduce((sum, language) => sum + language.paths.length, 0);
  const totalCompetencies = seedData.reduce(
    (sum, language) => sum + language.paths.reduce((pathSum, path) => pathSum + path.competencies.length, 0),
    0,
  );

  it('creates one domain per language with universal native stages and an additional-language track', async () => {
    let domainIndex = 0;
    let pathIndex = 0;
    const definitionsService = {
      listLearningDomains: jest.fn().mockResolvedValue([]),
      listLearningPaths: jest.fn().mockResolvedValue([]),
      listCompetencyDefinitions: jest.fn().mockResolvedValue([]),
      createLearningDomain: jest.fn().mockImplementation(async (dto) => ({ id: `00000000-0000-4000-8000-00000000000${++domainIndex}`, ...dto, version: 1 })),
      transitionLearningDomainStatus: jest.fn().mockResolvedValue({}),
      createLearningPath: jest.fn().mockImplementation(async (dto) => ({ id: `00000000-0000-4000-8000-0000000001${String(++pathIndex).padStart(2, '0')}`, ...dto, version: 1 })),
      transitionLearningPathStatus: jest.fn().mockResolvedValue({}),
      createCompetencyDefinition: jest.fn().mockImplementation(async (dto) => ({ id: `competency-${dto.code}`, ...dto, version: 1 })),
      transitionCompetencyDefinitionStatus: jest.fn().mockResolvedValue({}),
    } as unknown as DefinitionsService;

    const result = await new LanguageSubjectSeeder(definitionsService).seed();

    expect(result).toEqual({ domainsCreated: seedData.length, pathsCreated: totalPaths, competenciesCreated: totalCompetencies });
    expect(definitionsService.createLearningDomain).toHaveBeenCalledTimes(seedData.length);
    expect(definitionsService.createLearningPath).toHaveBeenCalledTimes(totalPaths);
    expect(definitionsService.createCompetencyDefinition).toHaveBeenCalledTimes(totalCompetencies);
    expect(definitionsService.transitionLearningDomainStatus).toHaveBeenCalledTimes(seedData.length);
    expect(definitionsService.transitionLearningPathStatus).toHaveBeenCalledTimes(totalPaths);
    expect(definitionsService.transitionCompetencyDefinitionStatus).toHaveBeenCalledTimes(totalCompetencies);
  });

  it('is idempotent when all language content already exists in any status', async () => {
    const domains = seedData.map((language) => ({ id: `domain-${language.domain.code}`, code: language.domain.code, version: 1, status: 'PUBLISHED' }));
    const paths = seedData.flatMap((language) =>
      language.paths.map((path) => ({ id: `path-${path.path.code}`, code: path.path.code, version: 1, status: 'DEPRECATED' })),
    );
    const competencies = seedData.flatMap((language) =>
      language.paths.flatMap((path) => path.competencies.map((competency) => ({ id: `competency-${competency.code}`, code: competency.code, version: 1, status: 'ARCHIVED' }))),
    );
    const definitionsService = {
      listLearningDomains: jest.fn().mockResolvedValue(domains),
      listLearningPaths: jest.fn().mockResolvedValue(paths),
      listCompetencyDefinitions: jest.fn().mockResolvedValue(competencies),
      createLearningDomain: jest.fn(),
      transitionLearningDomainStatus: jest.fn(),
      createLearningPath: jest.fn(),
      transitionLearningPathStatus: jest.fn(),
      createCompetencyDefinition: jest.fn(),
      transitionCompetencyDefinitionStatus: jest.fn(),
    } as unknown as DefinitionsService;

    await expect(new LanguageSubjectSeeder(definitionsService).seed()).resolves.toEqual({
      domainsCreated: 0,
      pathsCreated: 0,
      competenciesCreated: 0,
    });
    expect(definitionsService.createLearningDomain).not.toHaveBeenCalled();
    expect(definitionsService.createLearningPath).not.toHaveBeenCalled();
    expect(definitionsService.createCompetencyDefinition).not.toHaveBeenCalled();
  });

  it('keeps the two profiles explicit and carries CEFR progression for additional-language tracks', () => {
    for (const language of seedData) {
      const nativePaths = language.paths.filter((path) => path.path.code.includes('.NATIVE_LITERACY.'));
      const profilePaths = [...nativePaths, ...language.paths.filter((path) => path.path.code.endsWith('ADDITIONAL_LANGUAGE'))];
      expect(nativePaths.map((path) => path.path.code)).toEqual([
        `${language.domain.code}.NATIVE_LITERACY.EARLY_YEARS`,
        `${language.domain.code}.NATIVE_LITERACY.PRIMARY`,
        `${language.domain.code}.NATIVE_LITERACY.LOWER_SECONDARY`,
        `${language.domain.code}.NATIVE_LITERACY.UPPER_SECONDARY`,
      ]);
      expect(profilePaths).toHaveLength(5);
      const additional = profilePaths.find((path) => path.path.code.endsWith('ADDITIONAL_LANGUAGE'))!;
      expect(additional.competencies.map((competency) => competency.proficiencyLevel)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1']);
      expect(additional.competencies.every((competency) => competency.proficiencyFramework === 'CEFR')).toBe(true);
      expect(nativePaths.every((path) => path.competencies.every((competency) => competency.educationalStage !== undefined && competency.proficiencyLevel === undefined))).toBe(true);
    }
  });
});
