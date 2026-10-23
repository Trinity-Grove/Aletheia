import { TriviumFormationSeeder } from './trivium-formation.seeder.js';

const DOMAIN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24';
const PATH_IDS: Record<string, string> = {
  'TRIVIUM.GRAMMAR': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25',
  'TRIVIUM.LOGIC': 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26',
  'TRIVIUM.RHETORIC': 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27',
};

function createDefinitionsService(overrides: Record<string, unknown> = {}) {
  return {
    listLearningDomains: jest.fn().mockResolvedValue([]),
    listLearningPaths: jest.fn().mockResolvedValue([]),
    listCompetencyDefinitions: jest.fn().mockResolvedValue([]),
    createLearningDomain: jest.fn().mockResolvedValue({ id: DOMAIN_ID, code: 'CLASSICAL_EDUCATION', version: 1, status: 'DRAFT' }),
    transitionLearningDomainStatus: jest.fn().mockResolvedValue({ status: 'PUBLISHED' }),
    createLearningPath: jest.fn().mockImplementation(async (dto: { id?: string; code: string }) => ({
      id: PATH_IDS[dto.code], code: dto.code, version: 1, status: 'DRAFT',
    })),
    transitionLearningPathStatus: jest.fn().mockResolvedValue({ status: 'PUBLISHED' }),
    createCompetencyDefinition: jest.fn().mockImplementation(async (dto: { id?: string; code: string }) => ({
      id: `competency-${dto.code}`, code: dto.code, version: 1, status: 'DRAFT',
    })),
    transitionCompetencyDefinitionStatus: jest.fn().mockResolvedValue({ status: 'PUBLISHED' }),
    ...overrides,
  } as any;
}

describe('TriviumFormationSeeder', () => {
  it('creates and publishes the domain, three paths, and nine competencies on first run', async () => {
    const definitionsService = createDefinitionsService();

    const result = await new TriviumFormationSeeder(definitionsService).seed();

    expect(result).toEqual({ domainCreated: true, pathsCreated: 3, competenciesCreated: 9 });
    expect(definitionsService.createLearningDomain).toHaveBeenCalledWith(expect.objectContaining({ code: 'CLASSICAL_EDUCATION' }));
    expect(definitionsService.createLearningPath).toHaveBeenCalledTimes(3);
    expect(definitionsService.transitionLearningPathStatus).toHaveBeenCalledTimes(3);
    expect(definitionsService.createCompetencyDefinition).toHaveBeenCalledTimes(9);
    expect(definitionsService.transitionCompetencyDefinitionStatus).toHaveBeenCalledTimes(9);
  });

  it('does not recreate or republish an already published catalog on rerun', async () => {
    const definitionsService = createDefinitionsService({
      listLearningDomains: jest.fn().mockResolvedValue([{ id: DOMAIN_ID, code: 'CLASSICAL_EDUCATION', version: 1, status: 'PUBLISHED' }]),
      listLearningPaths: jest.fn().mockResolvedValue([
        { id: PATH_IDS['TRIVIUM.GRAMMAR'], code: 'TRIVIUM.GRAMMAR', version: 1, status: 'PUBLISHED' },
        { id: PATH_IDS['TRIVIUM.LOGIC'], code: 'TRIVIUM.LOGIC', version: 1, status: 'PUBLISHED' },
        { id: PATH_IDS['TRIVIUM.RHETORIC'], code: 'TRIVIUM.RHETORIC', version: 1, status: 'PUBLISHED' },
      ]),
      listCompetencyDefinitions: jest.fn().mockResolvedValue([
        'TRIVIUM.GRAMMAR.LANGUAGE_PATTERNS', 'TRIVIUM.GRAMMAR.CLOSE_READING', 'TRIVIUM.GRAMMAR.VOCABULARY_MEMORY',
        'TRIVIUM.LOGIC.QUESTIONING', 'TRIVIUM.LOGIC.CLAIMS_AND_REASONS', 'TRIVIUM.LOGIC.REASONING',
        'TRIVIUM.RHETORIC.AUDIENCE_AND_PURPOSE', 'TRIVIUM.RHETORIC.COMPOSITION', 'TRIVIUM.RHETORIC.REVISION_AND_DELIVERY',
      ].map((code) => ({ id: `id-${code}`, code, version: 1, status: 'PUBLISHED' }))),
    });

    const result = await new TriviumFormationSeeder(definitionsService).seed();

    expect(result).toEqual({ domainCreated: false, pathsCreated: 0, competenciesCreated: 0 });
    expect(definitionsService.createLearningDomain).not.toHaveBeenCalled();
    expect(definitionsService.createLearningPath).not.toHaveBeenCalled();
    expect(definitionsService.createCompetencyDefinition).not.toHaveBeenCalled();
  });

  it('fills missing paths and competencies without duplicating existing definitions', async () => {
    const definitionsService = createDefinitionsService({
      listLearningDomains: jest.fn().mockResolvedValue([{ id: DOMAIN_ID, code: 'CLASSICAL_EDUCATION', version: 1, status: 'PUBLISHED' }]),
      listLearningPaths: jest.fn().mockResolvedValue([{ id: PATH_IDS['TRIVIUM.GRAMMAR'], code: 'TRIVIUM.GRAMMAR', version: 1, status: 'PUBLISHED' }]),
      listCompetencyDefinitions: jest.fn().mockResolvedValue([
        'TRIVIUM.GRAMMAR.LANGUAGE_PATTERNS', 'TRIVIUM.GRAMMAR.CLOSE_READING', 'TRIVIUM.GRAMMAR.VOCABULARY_MEMORY',
      ].map((code) => ({ id: `id-${code}`, code, version: 1, status: 'PUBLISHED' }))),
    });

    const result = await new TriviumFormationSeeder(definitionsService).seed();

    expect(result).toEqual({ domainCreated: false, pathsCreated: 2, competenciesCreated: 6 });
    expect(definitionsService.createLearningPath).toHaveBeenCalledTimes(2);
    expect(definitionsService.createCompetencyDefinition).toHaveBeenCalledTimes(6);
  });

  it('publishes existing draft definitions without recreating them', async () => {
    const definitionsService = createDefinitionsService({
      listLearningDomains: jest.fn().mockResolvedValue([{ id: DOMAIN_ID, code: 'CLASSICAL_EDUCATION', version: 1, status: 'DRAFT' }]),
      listLearningPaths: jest.fn().mockResolvedValue([{ id: PATH_IDS['TRIVIUM.GRAMMAR'], code: 'TRIVIUM.GRAMMAR', version: 1, status: 'DRAFT' }]),
      listCompetencyDefinitions: jest.fn().mockResolvedValue([
        { id: 'draft-competency', code: 'TRIVIUM.GRAMMAR.LANGUAGE_PATTERNS', version: 1, status: 'DRAFT' },
      ]),
    });

    await new TriviumFormationSeeder(definitionsService).seed();

    expect(definitionsService.createLearningDomain).not.toHaveBeenCalled();
    expect(definitionsService.transitionLearningDomainStatus).toHaveBeenCalledWith(DOMAIN_ID, 'PUBLISHED');
    expect(definitionsService.createLearningPath).not.toHaveBeenCalledWith(expect.objectContaining({ code: 'TRIVIUM.GRAMMAR' }));
    expect(definitionsService.transitionLearningPathStatus).toHaveBeenCalledWith(PATH_IDS['TRIVIUM.GRAMMAR'], 'PUBLISHED');
    expect(definitionsService.transitionCompetencyDefinitionStatus).toHaveBeenCalledWith('draft-competency', 'PUBLISHED');
  });
});
