import { DefinitionsService } from '../application/definitions.service.js';
import { MathSubjectSeeder } from './math-subject.seeder.js';
import { buildMathSubjectSeedData } from './math-subject.seed-data.js';

const DOMAIN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const PRIMARY_GRAMMAR_PATH_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const MIDDLE_LOGIC_PATH_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

function pathIdFor(code: string): string {
  return code.endsWith('PRIMARY_GRAMMAR') ? PRIMARY_GRAMMAR_PATH_ID : MIDDLE_LOGIC_PATH_ID;
}

describe('MathSubjectSeeder', () => {
  const seedData = buildMathSubjectSeedData();
  const totalCompetencies = seedData.paths.reduce((sum, p) => sum + p.competencies.length, 0);

  it('creates the domain, every grade-band path and every competency on a first run', async () => {
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

    const seeder = new MathSubjectSeeder(definitionsService);
    const result = await seeder.seed();

    expect(result.domainCreated).toBe(true);
    expect(result.pathsCreated).toBe(seedData.paths.length);
    expect(result.competenciesCreated).toBe(totalCompetencies);

    expect(definitionsService.createLearningDomain).toHaveBeenCalledTimes(1);
    expect(definitionsService.transitionLearningDomainStatus).toHaveBeenCalledWith(DOMAIN_ID, 'PUBLISHED');
    expect(definitionsService.createLearningPath).toHaveBeenCalledTimes(seedData.paths.length);
    for (const pathData of seedData.paths) {
      expect(definitionsService.createLearningPath).toHaveBeenCalledWith(
        expect.objectContaining({ domainId: DOMAIN_ID, code: pathData.path.code }),
      );
    }
    expect(definitionsService.createCompetencyDefinition).toHaveBeenCalledTimes(totalCompetencies);
    for (const pathData of seedData.paths) {
      for (const competency of pathData.competencies) {
        expect(definitionsService.createCompetencyDefinition).toHaveBeenCalledWith(
          expect.objectContaining({ code: competency.code, domainId: DOMAIN_ID, pathId: pathIdFor(pathData.path.code) }),
        );
      }
    }
    expect(definitionsService.transitionCompetencyDefinitionStatus).toHaveBeenCalledTimes(totalCompetencies);
  });

  it.each(['PUBLISHED', 'DEPRECATED', 'ARCHIVED', 'DRAFT'])(
    'does not recreate or re-transition an existing domain/path/competency in %s status',
    async (status) => {
      const existingDomain = { id: 'domain-1', code: seedData.domain.code, version: 1, status };
      const existingPaths = seedData.paths.map((p, i) => ({ id: `path-${i}`, code: p.path.code, version: 1, status }));
      const existingCompetencies = seedData.paths.flatMap((p) =>
        p.competencies.map((c, i) => ({ id: `competency-${p.path.code}-${i}`, code: c.code, version: 1, status })),
      );

      const definitionsService = {
        listLearningDomains: jest.fn().mockResolvedValue([existingDomain]),
        listLearningPaths: jest.fn().mockResolvedValue(existingPaths),
        listCompetencyDefinitions: jest.fn().mockResolvedValue(existingCompetencies),
        createLearningDomain: jest.fn(),
        transitionLearningDomainStatus: jest.fn(),
        createLearningPath: jest.fn(),
        transitionLearningPathStatus: jest.fn(),
        createCompetencyDefinition: jest.fn(),
        transitionCompetencyDefinitionStatus: jest.fn(),
      } as unknown as DefinitionsService;

      const seeder = new MathSubjectSeeder(definitionsService);
      const result = await seeder.seed();

      expect(result.domainCreated).toBe(false);
      expect(result.pathsCreated).toBe(0);
      expect(result.competenciesCreated).toBe(0);

      expect(definitionsService.createLearningDomain).not.toHaveBeenCalled();
      expect(definitionsService.transitionLearningDomainStatus).not.toHaveBeenCalled();
      expect(definitionsService.createLearningPath).not.toHaveBeenCalled();
      expect(definitionsService.transitionLearningPathStatus).not.toHaveBeenCalled();
      expect(definitionsService.createCompetencyDefinition).not.toHaveBeenCalled();
      expect(definitionsService.transitionCompetencyDefinitionStatus).not.toHaveBeenCalled();
    },
  );

  it('creates only the missing path and its competencies when the domain and one grade-band path already exist', async () => {
    const existingDomain = { id: DOMAIN_ID, code: seedData.domain.code, version: 1, status: 'PUBLISHED' };
    const firstPathData = seedData.paths[0]!;
    const existingPath = { id: PRIMARY_GRAMMAR_PATH_ID, code: firstPathData.path.code, version: 1, status: 'PUBLISHED' };
    const existingCompetencies = firstPathData.competencies.map((c, i) => ({
      id: `existing-${i}`,
      code: c.code,
      version: 1,
      status: 'PUBLISHED',
    }));

    const definitionsService = {
      listLearningDomains: jest.fn().mockResolvedValue([existingDomain]),
      listLearningPaths: jest.fn().mockResolvedValue([existingPath]),
      listCompetencyDefinitions: jest.fn().mockResolvedValue(existingCompetencies),
      createLearningDomain: jest.fn(),
      transitionLearningDomainStatus: jest.fn(),
      createLearningPath: jest.fn().mockImplementation(async (dto) => ({ id: pathIdFor(dto.code), code: dto.code, version: 1, status: 'DRAFT' })),
      transitionLearningPathStatus: jest.fn().mockResolvedValue({}),
      createCompetencyDefinition: jest.fn().mockImplementation(async (dto) => ({ id: `new-${dto.code}`, code: dto.code, version: 1, status: 'DRAFT' })),
      transitionCompetencyDefinitionStatus: jest.fn().mockResolvedValue({}),
    } as unknown as DefinitionsService;

    const seeder = new MathSubjectSeeder(definitionsService);
    const result = await seeder.seed();

    expect(result.domainCreated).toBe(false);
    expect(result.pathsCreated).toBe(seedData.paths.length - 1);
    const secondPathData = seedData.paths[1]!;
    expect(result.competenciesCreated).toBe(secondPathData.competencies.length);
    expect(definitionsService.createLearningPath).toHaveBeenCalledTimes(seedData.paths.length - 1);
    expect(definitionsService.createLearningPath).not.toHaveBeenCalledWith(
      expect.objectContaining({ code: firstPathData.path.code }),
    );
    expect(definitionsService.createCompetencyDefinition).toHaveBeenCalledTimes(secondPathData.competencies.length);
  });
});
