import { ObjectiveService } from './objective.service.js';
import { LearningObjectiveEntity } from '../domain/learning-objective.entity.js';

describe('ObjectiveService', () => {
  let service: ObjectiveService;
  let objectiveRepo: any;

  const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const LEARNER_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const SUBJECT_ID = 's0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const YEAR_ID = 'y0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

  beforeEach(() => {
    objectiveRepo = {
      create: jest.fn().mockImplementation((familyId, dto) =>
        Promise.resolve(
          new LearningObjectiveEntity(
            'obj-1',
            familyId,
            dto.learnerId,
            dto.subjectId,
            dto.academicYearId,
            dto.title,
            dto.description ?? null,
            'NOT_STARTED',
            dto.targetDate ? new Date(dto.targetDate) : null,
            null,
            dto.order ?? 0,
            new Date(),
            new Date(),
          ),
        ),
      ),
      update: jest.fn().mockImplementation((familyId, id, dto) =>
        Promise.resolve(
          new LearningObjectiveEntity(
            id,
            familyId,
            LEARNER_ID,
            SUBJECT_ID,
            YEAR_ID,
            dto.title ?? 'Dominar multiplicação',
            null,
            dto.status ?? 'ACHIEVED',
            null,
            dto.status === 'ACHIEVED' ? new Date() : null,
            0,
            new Date(),
            new Date(),
          ),
        ),
      ),
      list: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(true),
    };

    service = new ObjectiveService(objectiveRepo);
  });

  it('creates a learning objective', async () => {
    const res = await service.createObjective(FAMILY_ID, {
      learnerId: LEARNER_ID,
      subjectId: SUBJECT_ID,
      academicYearId: YEAR_ID,
      title: 'Dominar multiplicação',
    });
    expect(res.title).toBe('Dominar multiplicação');
    expect(res.status).toBe('NOT_STARTED');
  });

  it('updates objective status to ACHIEVED', async () => {
    const res = await service.updateObjective(FAMILY_ID, 'obj-1', {
      status: 'ACHIEVED',
    });
    expect(res.status).toBe('ACHIEVED');
    expect(res.achievedAt).toBeDefined();
  });
});
