import { DefinitionsService } from '../application/definitions.service.js';
import { BiblicalFormationIntermediateSeeder } from './biblical-formation-intermediate.seeder.js';
import { buildBiblicalFormationIntermediateSeedData } from './biblical-formation-intermediate.seed-data.js';

const DOMAIN_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380b33';
const PATH_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380b44';

describe('BiblicalFormationIntermediateSeeder', () => {
  const seedData = buildBiblicalFormationIntermediateSeedData();

  it('creates the path and every competency when the FAITH.BIBLICAL_FORMATION domain already exists (the normal case)', async () => {
    const existingDomain = { id: DOMAIN_ID, code: seedData.domain.code, version: 1, status: 'PUBLISHED' };

    const definitionsService = {
      listLearningDomains: jest.fn().mockResolvedValue([existingDomain]),
      listLearningPaths: jest.fn().mockResolvedValue([]),
      listCompetencyDefinitions: jest.fn().mockResolvedValue([]),
      createLearningDomain: jest.fn(),
      transitionLearningDomainStatus: jest.fn(),
      createLearningPath: jest.fn().mockResolvedValue({ id: PATH_ID, code: seedData.path.code, version: 1, status: 'DRAFT' }),
      transitionLearningPathStatus: jest.fn().mockResolvedValue({}),
      createCompetencyDefinition: jest.fn().mockImplementation(async (dto) => ({ id: `new-${dto.code}`, code: dto.code, version: 1, status: 'DRAFT' })),
      transitionCompetencyDefinitionStatus: jest.fn().mockResolvedValue({}),
    } as unknown as DefinitionsService;

    const seeder = new BiblicalFormationIntermediateSeeder(definitionsService);
    const result = await seeder.seed();

    expect(result.domainCreated).toBe(false);
    expect(definitionsService.createLearningDomain).not.toHaveBeenCalled();
    expect(result.pathCreated).toBe(true);
    expect(definitionsService.createLearningPath).toHaveBeenCalledTimes(1);
    expect(definitionsService.createLearningPath).toHaveBeenCalledWith(
      expect.objectContaining({ domainId: DOMAIN_ID, code: seedData.path.code }),
    );
    expect(definitionsService.transitionLearningPathStatus).toHaveBeenCalledWith(PATH_ID, 'PUBLISHED');
    expect(result.competenciesCreated).toBe(seedData.competencies.length);
    expect(definitionsService.createCompetencyDefinition).toHaveBeenCalledTimes(seedData.competencies.length);
    for (const competency of seedData.competencies) {
      expect(definitionsService.createCompetencyDefinition).toHaveBeenCalledWith(
        expect.objectContaining({ code: competency.code, domainId: DOMAIN_ID, pathId: PATH_ID }),
      );
    }
  });

  it('creates the FAITH.BIBLICAL_FORMATION domain defensively if it does not exist yet (standalone run on a fresh database)', async () => {
    const definitionsService = {
      listLearningDomains: jest.fn().mockResolvedValue([]),
      listLearningPaths: jest.fn().mockResolvedValue([]),
      listCompetencyDefinitions: jest.fn().mockResolvedValue([]),
      createLearningDomain: jest.fn().mockResolvedValue({ id: DOMAIN_ID, code: seedData.domain.code, version: 1, status: 'DRAFT' }),
      transitionLearningDomainStatus: jest.fn().mockResolvedValue({}),
      createLearningPath: jest.fn().mockResolvedValue({ id: PATH_ID, code: seedData.path.code, version: 1, status: 'DRAFT' }),
      transitionLearningPathStatus: jest.fn().mockResolvedValue({}),
      createCompetencyDefinition: jest.fn().mockImplementation(async (dto) => ({ id: `new-${dto.code}`, code: dto.code, version: 1, status: 'DRAFT' })),
      transitionCompetencyDefinitionStatus: jest.fn().mockResolvedValue({}),
    } as unknown as DefinitionsService;

    const seeder = new BiblicalFormationIntermediateSeeder(definitionsService);
    const result = await seeder.seed();

    expect(result.domainCreated).toBe(true);
    expect(definitionsService.createLearningDomain).toHaveBeenCalledTimes(1);
    expect(definitionsService.transitionLearningDomainStatus).toHaveBeenCalledWith(DOMAIN_ID, 'PUBLISHED');
  });

  it.each(['PUBLISHED', 'DEPRECATED', 'ARCHIVED', 'DRAFT'])(
    'does not recreate or re-transition an existing domain/path/competency in %s status',
    async (status) => {
      const existingDomain = { id: DOMAIN_ID, code: seedData.domain.code, version: 1, status };
      const existingPath = { id: PATH_ID, code: seedData.path.code, version: 1, status };
      const existingCompetencies = seedData.competencies.map((c, i) => ({
        id: `competency-${i}`,
        code: c.code,
        version: 1,
        status,
      }));

      const definitionsService = {
        listLearningDomains: jest.fn().mockResolvedValue([existingDomain]),
        listLearningPaths: jest.fn().mockResolvedValue([existingPath]),
        listCompetencyDefinitions: jest.fn().mockResolvedValue(existingCompetencies),
        createLearningDomain: jest.fn(),
        transitionLearningDomainStatus: jest.fn(),
        createLearningPath: jest.fn(),
        transitionLearningPathStatus: jest.fn(),
        createCompetencyDefinition: jest.fn(),
        transitionCompetencyDefinitionStatus: jest.fn(),
      } as unknown as DefinitionsService;

      const seeder = new BiblicalFormationIntermediateSeeder(definitionsService);
      const result = await seeder.seed();

      expect(result.domainCreated).toBe(false);
      expect(result.pathCreated).toBe(false);
      expect(result.competenciesCreated).toBe(0);
      expect(definitionsService.createLearningPath).not.toHaveBeenCalled();
      expect(definitionsService.createCompetencyDefinition).not.toHaveBeenCalled();
    },
  );

  it('creates only the missing competencies when the domain/path already exist but a competency is new', async () => {
    const existingDomain = { id: DOMAIN_ID, code: seedData.domain.code, version: 1, status: 'PUBLISHED' };
    const existingPath = { id: PATH_ID, code: seedData.path.code, version: 1, status: 'PUBLISHED' };
    const existingCompetencies = [
      { id: 'competency-0', code: seedData.competencies[0]!.code, version: 1, status: 'PUBLISHED' },
    ];

    const definitionsService = {
      listLearningDomains: jest.fn().mockResolvedValue([existingDomain]),
      listLearningPaths: jest.fn().mockResolvedValue([existingPath]),
      listCompetencyDefinitions: jest.fn().mockResolvedValue(existingCompetencies),
      createLearningDomain: jest.fn(),
      transitionLearningDomainStatus: jest.fn(),
      createLearningPath: jest.fn(),
      transitionLearningPathStatus: jest.fn(),
      createCompetencyDefinition: jest.fn().mockImplementation(async (dto) => ({ id: `new-${dto.code}`, code: dto.code, version: 1, status: 'DRAFT' })),
      transitionCompetencyDefinitionStatus: jest.fn().mockResolvedValue({}),
    } as unknown as DefinitionsService;

    const seeder = new BiblicalFormationIntermediateSeeder(definitionsService);
    const result = await seeder.seed();

    expect(result.domainCreated).toBe(false);
    expect(result.pathCreated).toBe(false);
    expect(result.competenciesCreated).toBe(seedData.competencies.length - 1);
    expect(definitionsService.createCompetencyDefinition).toHaveBeenCalledTimes(seedData.competencies.length - 1);
    expect(definitionsService.createCompetencyDefinition).not.toHaveBeenCalledWith(
      expect.objectContaining({ code: seedData.competencies[0]!.code }),
    );
  });
});
