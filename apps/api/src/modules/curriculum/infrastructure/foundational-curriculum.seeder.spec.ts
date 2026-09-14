import { DefinitionsService } from '../application/definitions.service.js';
import { FoundationalCurriculumSeeder } from './foundational-curriculum.seeder.js';

const DOMAIN_CODES = [
  'FAITH.BIBLICAL_FORMATION',
  'MUSIC',
  'TRADES',
  'COOKING',
  'GARDENING',
  'RESILIENCE',
];

const domainId = (index: number) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
const competencyId = (index: number) => `00000000-0000-4000-8000-${String(index + 101).padStart(12, '0')}`;

function formationSeeder() {
  return { seed: jest.fn().mockResolvedValue({}) };
}

describe('FoundationalCurriculumSeeder', () => {
  it('creates and publishes a curriculum with all foundational domains, competencies and policy', async () => {
    const curriculum = { id: '00000000-0000-4000-8000-000000000010', code: 'FOUNDATIONAL.FAMILY_FORMATION', version: 1, status: 'DRAFT' };
    const policy = { id: '00000000-0000-4000-8000-000000000011', code: 'FOUNDATIONAL.FAMILY_FORMATION.EVIDENCE_COUNT', version: 1, status: 'DRAFT', policyType: 'EVIDENCE_COUNT', curriculumDefinitionId: curriculum.id };
    const definitionsService = {
      listCurriculumDefinitions: jest.fn().mockResolvedValue([]),
      createCurriculumDefinition: jest.fn().mockResolvedValue(curriculum),
      transitionCurriculumDefinitionStatus: jest.fn().mockResolvedValue({ ...curriculum, status: 'PUBLISHED' }),
      listCurriculumDefinitionDomains: jest.fn().mockResolvedValue([]),
      addCurriculumDefinitionDomain: jest.fn().mockResolvedValue({}),
      listCurriculumDefinitionCompetencies: jest.fn().mockResolvedValue([]),
      addCurriculumDefinitionCompetency: jest.fn().mockResolvedValue({}),
      listProgressionPolicies: jest.fn().mockResolvedValue([]),
      createProgressionPolicy: jest.fn().mockResolvedValue(policy),
      transitionProgressionPolicyStatus: jest.fn().mockResolvedValue({ ...policy, status: 'PUBLISHED' }),
      listLearningDomains: jest.fn().mockResolvedValue(DOMAIN_CODES.map((code, index) => ({ id: domainId(index), code, version: 1, status: 'PUBLISHED' }))),
      listCompetencyDefinitions: jest.fn().mockResolvedValue(DOMAIN_CODES.flatMap((code, index) => [{ id: competencyId(index), code: `${code}.FOUNDATION`, version: 1, status: 'PUBLISHED', domainId: domainId(index) }])),
    } as unknown as DefinitionsService;
    const formationSeeders = Array.from({ length: 6 }, formationSeeder);

    const result = await new FoundationalCurriculumSeeder(
      definitionsService,
      formationSeeders[0] as never,
      formationSeeders[1] as never,
      formationSeeders[2] as never,
      formationSeeders[3] as never,
      formationSeeders[4] as never,
      formationSeeders[5] as never,
    ).seed();

    expect(result).toMatchObject({ curriculumCreated: true, policyCreated: true, domainsLinked: 6, competenciesLinked: 6 });
    expect(definitionsService.createCurriculumDefinition).toHaveBeenCalledWith(expect.objectContaining({ code: 'FOUNDATIONAL.FAMILY_FORMATION' }));
    expect(definitionsService.transitionCurriculumDefinitionStatus).toHaveBeenCalledWith(curriculum.id, 'PUBLISHED');
    expect(definitionsService.addCurriculumDefinitionDomain).toHaveBeenCalledTimes(6);
    expect(definitionsService.addCurriculumDefinitionCompetency).toHaveBeenCalledTimes(6);
    expect(definitionsService.createProgressionPolicy).toHaveBeenCalledWith(expect.objectContaining({
      code: 'FOUNDATIONAL.FAMILY_FORMATION.EVIDENCE_COUNT',
      curriculumDefinitionId: curriculum.id,
      policyType: 'EVIDENCE_COUNT',
      rules: { minimumEvidenceCount: 1, prerequisites: [] },
    }));
    for (const seeder of formationSeeders) expect(seeder.seed).toHaveBeenCalledTimes(1);
  });

  it('is idempotent when the curriculum and policy already exist', async () => {
    const existingCurriculum = { id: '00000000-0000-4000-8000-000000000010', code: 'FOUNDATIONAL.FAMILY_FORMATION', version: 1, status: 'PUBLISHED' };
    const existingPolicy = { id: '00000000-0000-4000-8000-000000000011', code: 'FOUNDATIONAL.FAMILY_FORMATION.EVIDENCE_COUNT', version: 1, status: 'PUBLISHED', policyType: 'EVIDENCE_COUNT', curriculumDefinitionId: existingCurriculum.id };
    const definitionsService = {
      listCurriculumDefinitions: jest.fn().mockResolvedValue([existingCurriculum]),
      listCurriculumDefinitionDomains: jest.fn().mockResolvedValue(DOMAIN_CODES.map((_, index) => ({ domainId: domainId(index) }))),
      listCurriculumDefinitionCompetencies: jest.fn().mockResolvedValue(DOMAIN_CODES.map((_, index) => ({ competencyId: competencyId(index) }))),
      listProgressionPolicies: jest.fn().mockResolvedValue([existingPolicy]),
      listLearningDomains: jest.fn().mockResolvedValue(DOMAIN_CODES.map((code, index) => ({ id: domainId(index), code, version: 1, status: 'PUBLISHED' }))),
      listCompetencyDefinitions: jest.fn().mockResolvedValue(DOMAIN_CODES.map((code, index) => ({ id: competencyId(index), code: `${code}.FOUNDATION`, version: 1, status: 'PUBLISHED', domainId: domainId(index) }))),
      createCurriculumDefinition: jest.fn(),
      transitionCurriculumDefinitionStatus: jest.fn(),
      addCurriculumDefinitionDomain: jest.fn(),
      addCurriculumDefinitionCompetency: jest.fn(),
      createProgressionPolicy: jest.fn(),
      transitionProgressionPolicyStatus: jest.fn(),
    } as unknown as DefinitionsService;
    const formationSeeders = Array.from({ length: 6 }, formationSeeder);

    const result = await new FoundationalCurriculumSeeder(
      definitionsService,
      formationSeeders[0] as never,
      formationSeeders[1] as never,
      formationSeeders[2] as never,
      formationSeeders[3] as never,
      formationSeeders[4] as never,
      formationSeeders[5] as never,
    ).seed();

    expect(result).toEqual({ curriculumCreated: false, policyCreated: false, domainsLinked: 0, competenciesLinked: 0 });
    expect(definitionsService.createCurriculumDefinition).not.toHaveBeenCalled();
    expect(definitionsService.createProgressionPolicy).not.toHaveBeenCalled();
  });
});
