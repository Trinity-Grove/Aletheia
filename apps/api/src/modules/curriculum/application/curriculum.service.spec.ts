import { CurriculumService } from './curriculum.service.js';

import { AcademicYearEntity } from '../domain/academic-year.entity.js';
import { SubjectEntity } from '../domain/subject.entity.js';
import { LearnerCurriculumPlanEntity } from '../domain/learner-plan.entity.js';

describe('CurriculumService', () => {
  let service: CurriculumService;
  let curriculumRepo: any;
  let objectiveRepo: any;
  let resolver: any;
  let rubricCatalogResolver: any;
  let profilesService: any;

  const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const LEARNER_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const YEAR_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  beforeEach(() => {
    curriculumRepo = {
      createAcademicYear: jest.fn().mockImplementation((familyId, dto) =>
        Promise.resolve(
          new AcademicYearEntity(
            YEAR_ID,
            familyId,
            dto.year,
            dto.title,
            dto.startDate ? new Date(dto.startDate) : null,
            dto.endDate ? new Date(dto.endDate) : null,
            dto.isCurrent ?? false,
            new Date(),
            new Date(),
          ),
        ),
      ),
      listAcademicYears: jest.fn().mockResolvedValue([]),
      findCurrentAcademicYear: jest.fn().mockResolvedValue(null),
      createSubject: jest.fn().mockImplementation((familyId, dto) =>
        Promise.resolve(
          new SubjectEntity(
            's-1',
            familyId,
            dto.name,
            dto.color ?? '#3B82F6',
            dto.icon ?? null,
            dto.description ?? null,
            null,
            new Date(),
            new Date(),
          ),
        ),
      ),
      listSubjects: jest.fn().mockResolvedValue([]),
      findSubjectById: jest.fn().mockResolvedValue(null),
      findSubjectByName: jest.fn().mockResolvedValue(null),
      updateSubject: jest.fn(),
      archiveSubject: jest.fn(),
      upsertLearnerPlan: jest.fn().mockImplementation((familyId, dto) =>
        Promise.resolve(
          new LearnerCurriculumPlanEntity(
            'p-1',
            familyId,
            dto.learnerId,
            dto.academicYearId,
            dto.pedagogicalFramework ?? 'CUSTOM',
            dto.notes ?? null,
            new Date(),
            new Date(),
          ),
        ),
      ),
      findLearnerPlan: jest.fn().mockResolvedValue(null),
    };

    objectiveRepo = {
      create: jest.fn().mockResolvedValue({ id: 'o-1' }),
    };

    resolver = {
      resolvePublished: jest.fn().mockResolvedValue({ id: 'definition-1', subjects: [{ name: 'Catalog subject', color: '#123456', description: 'Catalog', starterObjectives: ['Catalog objective'] }] }),
      getSubjectDefinitions: jest.fn().mockResolvedValue([]),
    };
    curriculumRepo.applyPublishedTemplate = jest.fn().mockResolvedValue({ subjectsCount: 1, objectivesCount: 1 });
    // Default: no PedagogicalProfile configured -- applyTemplate must be a
    // no-op with respect to weighting in this default setup (see the
    // dedicated 'PedagogicalProfile-weighted applyTemplate' suite below for
    // the with-profile behavior).
    profilesService = { getPedagogicalProfile: jest.fn().mockResolvedValue(null) };

    const traditionCatalogResolver: any = { listPublishedCatalog: jest.fn().mockResolvedValue([]) };
    const curriculumDefinitionCatalogResolver: any = { listPublishedCatalog: jest.fn().mockResolvedValue([]) };
    const evidenceTypeCatalogResolver: any = { listPublishedCatalog: jest.fn().mockResolvedValue([]) };
    rubricCatalogResolver = {
      listPublishedCatalog: jest.fn().mockResolvedValue([
        {
          id: 'rubric-1',
          code: 'FOUNDATION.RUBRIC',
          version: 1,
          name: 'Rubrica de leitura',
          criteria: [{ id: 'criterion-1', code: 'CLARITY', label: 'Clareza', order: 0, scaleMin: 0, scaleMax: 4 }],
        },
      ]),
    };
    service = new CurriculumService(
      curriculumRepo,
      objectiveRepo,
      resolver,
      profilesService,
      traditionCatalogResolver,
      curriculumDefinitionCatalogResolver,
      evidenceTypeCatalogResolver,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
      rubricCatalogResolver,
    );
  });

  it('creates an academic year', async () => {
    const res = await service.createAcademicYear(FAMILY_ID, {
      year: 2026,
      title: 'Ano Letivo 2026',
      isCurrent: true,
    });
    expect(res.year).toBe(2026);
    expect(res.isCurrent).toBe(true);
  });

  it('creates a new subject', async () => {
    const res = await service.createSubject(FAMILY_ID, {
      name: 'Matemática',
      color: '#059669',
    });
    expect(res.name).toBe('Matemática');
  });

  it('applies a classical curriculum template', async () => {
    const res = await service.applyTemplate(FAMILY_ID, {
      learnerId: LEARNER_ID,
      academicYearId: YEAR_ID,
      template: 'CLASSICAL_TRIVIUM',
    });
    expect(res.subjectsCount).toBeGreaterThan(0);
    expect(res.objectivesCount).toBeGreaterThan(0);
    expect(curriculumRepo.applyPublishedTemplate).toHaveBeenCalledWith(
      FAMILY_ID,
      expect.objectContaining({ template: 'CLASSICAL_TRIVIUM' }),
      expect.objectContaining({ id: 'definition-1' }),
      'CLASSICAL_TRIVIUM',
    );
  });

  it('applies a newly added pedagogical framework template', async () => {
    const res = await service.applyTemplate(FAMILY_ID, {
      learnerId: LEARNER_ID,
      academicYearId: YEAR_ID,
      template: 'MONTESSORI',
    });
    expect(res.subjectsCount).toBeGreaterThan(0);
    expect(res.objectivesCount).toBeGreaterThan(0);
    expect(curriculumRepo.applyPublishedTemplate).toHaveBeenCalledWith(
      FAMILY_ID,
      expect.objectContaining({ template: 'MONTESSORI' }),
      expect.objectContaining({ id: 'definition-1' }),
      'MONTESSORI',
    );
  });

  it('lists the published rubric catalog for family-facing assessment', async () => {
    await expect(service.listPublishedRubricCatalog()).resolves.toEqual([
      expect.objectContaining({ code: 'FOUNDATION.RUBRIC', version: 1 }),
    ]);
    expect(rubricCatalogResolver.listPublishedCatalog).toHaveBeenCalledTimes(1);
  });
});

