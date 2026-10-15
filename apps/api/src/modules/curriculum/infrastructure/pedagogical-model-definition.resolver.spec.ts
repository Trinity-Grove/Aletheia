import { PedagogicalModelDefinitionResolver } from './pedagogical-model-definition.resolver.js';

describe('PedagogicalModelDefinitionResolver', () => {
  it('returns discovery metadata while preserving subjects from JSONB', async () => {
    const prisma = {
      pedagogicalModelDefinition: {
        findMany: jest.fn().mockResolvedValue([
          {
            code: 'CHARLOTTE_MASON',
            version: 2,
            status: 'PUBLISHED',
            name: 'Charlotte Mason',
            description: 'Livros vivos e narração.',
            metadata: {
              subjects: [
                {
                  name: 'Natureza',
                  color: '#16A34A',
                  description: 'Estudo do mundo criado.',
                  starterObjectives: ['Observar uma espécie local'],
                },
              ],
              approach: 'CHARLOTTE_MASON',
              recommendedAgeRange: { min: 6, max: 18 },
              educationalStages: ['PRIMARY', 'LOWER_SECONDARY', 'UPPER_SECONDARY'],
              principles: ['Autonomia'],
              preferredActivityTypes: ['NATURE.STUDY'],
              assessmentTypeWeights: { NARRATION: 0.7, PORTFOLIO: 0.3 },
              preferredDurationMinutes: { min: 30, max: 60 },
              recommendationHints: ['Começar com observação direta'],
            },
          },
        ]),
      },
    };
    const resolver = new PedagogicalModelDefinitionResolver(prisma as never);

    await expect(resolver.listPublishedCatalog()).resolves.toEqual([
      expect.objectContaining({
        code: 'CHARLOTTE_MASON',
        approach: 'CHARLOTTE_MASON',
        recommendedAgeRange: { min: 6, max: 18 },
        educationalStages: ['PRIMARY', 'LOWER_SECONDARY', 'UPPER_SECONDARY'],
        subjects: [expect.objectContaining({ name: 'Natureza' })],
        principles: ['Autonomia'],
        preferredActivityTypes: ['NATURE.STUDY'],
        assessmentTypeWeights: { NARRATION: 0.7, PORTFOLIO: 0.3 },
        preferredDurationMinutes: { min: 30, max: 60 },
        recommendationHints: ['Começar com observação direta'],
      }),
    ]);
  });
});
