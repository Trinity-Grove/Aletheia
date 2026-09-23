import { describe, expect, it } from 'vitest';
import {
  createProjectDefinitionSchema,
  addProjectDefinitionDomainSchema,
  addProjectDefinitionCompetencySchema,
  addProjectDefinitionMilestoneSchema,
} from './project-definition.js';

const DOMAIN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const COMPETENCY_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const RUBRIC_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

describe('Project Definition Contracts', () => {
  it('validates a minimal project with defaults', () => {
    const parsed = createProjectDefinitionSchema.parse({
      code: 'GARDEN_BUILD',
      name: 'Construir uma horta',
    });
    expect(parsed.status).toBe('DRAFT');
    expect(parsed.version).toBe(1);
    expect(parsed.rubricDefinitionId).toBeUndefined();
  });

  it('validates a project with full fields', () => {
    const parsed = createProjectDefinitionSchema.parse({
      code: 'GARDEN_BUILD',
      name: 'Construir uma horta',
      description: 'Projeto interdisciplinar de planejamento e cultivo de uma horta familiar.',
      estimatedDurationDays: 30,
      rubricDefinitionId: RUBRIC_ID,
      metadata: { season: 'spring' },
    });
    expect(parsed.estimatedDurationDays).toBe(30);
    expect(parsed.rubricDefinitionId).toBe(RUBRIC_ID);
    expect(parsed.metadata).toEqual({ season: 'spring' });
  });

  it('rejects a lowercase project code', () => {
    expect(() =>
      createProjectDefinitionSchema.parse({ code: 'garden_build', name: 'x' }),
    ).toThrow();
  });

  it('rejects a non-positive estimated duration', () => {
    expect(() =>
      createProjectDefinitionSchema.parse({ code: 'GARDEN_BUILD', name: 'x', estimatedDurationDays: 0 }),
    ).toThrow();
  });

  it('validates a domain link', () => {
    const parsed = addProjectDefinitionDomainSchema.parse({ domainId: DOMAIN_ID });
    expect(parsed.domainId).toBe(DOMAIN_ID);
  });

  it('validates a competency link with defaults', () => {
    const parsed = addProjectDefinitionCompetencySchema.parse({ competencyId: COMPETENCY_ID });
    expect(parsed.required).toBe(true);
    expect(parsed.order).toBe(0);
  });

  it('validates a milestone with defaults', () => {
    const parsed = addProjectDefinitionMilestoneSchema.parse({
      code: 'SOIL_PREP',
      title: 'Preparar o solo',
    });
    expect(parsed.order).toBe(0);
    expect(parsed.description).toBeUndefined();
  });

  it('rejects a lowercase milestone code', () => {
    expect(() =>
      addProjectDefinitionMilestoneSchema.parse({ code: 'soil_prep', title: 'x' }),
    ).toThrow();
  });
});
