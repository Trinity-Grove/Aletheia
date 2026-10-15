import { describe, expect, it } from 'vitest';
import {
  adoptFamilyLearningResourceSchema,
  communityLearningResourceResponseSchema,
  createFamilyLearningResourceSchema,
} from './family-learning-resource.js';

const id = '11111111-1111-4111-8111-111111111111';

describe('family learning resource contracts', () => {
  it.each([
    ['MATERIAL', {
      kind: 'MATERIAL',
      items: [{ type: 'TEXT', title: 'Cartões de leitura', value: 'Use cartões com palavras simples.' }],
    }],
    ['LESSON_PLAN', {
      kind: 'LESSON_PLAN',
      objective: 'Reconhecer padrões na natureza.',
      durationMinutes: 45,
      materials: ['Caderno', 'Lupa'],
      steps: [{ title: 'Observar', description: 'Faça uma caminhada curta.', minutes: 20 }],
    }],
    ['CHRONOGRAM', {
      kind: 'CHRONOGRAM',
      cadence: 'WEEKLY',
      slots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '10:00', title: 'Leitura' }],
    }],
  ])('accepts %s resources', (resourceType, content) => {
    const result = createFamilyLearningResourceSchema.parse({
      resourceType,
      title: 'Recurso de teste',
      description: 'Descrição simples',
      content,
    });

    expect(result.visibility).toBe('PRIVATE');
    expect(result.resourceType).toBe(resourceType);
  });

  it('rejects content whose discriminant does not match the resource type', () => {
    expect(() => createFamilyLearningResourceSchema.parse({
      resourceType: 'MATERIAL',
      title: 'Plano inválido',
      content: { kind: 'LESSON_PLAN', objective: 'x', durationMinutes: 20, materials: [], steps: [] },
    })).toThrow();
  });

  it('rejects unsafe links and private identifiers', () => {
    expect(() => createFamilyLearningResourceSchema.parse({
      resourceType: 'MATERIAL',
      title: 'Links',
      content: {
        kind: 'MATERIAL',
        items: [{ type: 'LINK', title: 'Executável', value: 'javascript:alert(1)' }],
      },
    })).toThrow();

    expect(() => communityLearningResourceResponseSchema.parse({
      id,
      familyId: id,
      resourceType: 'MATERIAL',
      title: 'Não pode expor família',
      description: null,
      subject: null,
      ageMin: null,
      ageMax: null,
      content: { kind: 'MATERIAL', items: [] },
      visibility: 'PUBLIC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })).toThrow();
  });

  it('validates adoption by source resource id', () => {
    expect(adoptFamilyLearningResourceSchema.parse({ sourceResourceId: id })).toEqual({
      sourceResourceId: id,
    });
  });
});
