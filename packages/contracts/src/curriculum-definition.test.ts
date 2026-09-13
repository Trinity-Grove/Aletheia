import { describe, expect, it } from 'vitest';
import {
  createCurriculumDefinitionSchema,
  addCurriculumDefinitionDomainSchema,
  addCurriculumDefinitionCompetencySchema,
  addCurriculumDefinitionRubricSchema,
  addCurriculumDefinitionActivitySchema,
  curriculumDefinitionCatalogEntrySchema,
} from './curriculum-definition.js';

const MODEL_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const DOMAIN_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const COMPETENCY_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const RUBRIC_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
const ACTIVITY_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

describe('Curriculum Definition Contracts', () => {
  it('validates a minimal curriculum definition with defaults', () => {
    const parsed = createCurriculumDefinitionSchema.parse({
      code: 'CLASSICAL_TRIVIUM.CORE',
      name: 'Trivium Clássico -- Núcleo',
    });
    expect(parsed.status).toBe('DRAFT');
    expect(parsed.pedagogicalModelDefinitionId).toBeUndefined();
  });

  it('validates a curriculum definition referencing a pedagogical model', () => {
    const parsed = createCurriculumDefinitionSchema.parse({
      code: 'CLASSICAL_TRIVIUM.CORE',
      name: 'Trivium Clássico -- Núcleo',
      pedagogicalModelDefinitionId: MODEL_ID,
    });
    expect(parsed.pedagogicalModelDefinitionId).toBe(MODEL_ID);
  });

  it('rejects a lowercase curriculum code', () => {
    expect(() =>
      createCurriculumDefinitionSchema.parse({ code: 'classical.core', name: 'x' }),
    ).toThrow();
  });

  it('validates a domain link with defaults', () => {
    const parsed = addCurriculumDefinitionDomainSchema.parse({ domainId: DOMAIN_ID });
    expect(parsed.required).toBe(true);
    expect(parsed.order).toBe(0);
  });

  it('validates a competency link with explicit values', () => {
    const parsed = addCurriculumDefinitionCompetencySchema.parse({
      competencyId: COMPETENCY_ID,
      required: false,
      order: 3,
    });
    expect(parsed.required).toBe(false);
    expect(parsed.order).toBe(3);
  });

  it('validates a rubric link', () => {
    const parsed = addCurriculumDefinitionRubricSchema.parse({ rubricId: RUBRIC_ID });
    expect(parsed.rubricId).toBe(RUBRIC_ID);
  });

  it('validates an activity link with defaults', () => {
    const parsed = addCurriculumDefinitionActivitySchema.parse({ activityId: ACTIVITY_ID });
    expect(parsed.required).toBe(true);
    expect(parsed.order).toBe(0);
  });

  it('validates a family-facing catalog entry, which unlike the pedagogical/theological catalogs does carry an id', () => {
    const parsed = curriculumDefinitionCatalogEntrySchema.parse({
      id: MODEL_ID,
      code: 'CLASSICAL_TRIVIUM.CORE',
      name: 'Trivium Clássico -- Núcleo',
      description: null,
    });
    expect(parsed.id).toBe(MODEL_ID);
  });
});
