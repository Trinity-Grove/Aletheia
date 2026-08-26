import { LearningRecordService } from './learning-record.service.js';
import { LearningRecordEntity } from '../domain/learning-record.entity.js';

describe('LearningRecordService', () => {
  let service: LearningRecordService;
  let recordRepo: any;

  const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const LEARNER_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const RECORD_ID = 'r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  beforeEach(() => {
    recordRepo = {
      create: jest.fn().mockImplementation((familyId, dto) =>
        Promise.resolve(
          new LearningRecordEntity(
            RECORD_ID,
            familyId,
            dto.learnerId,
            dto.subjectId ?? null,
            dto.academicYearId ?? null,
            dto.lessonPlanId ?? null,
            dto.type ?? 'PLANNED_LESSON',
            dto.title,
            dto.description ?? null,
            new Date(dto.date),
            dto.durationMinutes ?? null,
            dto.masteryLevel ?? 'DEVELOPING',
            dto.assessmentMethod ?? 'OBSERVATION',
            dto.strengths ?? null,
            dto.areasForGrowth ?? null,
            dto.characterHabitGrowth ?? null,
            dto.notes ?? null,
            new Date(),
            new Date(),
            [],
            dto.evidenceItemIds ?? [],
            'Alice Smith',
            'Math',
            '#FF0000',
          ),
        ),
      ),
      findById: jest.fn().mockImplementation((familyId, id) =>
        Promise.resolve(
          new LearningRecordEntity(
            id,
            familyId,
            LEARNER_ID,
            null,
            null,
            null,
            'PLANNED_LESSON',
            'Math Lesson',
            null,
            new Date('2026-08-20'),
            45,
            'DEVELOPING',
            'OBSERVATION',
            null,
            null,
            null,
            null,
            new Date(),
            new Date(),
            [],
            [],
            'Alice Smith',
          ),
        ),
      ),
      list: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockImplementation((familyId, id, dto) =>
        Promise.resolve(
          new LearningRecordEntity(
            id,
            familyId,
            dto.learnerId ?? LEARNER_ID,
            dto.subjectId ?? null,
            null,
            null,
            dto.type ?? 'PLANNED_LESSON',
            dto.title ?? 'Updated Title',
            null,
            dto.date ? new Date(dto.date) : new Date('2026-08-20'),
            dto.durationMinutes ?? 50,
            dto.masteryLevel ?? 'MASTERED',
            dto.assessmentMethod ?? 'TEST',
            null,
            null,
            null,
            null,
            new Date(),
            new Date(),
            [],
            [],
            'Alice Smith',
          ),
        ),
      ),
      delete: jest.fn().mockResolvedValue(true),
    };

    service = new LearningRecordService(recordRepo);
  });

  it('creates a learning record successfully', async () => {
    const res = await service.createRecord(FAMILY_ID, {
      learnerId: LEARNER_ID,
      title: 'Math Lesson 1',
      date: '2026-08-26',
      durationMinutes: 45,
      masteryLevel: 'DEVELOPING',
      assessmentMethod: 'OBSERVATION',
    });

    expect(res.id).toBe(RECORD_ID);
    expect(res.title).toBe('Math Lesson 1');
    expect(res.date).toBe('2026-08-26');
    expect(res.learnerName).toBe('Alice Smith');
    expect(recordRepo.create).toHaveBeenCalledWith(FAMILY_ID, expect.objectContaining({
      title: 'Math Lesson 1',
    }));
  });

  it('retrieves a single record by id', async () => {
    const res = await service.getRecord(FAMILY_ID, RECORD_ID);
    expect(res.id).toBe(RECORD_ID);
    expect(res.title).toBe('Math Lesson');
  });

  it('throws NotFoundException when record not found by id', async () => {
    recordRepo.findById.mockResolvedValue(null);
    await expect(service.getRecord(FAMILY_ID, 'non-existent')).rejects.toThrow('Learning record not found');
  });

  it('updates a learning record successfully', async () => {
    const res = await service.updateRecord(FAMILY_ID, RECORD_ID, {
      masteryLevel: 'MASTERED',
      durationMinutes: 50,
    });
    expect(res.masteryLevel).toBe('MASTERED');
    expect(res.durationMinutes).toBe(50);
  });

  it('deletes a learning record successfully', async () => {
    const res = await service.deleteRecord(FAMILY_ID, RECORD_ID);
    expect(res).toBe(true);
    expect(recordRepo.delete).toHaveBeenCalledWith(FAMILY_ID, RECORD_ID);
  });

  it('computes learner progress summary with correct breakdown and metrics', async () => {
    const records = [
      new LearningRecordEntity(
        'r-1',
        FAMILY_ID,
        LEARNER_ID,
        null,
        null,
        null,
        'PLANNED_LESSON',
        'Fractions',
        null,
        new Date('2026-08-20'),
        60,
        'MASTERED',
        'TEST',
        null,
        null,
        null,
        null,
        new Date(),
        new Date(),
        [],
        [],
        'Alice Smith',
      ),
      new LearningRecordEntity(
        'r-2',
        FAMILY_ID,
        LEARNER_ID,
        null,
        null,
        null,
        'SPONTANEOUS_EXPERIENCE',
        'Nature Walk - Bird Observation',
        null,
        new Date('2026-08-21'),
        40,
        'AUTONOMOUS',
        'OBSERVATION',
        null,
        null,
        null,
        null,
        new Date(),
        new Date(),
        [],
        [],
        'Alice Smith',
      ),
      new LearningRecordEntity(
        'r-3',
        FAMILY_ID,
        LEARNER_ID,
        null,
        null,
        null,
        'PLANNED_LESSON',
        'Grammar Exercises',
        null,
        new Date('2026-08-22'),
        30,
        'DEVELOPING',
        'EXERCISE',
        null,
        null,
        null,
        null,
        new Date(),
        new Date(),
        [],
        [],
        'Alice Smith',
      ),
    ];

    recordRepo.list.mockResolvedValue(records);

    const summary = await service.getProgressSummary(FAMILY_ID, LEARNER_ID);

    expect(summary.learnerId).toBe(LEARNER_ID);
    expect(summary.learnerName).toBe('Alice Smith');
    expect(summary.totalRecordsCount).toBe(3);
    expect(summary.totalMinutesSpent).toBe(130);
    expect(summary.masteryDistribution).toEqual({
      NOT_STARTED: 0,
      EXPOSURE: 0,
      DEVELOPING: 1,
      WITH_ASSISTANCE: 0,
      AUTONOMOUS: 1,
      MASTERED: 1,
    });
    expect(summary.recordsByType).toEqual({
      PLANNED_LESSON: 2,
      SPONTANEOUS_EXPERIENCE: 1,
      PROJECT_WORK: 0,
      READING_LOG: 0,
      HABIT_PRACTICE: 0,
    });
    expect(summary.recentMilestones.length).toBe(2);
    expect(summary.recentMilestones[0]?.id).toBe('r-1');
    expect(summary.recentMilestones[1]?.id).toBe('r-2');
  });
});
