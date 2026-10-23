import { FamilyActivityService } from './family-activity.service.js';

describe('FamilyActivityService', () => {
  it('returns only approved, non-identifying metadata in the community catalog', async () => {
    const row = {
      id: '11111111-1111-4111-8111-111111111111',
      familyId: '22222222-2222-4222-8222-222222222222',
      name: 'Observação no jardim',
      description: 'Observe as folhas.',
      ageMin: 5,
      ageMax: 10,
      estimatedDurationMinutes: 30,
      supervisionRequired: true,
      riskLevel: 'LOW',
      evidenceRequirementMode: 'ANY',
      metadata: {
        theme: 'NATURE_STUDY',
        materials: ['Caderno'],
        steps: ['Observar'],
        familyId: '33333333-3333-4333-8333-333333333333',
        learnerId: '44444444-4444-4444-8444-444444444444',
        authorName: 'Pessoa Autora',
        origin: { sourceActivityId: '55555555-5555-4555-8555-555555555555' },
        privateNotes: 'Não publicar',
      },
      visibility: 'PUBLIC',
      createdAt: new Date('2026-10-16T00:00:00.000Z'),
      updatedAt: new Date('2026-10-16T00:00:00.000Z'),
    };
    const repository = { listPublic: jest.fn().mockResolvedValue([row]) };
    const service = new FamilyActivityService(repository as never);

    const [publicActivity] = await service.listPublic();

    expect(publicActivity).toMatchObject({
      id: row.id,
      metadata: {
        theme: 'NATURE_STUDY',
        materials: ['Caderno'],
        steps: ['Observar'],
      },
    });
    expect(publicActivity?.metadata).not.toHaveProperty('familyId');
    expect(publicActivity?.metadata).not.toHaveProperty('learnerId');
    expect(publicActivity?.metadata).not.toHaveProperty('authorName');
    expect(publicActivity?.metadata).not.toHaveProperty('origin');
    expect(publicActivity?.metadata).not.toHaveProperty('privateNotes');
    expect(publicActivity).not.toHaveProperty('familyId');
  });
});
