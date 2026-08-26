import { describe, expect, it } from 'vitest';
import {
  createLearningRecordSchema,
  updateLearningRecordSchema,
  learningRecordFilterSchema,
  learningRecordResponseSchema,
  learnerProgressSummarySchema,
} from './record.js';

const LEARNER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const SUBJECT_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const YEAR_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const RECORD_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
const FAMILY_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
const OBJECTIVE_ID = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';
const PORTFOLIO_ID = '90eebc99-9c0b-4ef8-bb6d-6bb9bd380a99';

describe('Learning Record Contracts', () => {
  it('validates a valid learning record creation payload with defaults', () => {
    const valid = {
      learnerId: LEARNER_ID,
      title: 'Exploração de Insetos no Jardim',
      date: '2026-03-15',
    };

    const parsed = createLearningRecordSchema.parse(valid);
    expect(parsed.title).toBe('Exploração de Insetos no Jardim');
    expect(parsed.type).toBe('PLANNED_LESSON');
    expect(parsed.masteryLevel).toBe('DEVELOPING');
    expect(parsed.assessmentMethod).toBe('OBSERVATION');
    expect(parsed.objectiveIds).toEqual([]);
    expect(parsed.evidenceItemIds).toEqual([]);
  });

  it('validates a full spontaneous experience record with objectives and evidence', () => {
    const full = {
      learnerId: LEARNER_ID,
      subjectId: SUBJECT_ID,
      academicYearId: YEAR_ID,
      type: 'SPONTANEOUS_EXPERIENCE' as const,
      title: 'Construção de Robô com Sucata',
      description: 'Montou circuito com motor e pilha sozinho',
      date: '2026-03-16',
      durationMinutes: 90,
      masteryLevel: 'AUTONOMOUS' as const,
      assessmentMethod: 'PROJECT' as const,
      strengths: 'Alta persistência na montagem',
      areasForGrowth: 'Cuidado com ferramentas de corte',
      characterHabitGrowth: 'Paciência e atenção aos detalhes',
      notes: 'Demonstrou iniciativa própria',
      objectiveIds: [OBJECTIVE_ID],
      evidenceItemIds: [PORTFOLIO_ID],
    };

    const parsed = createLearningRecordSchema.parse(full);
    expect(parsed.type).toBe('SPONTANEOUS_EXPERIENCE');
    expect(parsed.masteryLevel).toBe('AUTONOMOUS');
    expect(parsed.durationMinutes).toBe(90);
    expect(parsed.objectiveIds).toHaveLength(1);
    expect(parsed.evidenceItemIds).toHaveLength(1);
  });

  it('rejects invalid date format', () => {
    const invalid = {
      learnerId: LEARNER_ID,
      title: 'Data Inválida',
      date: '15/03/2026',
    };

    expect(() => createLearningRecordSchema.parse(invalid)).toThrow(
      'date must be in YYYY-MM-DD format',
    );
  });

  it('validates partial update schema', () => {
    const update = {
      masteryLevel: 'MASTERED' as const,
      strengths: 'Excelente retenção e aplicação prática',
    };

    const parsed = updateLearningRecordSchema.parse(update);
    expect(parsed.masteryLevel).toBe('MASTERED');
    expect(parsed.strengths).toBe('Excelente retenção e aplicação prática');
  });

  it('validates filter query schema', () => {
    const filter = {
      learnerId: LEARNER_ID,
      type: 'HABIT_PRACTICE' as const,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    };

    const parsed = learningRecordFilterSchema.parse(filter);
    expect(parsed.learnerId).toBe(LEARNER_ID);
    expect(parsed.type).toBe('HABIT_PRACTICE');
  });

  it('validates learning record response schema', () => {
    const response = {
      id: RECORD_ID,
      familyId: FAMILY_ID,
      learnerId: LEARNER_ID,
      learnerName: 'Ester Sá',
      subjectId: SUBJECT_ID,
      subjectName: 'Ciências',
      subjectColor: '#10B981',
      academicYearId: YEAR_ID,
      lessonPlanId: null,
      type: 'SPONTANEOUS_EXPERIENCE' as const,
      title: 'Construção de Robô com Sucata',
      description: 'Montagem criativa',
      date: '2026-03-16',
      durationMinutes: 90,
      masteryLevel: 'AUTONOMOUS' as const,
      assessmentMethod: 'PROJECT' as const,
      strengths: 'Iniciativa',
      areasForGrowth: null,
      characterHabitGrowth: 'Paciência',
      notes: null,
      objectives: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          learningRecordId: RECORD_ID,
          objectiveId: OBJECTIVE_ID,
          objectiveTitle: 'Compreender circuitos elétricos básicos',
          createdAt: '2026-03-16T15:00:00.000Z',
        },
      ],
      portfolioItemIds: [PORTFOLIO_ID],
      createdAt: '2026-03-16T15:00:00.000Z',
      updatedAt: '2026-03-16T15:00:00.000Z',
    };

    const parsed = learningRecordResponseSchema.parse(response);
    expect(parsed.id).toBe(RECORD_ID);
    expect(parsed.objectives).toHaveLength(1);
    expect(parsed.portfolioItemIds).toEqual([PORTFOLIO_ID]);
  });

  it('validates learner progress summary schema', () => {
    const summary = {
      learnerId: LEARNER_ID,
      learnerName: 'Ester Sá',
      totalRecordsCount: 25,
      totalMinutesSpent: 1200,
      masteryDistribution: {
        NOT_STARTED: 0,
        EXPOSURE: 2,
        DEVELOPING: 8,
        WITH_ASSISTANCE: 5,
        AUTONOMOUS: 7,
        MASTERED: 3,
      },
      recordsByType: {
        PLANNED_LESSON: 15,
        SPONTANEOUS_EXPERIENCE: 4,
        PROJECT_WORK: 3,
        READING_LOG: 2,
        HABIT_PRACTICE: 1,
      },
      recentMilestones: [],
    };

    const parsed = learnerProgressSummarySchema.parse(summary);
    expect(parsed.totalRecordsCount).toBe(25);
    expect(parsed.masteryDistribution.MASTERED).toBe(3);
    expect(parsed.recordsByType.PLANNED_LESSON).toBe(15);
  });
});
