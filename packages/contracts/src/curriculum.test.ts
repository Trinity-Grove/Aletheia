import { describe, expect, it } from 'vitest';
import {
  createAcademicYearSchema,
  createSubjectSchema,
  upsertLearnerPlanSchema,
  createObjectiveSchema,
  updateObjectiveSchema,
  applyCurriculumTemplateSchema,
} from './curriculum.js';

const LEARNER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const YEAR_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const SUBJECT_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

describe('Curriculum Contracts', () => {
  it('validates valid academic year input', () => {
    const valid = {
      year: 2026,
      title: 'Ano Letivo 2026',
      startDate: '2026-02-01',
      endDate: '2026-12-15',
      isCurrent: true,
    };
    const parsed = createAcademicYearSchema.parse(valid);
    expect(parsed.year).toBe(2026);
    expect(parsed.isCurrent).toBe(true);
  });

  it('validates subject with default color', () => {
    const parsed = createSubjectSchema.parse({ name: 'Matemática' });
    expect(parsed.name).toBe('Matemática');
    expect(parsed.color).toBe('#3B82F6');
  });

  it('rejects invalid hex color for subject', () => {
    expect(() => createSubjectSchema.parse({ name: 'Artes', color: 'not-a-hex' })).toThrow();
  });

  it('validates learner curriculum plan with default framework', () => {
    const parsed = upsertLearnerPlanSchema.parse({
      learnerId: LEARNER_ID,
      academicYearId: YEAR_ID,
    });
    expect(parsed.pedagogicalFramework).toBe('CUSTOM');
  });

  it('validates learning objective creation and partial update', () => {
    const objective = createObjectiveSchema.parse({
      learnerId: LEARNER_ID,
      subjectId: SUBJECT_ID,
      academicYearId: YEAR_ID,
      title: 'Dominar a tabuada de multiplicação de 1 a 10',
    });
    expect(objective.order).toBe(0);

    const update = updateObjectiveSchema.parse({ status: 'ACHIEVED' });
    expect(update.status).toBe('ACHIEVED');
  });

  it('validates template application schema', () => {
    const parsed = applyCurriculumTemplateSchema.parse({
      learnerId: LEARNER_ID,
      academicYearId: YEAR_ID,
      template: 'CLASSICAL_TRIVIUM',
    });
    expect(parsed.template).toBe('CLASSICAL_TRIVIUM');
  });
});
