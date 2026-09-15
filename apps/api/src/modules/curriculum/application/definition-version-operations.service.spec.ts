import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DefinitionVersionOperationsService } from './definition-version-operations.service.js';

// Mocked-Prisma unit tests for the two explicit Definition/Version
// operations (issue #96 section 24). Real-Postgres behavior (unique
// constraint collisions, transactional atomicity, achievement immutability)
// is covered by test/definition-version-operations.integration-spec.ts.
describe('DefinitionVersionOperationsService', () => {
  const actorId = '00000000-0000-4000-8000-0000000000aa';

  function makeService(overrides: {
    competencyDefinition?: Record<string, unknown>;
    learningDomain?: Record<string, unknown>;
    learnerCompetencyTracking?: Record<string, unknown>;
    definitionVersionOperationLog?: Record<string, unknown>;
  } = {}) {
    const txCreate = jest.fn().mockResolvedValue({ id: 'log-1' });
    const prisma: any = {
      competencyDefinition: {
        findFirst: jest.fn(),
        update: jest.fn(),
        ...overrides.competencyDefinition,
      },
      learningDomain: {
        findFirst: jest.fn(),
        update: jest.fn(),
        ...overrides.learningDomain,
      },
      learnerCompetencyTracking: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        ...overrides.learnerCompetencyTracking,
      },
      definitionVersionOperationLog: {
        create: txCreate,
        findMany: jest.fn().mockResolvedValue([]),
        ...overrides.definitionVersionOperationLog,
      },
    };
    prisma.$transaction = jest.fn(async (cb: (tx: unknown) => unknown) => cb(prisma));
    return { service: new DefinitionVersionOperationsService(prisma as never), prisma, txCreate };
  }

  describe('rollbackDefinitionVersion', () => {
    it('deprecates a PUBLISHED version and reports the next-highest PUBLISHED version as newCurrent', async () => {
      const { service, prisma } = makeService({
        competencyDefinition: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce({ id: 'v2', code: 'MATH.ADD', version: 2, status: 'PUBLISHED' })
            .mockResolvedValueOnce({ id: 'v1', code: 'MATH.ADD', version: 1, status: 'PUBLISHED' }),
          update: jest.fn().mockResolvedValue({ id: 'v2', code: 'MATH.ADD', version: 2, status: 'DEPRECATED' }),
        },
      });

      const result = await service.rollbackDefinitionVersion('CompetencyDefinition', 'MATH.ADD', 2, actorId, 'bad content');

      expect(prisma.competencyDefinition.update).toHaveBeenCalledWith({
        where: { id: 'v2' },
        data: expect.objectContaining({ status: 'DEPRECATED' }),
      });
      expect(result).toEqual({
        entityType: 'CompetencyDefinition',
        code: 'MATH.ADD',
        rolledBackVersion: 2,
        newCurrentVersion: 1,
        logId: 'log-1',
      });
    });

    it('reports null newCurrent when no other PUBLISHED version exists', async () => {
      const { service } = makeService({
        competencyDefinition: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce({ id: 'v1', code: 'MATH.ADD', version: 1, status: 'PUBLISHED' })
            .mockResolvedValueOnce(null),
          update: jest.fn().mockResolvedValue({ id: 'v1', code: 'MATH.ADD', version: 1, status: 'DEPRECATED' }),
        },
      });

      const result = await service.rollbackDefinitionVersion('CompetencyDefinition', 'MATH.ADD', 1, actorId);
      expect(result.newCurrentVersion).toBeNull();
    });

    it('rejects rolling back a version that is not PUBLISHED', async () => {
      const { service } = makeService({
        competencyDefinition: {
          findFirst: jest.fn().mockResolvedValue({ id: 'v1', code: 'MATH.ADD', version: 1, status: 'DRAFT' }),
        },
      });

      await expect(service.rollbackDefinitionVersion('CompetencyDefinition', 'MATH.ADD', 1, actorId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an unknown code/version', async () => {
      const { service } = makeService({
        competencyDefinition: { findFirst: jest.fn().mockResolvedValue(null) },
      });

      await expect(service.rollbackDefinitionVersion('CompetencyDefinition', 'MATH.ADD', 99, actorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('works for a different Definition/Version entity type (LearningDomain)', async () => {
      const { service, prisma } = makeService({
        learningDomain: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce({ id: 'd2', code: 'MATH', version: 2, status: 'PUBLISHED' })
            .mockResolvedValueOnce(null),
          update: jest.fn().mockResolvedValue({ id: 'd2', code: 'MATH', version: 2, status: 'DEPRECATED' }),
        },
      });

      const result = await service.rollbackDefinitionVersion('LearningDomain', 'MATH', 2, actorId);
      expect(prisma.learningDomain.update).toHaveBeenCalled();
      expect(result.entityType).toBe('LearningDomain');
    });
  });

  describe('migrateCompetencyTrackingReferences', () => {
    const fromDef = { id: 'from-id', code: 'MATH.ADD', version: 1, status: 'DEPRECATED', schemaVersion: '1.0.0' };
    const toDef = { id: 'to-id', code: 'MATH.ADD', version: 2, status: 'PUBLISHED', schemaVersion: '1.2.0' };

    it('migrates only trackings explicitly selected and actually pointing at fromVersion', async () => {
      const { service, prisma } = makeService({
        competencyDefinition: {
          findFirst: jest.fn().mockResolvedValueOnce(fromDef).mockResolvedValueOnce(toDef),
        },
        learnerCompetencyTracking: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'track-1', learnerId: 'learner-1', competencyDefinitionId: 'from-id', competencyVersion: 1 },
            // Not actually pointing at fromVersion -- caller selected it, but it should be skipped.
            { id: 'track-2', learnerId: 'learner-2', competencyDefinitionId: 'other-id', competencyVersion: 5 },
          ]),
          findFirst: jest.fn().mockResolvedValue(null), // no collision
          update: jest.fn(),
        },
      });

      const result = await service.migrateCompetencyTrackingReferences(
        'MATH.ADD',
        1,
        2,
        ['track-1', 'track-2', 'track-missing'],
        actorId,
      );

      expect(prisma.learnerCompetencyTracking.update).toHaveBeenCalledTimes(1);
      expect(prisma.learnerCompetencyTracking.update).toHaveBeenCalledWith({
        where: { id: 'track-1' },
        data: { competencyDefinitionId: 'to-id', competencyVersion: 2 },
      });
      expect(result.migratedTrackingIds).toEqual(['track-1']);
      expect(result.skippedTrackingIds.sort()).toEqual(['track-2', 'track-missing'].sort());
      expect(result.logId).toBe('log-1');
    });

    it('skips a tracking whose target-version collision already exists', async () => {
      const { service, prisma } = makeService({
        competencyDefinition: {
          findFirst: jest.fn().mockResolvedValueOnce(fromDef).mockResolvedValueOnce(toDef),
        },
        learnerCompetencyTracking: {
          findMany: jest
            .fn()
            .mockResolvedValue([{ id: 'track-1', learnerId: 'learner-1', competencyDefinitionId: 'from-id', competencyVersion: 1 }]),
          findFirst: jest.fn().mockResolvedValue({ id: 'existing-track-for-v2' }),
          update: jest.fn(),
        },
      });

      const result = await service.migrateCompetencyTrackingReferences('MATH.ADD', 1, 2, ['track-1'], actorId);

      expect(prisma.learnerCompetencyTracking.update).not.toHaveBeenCalled();
      expect(result.migratedTrackingIds).toEqual([]);
      expect(result.skippedTrackingIds).toEqual(['track-1']);
    });

    it('rejects when fromVersion equals toVersion', async () => {
      const { service } = makeService();
      await expect(
        service.migrateCompetencyTrackingReferences('MATH.ADD', 1, 1, ['track-1'], actorId),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an unknown fromVersion or toVersion', async () => {
      const { service } = makeService({
        competencyDefinition: { findFirst: jest.fn().mockResolvedValue(null) },
      });
      await expect(
        service.migrateCompetencyTrackingReferences('MATH.ADD', 1, 2, ['track-1'], actorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects migrating onto an ARCHIVED target version', async () => {
      const { service } = makeService({
        competencyDefinition: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce(fromDef)
            .mockResolvedValueOnce({ ...toDef, status: 'ARCHIVED' }),
        },
      });
      await expect(
        service.migrateCompetencyTrackingReferences('MATH.ADD', 1, 2, ['track-1'], actorId),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when schema_version major is not compatible', async () => {
      const { service } = makeService({
        competencyDefinition: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce(fromDef)
            .mockResolvedValueOnce({ ...toDef, schemaVersion: '2.0.0' }),
        },
      });
      await expect(
        service.migrateCompetencyTrackingReferences('MATH.ADD', 1, 2, ['track-1'], actorId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
