import { describe, expect, it } from 'vitest';
import {
  createScheduleSlotSchema,
  updateScheduleSlotSchema,
  scheduleSlotResponseSchema,
  dailyAgendaSchema,
} from './schedule.js';

const SLOT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const FAMILY_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const SUBJECT_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const LEARNER_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
const YEAR_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

describe('Schedule Contracts', () => {
  it('validates valid weekly routine slot input', () => {
    const valid = {
      academicYearId: YEAR_ID,
      subjectId: SUBJECT_ID,
      learnerId: LEARNER_ID,
      dayOfWeek: 1, // Monday
      startTime: '08:30',
      endTime: '09:30',
      title: 'Devocional em Família & Leitura Bíblica',
      description: 'Momento de oração matinal e cântico de hinos',
      location: 'Sala de Estar',
      color: '#10B981',
    };

    const parsed = createScheduleSlotSchema.parse(valid);
    expect(parsed.dayOfWeek).toBe(1);
    expect(parsed.startTime).toBe('08:30');
    expect(parsed.endTime).toBe('09:30');
    expect(parsed.title).toBe('Devocional em Família & Leitura Bíblica');
  });

  it('rejects invalid dayOfWeek (must be between 1 and 7)', () => {
    const invalidLow = {
      dayOfWeek: 0,
      startTime: '09:00',
      endTime: '10:00',
      title: 'Matemática',
    };
    expect(() => createScheduleSlotSchema.parse(invalidLow)).toThrow();

    const invalidHigh = {
      dayOfWeek: 8,
      startTime: '09:00',
      endTime: '10:00',
      title: 'Matemática',
    };
    expect(() => createScheduleSlotSchema.parse(invalidHigh)).toThrow();
  });

  it('rejects invalid hex color in schedule slot', () => {
    const invalidColor = {
      dayOfWeek: 2,
      startTime: '10:00',
      endTime: '11:00',
      title: 'Gramática Latina',
      color: 'blue-500',
    };
    expect(() => createScheduleSlotSchema.parse(invalidColor)).toThrow('Invalid hex color');
  });

  it('validates partial update schema for schedule slot', () => {
    const update = {
      startTime: '10:30',
      endTime: '11:30',
      location: 'Biblioteca',
    };

    const parsed = updateScheduleSlotSchema.parse(update);
    expect(parsed.startTime).toBe('10:30');
    expect(parsed.location).toBe('Biblioteca');
  });

  it('validates schedule slot response schema', () => {
    const response = {
      id: SLOT_ID,
      familyId: FAMILY_ID,
      academicYearId: YEAR_ID,
      subjectId: SUBJECT_ID,
      subjectName: 'História Antiga',
      learnerId: LEARNER_ID,
      learnerName: 'Ester Sá',
      dayOfWeek: 3,
      startTime: '14:00',
      endTime: '15:00',
      title: 'História do Egito Antigo',
      description: 'Civilizações do Nilo',
      location: 'Mesa de estudos',
      color: '#F59E0B',
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    };

    const parsed = scheduleSlotResponseSchema.parse(response);
    expect(parsed.id).toBe(SLOT_ID);
    expect(parsed.dayOfWeek).toBe(3);
    expect(parsed.subjectName).toBe('História Antiga');
  });

  it('validates daily agenda schema containing lessons and routine slots', () => {
    const agenda = {
      date: '2026-03-10',
      dayOfWeek: 2, // Tuesday
      items: [
        {
          type: 'ROUTINE_SLOT' as const,
          id: SLOT_ID,
          title: 'Devocional Matinal',
          startTime: '08:00',
          endTime: '08:30',
          subjectId: null,
          subjectName: null,
          subjectColor: null,
          learnerIds: [],
          isCompleted: false,
        },
        {
          type: 'LESSON' as const,
          id: '11111111-2222-4333-8444-555555555555',
          title: 'Aula de Latim - Cap. 3',
          startTime: '09:00',
          endTime: '10:00',
          subjectId: SUBJECT_ID,
          subjectName: 'Latim',
          subjectColor: '#6366F1',
          status: 'COMPLETED' as const,
          learnerIds: [LEARNER_ID],
          isCompleted: true,
        },
      ],
    };

    const parsed = dailyAgendaSchema.parse(agenda);
    expect(parsed.date).toBe('2026-03-10');
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0]?.type).toBe('ROUTINE_SLOT');
    expect(parsed.items[1]?.isCompleted).toBe(true);
  });
});
