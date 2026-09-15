import { ArtsFormationSeeder } from './arts-formation.seeder.js';
import { buildArtsFormationSeedData } from './arts-formation.seed-data.js';

const DOMAIN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24';
const PATH_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25';

describe('ArtsFormationSeeder', () => {
  const seedData = buildArtsFormationSeedData();

  it('creates the ARTS domain, foundations path, and every competency on a first run', async () => {
    const definitionsService = {
      listLearningDomains: jest.fn().mockResolvedValue([]),
      listLearningPaths: jest.fn().mockResolvedValue([]),
      listCompetencyDefinitions: jest.fn().mockResolvedValue([]),
      createLearningDomain: jest.fn().mockResolvedValue({ id: DOMAIN_ID, code: 'ARTS', version: 1, status: 'DRAFT' }),
      transitionLearningDomainStatus: jest.fn().mockResolvedValue({}),
      createLearningPath: jest.fn().mockResolvedValue({ id: PATH_ID, code: 'ARTS.FOUNDATIONS', version: 1, status: 'DRAFT' }),
      transitionLearningPathStatus: jest.fn().mockResolvedValue({}),
      createCompetencyDefinition: jest.fn().mockImplementation(async (dto) => ({ id: `new-${dto.code}`, code: dto.code, version: 1, status: 'DRAFT' })),
      transitionCompetencyDefinitionStatus: jest.fn().mockResolvedValue({}),
    } as any;

    const result = await new ArtsFormationSeeder(definitionsService).seed();

    expect(result).toEqual({ domainCreated: true, pathCreated: true, competenciesCreated: seedData.competencies.length });
    expect(definitionsService.createLearningDomain).toHaveBeenCalledTimes(1);
    expect(definitionsService.transitionLearningDomainStatus).toHaveBeenCalledWith(DOMAIN_ID, 'PUBLISHED');
    expect(definitionsService.createLearningPath).toHaveBeenCalledWith(expect.objectContaining({ domainId: DOMAIN_ID, code: 'ARTS.FOUNDATIONS' }));
    expect(definitionsService.createCompetencyDefinition).toHaveBeenCalledTimes(seedData.competencies.length);
    expect(definitionsService.transitionCompetencyDefinitionStatus).toHaveBeenCalledTimes(seedData.competencies.length);
  });

  it('is idempotent when the complete published hierarchy already exists', async () => {
    const definitionsService = {
      listLearningDomains: jest.fn().mockResolvedValue([{ id: DOMAIN_ID, code: 'ARTS', version: 1, status: 'PUBLISHED' }]),
      listLearningPaths: jest.fn().mockResolvedValue([{ id: PATH_ID, code: 'ARTS.FOUNDATIONS', version: 1, status: 'PUBLISHED' }]),
      listCompetencyDefinitions: jest.fn().mockResolvedValue(seedData.competencies.map((c, i) => ({ id: `c-${i}`, code: c.code, version: 1, status: 'PUBLISHED' }))),
      createLearningDomain: jest.fn(),
      transitionLearningDomainStatus: jest.fn(),
      createLearningPath: jest.fn(),
      transitionLearningPathStatus: jest.fn(),
      createCompetencyDefinition: jest.fn(),
      transitionCompetencyDefinitionStatus: jest.fn(),
    } as any;

    const result = await new ArtsFormationSeeder(definitionsService).seed();

    expect(result).toEqual({ domainCreated: false, pathCreated: false, competenciesCreated: 0 });
    expect(definitionsService.createLearningDomain).not.toHaveBeenCalled();
    expect(definitionsService.createLearningPath).not.toHaveBeenCalled();
    expect(definitionsService.createCompetencyDefinition).not.toHaveBeenCalled();
  });
});
