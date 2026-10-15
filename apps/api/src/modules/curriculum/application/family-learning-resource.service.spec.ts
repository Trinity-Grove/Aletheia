import { NotFoundException } from '@nestjs/common';
import { FamilyLearningResourceService } from './family-learning-resource.service.js';

const row = {
  id: '11111111-1111-4111-8111-111111111111',
  familyId: '22222222-2222-4222-8222-222222222222',
  resourceType: 'MATERIAL',
  title: 'Cartões',
  description: 'Leitura',
  subject: 'Português',
  ageMin: 6,
  ageMax: 8,
  content: { kind: 'MATERIAL', items: [{ type: 'TEXT', title: 'Cartões', value: 'A' }] },
  visibility: 'PUBLIC',
  originResourceId: null,
  createdAt: new Date('2026-10-15T00:00:00.000Z'),
  updatedAt: new Date('2026-10-15T00:00:00.000Z'),
};

describe('FamilyLearningResourceService', () => {
  it('creates a resource with the family context and maps it to a DTO', async () => {
    const create = jest.fn().mockResolvedValue(row);
    const service = new FamilyLearningResourceService({ create } as never);

    const result = await service.create('22222222-2222-4222-8222-222222222222', {
      resourceType: 'MATERIAL',
      title: 'Cartões',
      description: 'Leitura',
      subject: 'Português',
      ageMin: 6,
      ageMax: 8,
      content: row.content as never,
      visibility: 'PUBLIC',
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      familyId: row.familyId,
      visibility: 'PUBLIC',
      content: row.content,
    }));
    expect(result).toMatchObject({ id: row.id, familyId: row.familyId, title: row.title });
  });

  it('removes family provenance from the community DTO', async () => {
    const service = new FamilyLearningResourceService({ listPublic: jest.fn().mockResolvedValue([row]) } as never);

    const [result] = await service.listPublic();

    expect(result).toMatchObject({ id: row.id, title: row.title, visibility: 'PUBLIC' });
    expect(result).not.toHaveProperty('familyId');
    expect(result).not.toHaveProperty('originResourceId');
  });

  it('rejects missing resources instead of revealing another family resource', async () => {
    const service = new FamilyLearningResourceService({ findByIdAndFamily: jest.fn().mockResolvedValue(null) } as never);

    await expect(service.get('22222222-2222-4222-8222-222222222222', row.id))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('adopts a public resource as a private copy', async () => {
    const copy = { ...row, id: '33333333-3333-4333-8333-333333333333', familyId: '44444444-4444-4444-8444-444444444444', visibility: 'PRIVATE' };
    const service = new FamilyLearningResourceService({ adoptPublic: jest.fn().mockResolvedValue(copy) } as never);

    const result = await service.adopt(copy.familyId, row.id);

    expect(result.visibility).toBe('PRIVATE');
    expect(result.familyId).toBe(copy.familyId);
  });
});
