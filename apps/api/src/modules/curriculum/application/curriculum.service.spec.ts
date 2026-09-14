import { CurriculumService } from './curriculum.service.js';

import { AcademicYearEntity } from '../domain/academic-year.entity.js';
import { SubjectEntity } from '../domain/subject.entity.js';
import { LearnerCurriculumPlanEntity } from '../domain/learner-plan.entity.js';

describe('CurriculumService', () => {
  let service: CurriculumService;
  let curriculumRepo: any;
  let objectiveRepo: any;
  let resolver: any;

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

    resolver = { resolvePublished: jest.fn().mockResolvedValue({ id: 'definition-1', subjects: [{ name: 'Catalog subject', color: '#123456', description: 'Catalog', starterObjectives: ['Catalog objective'] }] }) };
    curriculumRepo.applyPublishedTemplate = jest.fn().mockResolvedValue({ subjectsCount: 1, objectivesCount: 1 });

    const traditionCatalogResolver: any = { listPublishedCatalog: jest.fn().mockResolvedValue([]) };
    const curriculumDefinitionCatalogResolver: any = { listPublishedCatalog: jest.fn().mockResolvedValue([]) };
    const evidenceTypeCatalogResolver: any = { listPublishedCatalog: jest.fn().mockResolvedValue([]) };
    service = new CurriculumService(
      curriculumRepo,
      objectiveRepo,
      resolver,
      traditionCatalogResolver,
      curriculumDefinitionCatalogResolver,
      evidenceTypeCatalogResolver,
      { listPublishedCatalog: jest.fn().mockResolvedValue([]) } as any,
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
});

describe('published catalog application', () => {
  it('rejects unavailable definitions before any writes', async () => {
    const repo = { applyPublishedTemplate: jest.fn(), upsertLearnerPlan: jest.fn() };
    const resolver = { resolvePublished: jest.fn().mockResolvedValue(null) };
    const service = new CurriculumService(
      repo as any,
      {} as any,
      resolver as any,
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
