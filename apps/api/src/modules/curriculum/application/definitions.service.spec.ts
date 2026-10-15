import { NotFoundException } from '@nestjs/common';
import type { ActivityDefinition, LearningDomain } from '@prisma/client';
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

function activityDefinition(overrides: Partial<ActivityDefinition> = {}): ActivityDefinition {
  return {
    id: '9c5d2e6a-4b7c-4a2a-9d43-5e4c1f3b8a11',
    code: 'TEST.ACTIVITY',
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: '1.0.0',
    name: 'Test activity',
    description: 'A searchable activity',
    ageMin: 8,
    ageMax: 12,
    estimatedDurationMinutes: 30,
    supervisionRequired: false,
    riskLevel: null,
    evidenceRequirementMode: 'ANY',
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

describe('DefinitionsService activity definition search', () => {
  it('passes all validated filters to the repository and maps the result', async () => {
    const activity = activityDefinition();
    const repository = {
      listActivityDefinitions: jest.fn().mockResolvedValue([activity]),
    };
    const service = new DefinitionsService(repository as never, {} as never);

    const result = await service.listActivityDefinitions({ q: 'SEARCH', status: 'PUBLISHED', age: 10 });

    expect(repository.listActivityDefinitions).toHaveBeenCalledWith({
      q: 'SEARCH',
      status: 'PUBLISHED',
      age: 10,
    });
    expect(result[0]).toMatchObject({ id: activity.id, code: activity.code, name: activity.name });
  });

  it('keeps the existing full-list call when no filters are supplied', async () => {
    const repository = { listActivityDefinitions: jest.fn().mockResolvedValue([]) };
    const service = new DefinitionsService(repository as never, {} as never);

    await service.listActivityDefinitions();

    expect(repository.listActivityDefinitions).toHaveBeenCalledWith({});
  });
});