describe('published catalog application', () => {
  it('rejects unavailable definitions before any writes', async () => {
    const repo = { applyPublishedTemplate: jest.fn(), upsertLearnerPlan: jest.fn() };
    const resolver = { resolvePublished: jest.fn().mockResolvedValue(null) };
    const service = new CurriculumService(
      repo as any,
      {} as any,
      resolver as any,
      { getPedagogicalProfile: jest.fn().mockResolvedValue(null) } as any,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
    );
    await expect(service.applyTemplate('family', { learnerId: 'learner', academicYearId: 'year', template: 'NEW_MODEL' })).rejects.toThrow('Published pedagogical model not found');
    expect(repo.applyPublishedTemplate).not.toHaveBeenCalled();
    expect(repo.upsertLearnerPlan).not.toHaveBeenCalled();
  });
  it('uses CUSTOM only for the compatibility field of new catalog codes', async () => {
    const definition = { id: 'version-id', subjects: [] };
    const repo = { applyPublishedTemplate: jest.fn().mockResolvedValue({ subjectsCount: 0, objectivesCount: 0 }) };
    const resolver = { resolvePublished: jest.fn().mockResolvedValue(definition) };
    const service = new CurriculumService(
      repo as any,
      {} as any,
      resolver as any,
      { getPedagogicalProfile: jest.fn().mockResolvedValue(null) } as any,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
    );
    const dto = { learnerId: 'learner', academicYearId: 'year', template: 'NEW_MODEL' };
    await service.applyTemplate('family', dto);
    expect(resolver.resolvePublished).toHaveBeenCalledWith('NEW_MODEL');
    expect(repo.applyPublishedTemplate).toHaveBeenCalledWith('family', dto, definition, 'CUSTOM');
  });
});

