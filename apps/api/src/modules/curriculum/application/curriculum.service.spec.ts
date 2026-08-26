import { CurriculumService } from './curriculum.service.js';
import { CurriculumTemplateEngine } from '../infrastructure/curriculum-template.engine.js';
import { AcademicYearEntity } from '../domain/academic-year.entity.js';
import { SubjectEntity } from '../domain/subject.entity.js';
import { LearnerCurriculumPlanEntity } from '../domain/learner-plan.entity.js';

describe('CurriculumService', () => {
  let service: CurriculumService;
  let curriculumRepo: any;
  let objectiveRepo: any;
  let templateEngine: CurriculumTemplateEngine;

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

    templateEngine = new CurriculumTemplateEngine();

    service = new CurriculumService(curriculumRepo, objectiveRepo, templateEngine);
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
    expect(curriculumRepo.upsertLearnerPlan).toHaveBeenCalledWith(
      FAMILY_ID,
      expect.objectContaining({ pedagogicalFramework: 'CLASSICAL_TRIVIUM' }),
    );
  });
});
