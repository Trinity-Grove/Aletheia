import { NotFoundException } from '@nestjs/common';
import type { LearningDomain } from '@prisma/client';
import { DefinitionsService } from './definitions.service.js';

function learningDomain(overrides: Partial<LearningDomain> = {}): LearningDomain {
  return {
    id: '9c5d2e6a-4b7c-4a2a-9d43-5e4c1f3b8a11',
    code: 'TEST.DOMAIN',
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: '1.0.0',
    name: 'Test domain',
    description: null,
    parentId: null,
    isActive: true,
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    deprecatedAt: null,
    ...overrides,
  };
}

describe('DefinitionsService learning domain activation', () => {
  it('updates activation without changing editorial status and records the audit field', async () => {
    const existing = learningDomain();
    const updated = learningDomain({ isActive: false });
    const repository = {
      findLearningDomainById: jest.fn().mockResolvedValue(existing),
      updateLearningDomainActivation: jest.fn().mockResolvedValue(updated),
    };
    const operationsService = { logUpdate: jest.fn().mockResolvedValue(undefined) };
    const service = new DefinitionsService(repository as never, operationsService as never);

    const result = await service.updateLearningDomainActivation(
      existing.id,
      { isActive: false },
      'admin-user-id',
    );

    expect(result.isActive).toBe(false);
    expect(result.status).toBe('PUBLISHED');
    expect(repository.updateLearningDomainActivation).toHaveBeenCalledWith(existing.id, false);
    expect(operationsService.logUpdate).toHaveBeenCalledWith(
      'LearningDomain',
      existing.code,
      existing.version,
      'admin-user-id',
      ['isActive'],
    );
  });

  it('rejects activation changes for an unknown domain', async () => {
    const repository = { findLearningDomainById: jest.fn().mockResolvedValue(null) };
    const operationsService = { logUpdate: jest.fn() };
    const service = new DefinitionsService(repository as never, operationsService as never);

    await expect(
      service.updateLearningDomainActivation(
        '00000000-0000-0000-0000-000000000000',
        { isActive: true },
        'admin-user-id',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(operationsService.logUpdate).not.toHaveBeenCalled();
  });
});