describe('PedagogicalProfile-weighted applyTemplate (issue #95)', () => {
  const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const CROSS_CUTTING = { name: 'Cross-Cutting Subject', color: '#111111', description: 'Shared', starterObjectives: ['x'] };
  const CLASSICAL_ONLY = { name: 'Classical-Only Subject', color: '#222222', description: 'Specific', starterObjectives: ['y'] };

  function buildService(overrides: {
    profile: any;
    subjectsByCode: Record<string, Array<{ name: string }>>;
  }) {
    const repo = {
      applyPublishedTemplate: jest.fn().mockResolvedValue({ subjectsCount: 2, objectivesCount: 2 }),
    };
    const resolver = {
      resolvePublished: jest.fn().mockResolvedValue({
        id: 'classical-def', subjects: [CLASSICAL_ONLY, CROSS_CUTTING],
      }),
      getSubjectDefinitions: jest.fn().mockImplementation(async (code: string) => overrides.subjectsByCode[code] ?? []),
    };
    const profilesService = { getPedagogicalProfile: jest.fn().mockResolvedValue(overrides.profile) };
    const service = new CurriculumService(
      repo as any,
      {} as any,
      resolver as any,
      profilesService as any,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
    );
    return { service, repo, resolver, profilesService };
  }

  it('is a byte-for-byte no-op when the family has no PedagogicalProfile', async () => {
    const { service, repo, resolver } = buildService({ profile: null, subjectsByCode: {} });
    const dto = { learnerId: 'l', academicYearId: 'y', template: 'CLASSICAL_TRIVIUM' };
    const resolvedDefinition = await resolver.resolvePublished('CLASSICAL_TRIVIUM');

    const result = await service.applyTemplate(FAMILY_ID, dto);

    // No new resolver calls to weigh by (getSubjectDefinitions only called
    // for weighted models -- none exist here).
    expect(resolver.getSubjectDefinitions).not.toHaveBeenCalled();
    // The definition passed to the repository is the exact same object
    // resolvePublished returns -- not a copy, not reordered.
    const passedDefinition = repo.applyPublishedTemplate.mock.calls[0][2];
    expect(passedDefinition).toBe(resolvedDefinition);
    expect(passedDefinition.subjects).toEqual([CLASSICAL_ONLY, CROSS_CUTTING]);
    // Response carries no weighting artifact at all.
    expect(result).toEqual({ subjectsCount: 2, objectivesCount: 2 });
    expect('subjectRelevance' in result).toBe(false);
  });

  it('boosts a subject shared with the weighted models ahead of a template-only subject', async () => {
    const { service, repo } = buildService({
      profile: {
        primaryModelCode: 'MONTESSORI',
        secondaryModels: [{ code: 'CHARLOTTE_MASON', weight: 0.5 }],
        overrides: {},
      },
      subjectsByCode: {
        MONTESSORI: [{ name: CROSS_CUTTING.name }],
        CHARLOTTE_MASON: [{ name: CROSS_CUTTING.name }],
      },
    });
    const dto = { learnerId: 'l', academicYearId: 'y', template: 'CLASSICAL_TRIVIUM' };

    const result = await service.applyTemplate(FAMILY_ID, dto);

    const passedDefinition = repo.applyPublishedTemplate.mock.calls[0][2];
    // CROSS_CUTTING (score 1 + 0.5 = 1.5) now sorts ahead of
    // CLASSICAL_ONLY (score 0), reversing the original array order.
    expect(passedDefinition.subjects.map((s: any) => s.name)).toEqual([
      CROSS_CUTTING.name,
      CLASSICAL_ONLY.name,
    ]);
    expect(result.subjectRelevance).toEqual([
      { name: CROSS_CUTTING.name, relevanceScore: 1.5 },
      { name: CLASSICAL_ONLY.name, relevanceScore: 0 },
    ]);
  });

  it('never reads another family\'s profile (tenant isolation)', async () => {
    const { service, profilesService } = buildService({ profile: null, subjectsByCode: {} });
    await service.applyTemplate(FAMILY_ID, { learnerId: 'l', academicYearId: 'y', template: 'CLASSICAL_TRIVIUM' });
    expect(profilesService.getPedagogicalProfile).toHaveBeenCalledTimes(1);
    expect(profilesService.getPedagogicalProfile).toHaveBeenCalledWith(FAMILY_ID);
  });
});
