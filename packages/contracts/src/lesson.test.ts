import { describe, expect, it } from 'vitest';
import {
  createLessonPlanSchema,
  updateLessonPlanSchema,
  completeLessonSchema,
  rescheduleLessonSchema,
  lessonPlanResponseSchema,
} from './lesson.js';

const LEARNER_ID_1 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const LEARNER_ID_2 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
const SUBJECT_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const YEAR_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const LESSON_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
const FAMILY_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
const OBJECTIVE_ID = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';

describe('Lesson Contracts', () => {
  it('validates a valid lesson plan creation input', () => {
    const valid = {
      academicYearId: YEAR_ID,
      subjectId: SUBJECT_ID,
      title: 'Frações e Decimais - Introdução',
      description: 'Conceito inicial de frações com blocos de montar',
      date: '2026-03-10',
      startTime: '09:00',
      endTime: '10:00',
      durationMinutes: 60,
      learnerIds: [LEARNER_ID_1, LEARNER_ID_2],
      objectiveIds: [OBJECTIVE_ID],
      materials: 'Blocos LEGO e apostila',
      homework: 'Exercícios 1 a 5 da página 42',
      notes: 'Trabalho em grupo com ambos os alunos',
    };

    const parsed = createLessonPlanSchema.parse(valid);
    expect(parsed.title).toBe('Frações e Decimais - Introdução');
    expect(parsed.learnerIds).toHaveLength(2);
    expect(parsed.objectiveIds).toHaveLength(1);
    expect(parsed.durationMinutes).toBe(60);
  });

  it('sets default empty array for objectiveIds when omitted', () => {
    const minimal = {
      subjectId: SUBJECT_ID,
      title: 'Leitura Guiada',
      date: '2026-03-11',
      learnerIds: [LEARNER_ID_1],
    };

    const parsed = createLessonPlanSchema.parse(minimal);
    expect(parsed.objectiveIds).toEqual([]);
    expect(parsed.academicYearId).toBeUndefined();
  });

  it('rejects empty learnerIds list', () => {
    const invalid = {
      subjectId: SUBJECT_ID,
      title: 'Lição sem alunos',
      date: '2026-03-11',
      learnerIds: [],
    };

    expect(() => createLessonPlanSchema.parse(invalid)).toThrow(
      'At least one learner must be assigned',
    );
  });

  it('rejects invalid date format', () => {
    const invalid = {
      subjectId: SUBJECT_ID,
      title: 'Data Inválida',
      date: '10-03-2026',
      learnerIds: [LEARNER_ID_1],
    };

    expect(() => createLessonPlanSchema.parse(invalid)).toThrow('date must be in YYYY-MM-DD format');
  });

  it('rejects invalid time formats', () => {
    const invalid = {
      subjectId: SUBJECT_ID,
      title: 'Horário Inválido',
      date: '2026-03-10',
      startTime: '25:00',
      learnerIds: [LEARNER_ID_1],
    };

    expect(() => createLessonPlanSchema.parse(invalid)).toThrow(
      'startTime must be in HH:MM format',
    );
  });

  it('validates partial update schema', () => {
    const update = {
      title: 'Título Atualizado',
      status: 'IN_PROGRESS' as const,
      durationMinutes: 45,
    };

    const parsed = updateLessonPlanSchema.parse(update);
    expect(parsed.title).toBe('Título Atualizado');
    expect(parsed.durationMinutes).toBe(45);
  });

  it('validates complete lesson payload', () => {
    const complete = {
      completedAt: '2026-03-10T10:15:00.000Z',
      actualDurationMinutes: 55,
      notes: 'Excelente compreensão do conteúdo',
      learnerNotes: {
        [LEARNER_ID_1]: 'Completou com 100% de acerto',
        [LEARNER_ID_2]: 'Precisou de auxílio na questão 4',
      },
    };

    const parsed = completeLessonSchema.parse(complete);
    expect(parsed.actualDurationMinutes).toBe(55);
    expect(parsed.learnerNotes?.[LEARNER_ID_1]).toBe('Completou com 100% de acerto');
  });

  it('validates reschedule payload', () => {
    const reschedule = {
      newDate: '2026-03-12',
      startTime: '14:00',
      endTime: '15:00',
      reason: 'Visita ao médico pela manhã',
    };

    const parsed = rescheduleLessonSchema.parse(reschedule);
    expect(parsed.newDate).toBe('2026-03-12');
    expect(parsed.startTime).toBe('14:00');
    expect(parsed.reason).toBe('Visita ao médico pela manhã');
  });

  it('validates lesson plan response schema', () => {
    const response = {
      id: LESSON_ID,
      familyId: FAMILY_ID,
      academicYearId: YEAR_ID,
      subjectId: SUBJECT_ID,
      subjectName: 'Matemática',
      subjectColor: '#3B82F6',
      title: 'Frações e Decimais',
      description: 'Aula prática',
      date: '2026-03-10',
      startTime: '09:00',
      endTime: '10:00',
      durationMinutes: 60,
      actualDurationMinutes: null,
      status: 'PLANNED' as const,
      materials: 'Blocos',
      homework: null,
      notes: null,
      completedAt: null,
      learners: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          lessonPlanId: LESSON_ID,
          learnerId: LEARNER_ID_1,
          learnerName: 'Ester Sá',
          notes: null,
          completed: false,
        },
      ],
      objectives: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          lessonPlanId: LESSON_ID,
          objectiveId: OBJECTIVE_ID,
          title: 'Dominar frações básicas',
        },
      ],
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    };

    const parsed = lessonPlanResponseSchema.parse(response);
    expect(parsed.id).toBe(LESSON_ID);
    expect(parsed.learners).toHaveLength(1);
    expect(parsed.objectives).toHaveLength(1);
  });
});
