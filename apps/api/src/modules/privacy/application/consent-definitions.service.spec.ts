import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ConsentDefinition } from '@prisma/client';
import { ConsentDefinitionsService } from './consent-definitions.service.js';
import type { ConsentDefinitionsRepository } from '../infrastructure/consent-definitions.repository.js';

function buildRow(overrides: Partial<ConsentDefinition> = {}): ConsentDefinition {
  return {
    id: 'cd-1',
    code: 'TERMS_OF_SERVICE',
    version: 1,
    status: 'DRAFT',
    schemaVersion: 1,
    scope: 'FAMILY',
    mandatory: true,
    title: 'Terms of Service',
    description: 'Core terms of service',
    content: 'These are the terms of service content...',
    purposes: ['Account creation', 'Service usage'],
    metadata: { category: 'legal' },
    publishedAt: null,
    deprecatedAt: null,
    createdAt: new Date('2026-09-16T00:00:00Z'),
    updatedAt: new Date('2026-09-16T00:00:00Z'),
    ...overrides,
  } as ConsentDefinition;
}

describe('ConsentDefinitionsService', () => {
  function buildService(repoOverrides: Partial<ConsentDefinitionsRepository> = {}) {
    const repository = {
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findPublished: jest.fn(),
      updateStatus: jest.fn(),
      ...repoOverrides,
    } as unknown as ConsentDefinitionsRepository;
    return { service: new ConsentDefinitionsService(repository), repository };
  }

  describe('create', () => {
    it('creates a consent definition and maps it to a response DTO', async () => {
      const row = buildRow();
      const { service, repository } = buildService({ create: jest.fn().mockResolvedValue(row) });

      const dto = {
        code: 'TERMS_OF_SERVICE',
        version: 1,
        scope: 'FAMILY' as const,
        mandatory: true,
        title: 'Terms of Service',
        description: 'Core terms of service',
        content: 'These are the terms of service content...',
        purposes: ['Account creation', 'Service usage'],
        metadata: { category: 'legal' },
      };

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        id: 'cd-1',
        code: 'TERMS_OF_SERVICE',
        version: 1,
        status: 'DRAFT',
        schemaVersion: 1,
        scope: 'FAMILY',
        mandatory: true,
        title: 'Terms of Service',
        description: 'Core terms of service',
        content: 'These are the terms of service content...',
        purposes: ['Account creation', 'Service usage'],
        metadata: { category: 'legal' },
        publishedAt: null,
        deprecatedAt: null,
        createdAt: '2026-09-16T00:00:00.000Z',
        updatedAt: '2026-09-16T00:00:00.000Z',
      });
    });

    it('maps a duplicate code/version write into a 400 BadRequestException', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '6.19.3',
      });
      const { service } = buildService({ create: jest.fn().mockRejectedValue(prismaError) });

      await expect(
        service.create({
          code: 'TERMS_OF_SERVICE',
          title: 'Terms of Service',
          content: 'Content text goes here...',
          purposes: ['Account creation'],
        }),
      ).rejects.toThrow(new BadRequestException('This consent definition code/version already exists.'));
    });
  });

  describe('list', () => {
    it('lists consent definitions', async () => {
      const { service, repository } = buildService({ list: jest.fn().mockResolvedValue([buildRow()]) });
      const result = await service.list();
      expect(repository.list).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]!.code).toBe('TERMS_OF_SERVICE');
    });
  });

  describe('findById', () => {
    it('returns DTO when definition is found', async () => {
      const row = buildRow({ id: 'cd-123' });
      const { service, repository } = buildService({ findById: jest.fn().mockResolvedValue(row) });

      const result = await service.findById('cd-123');
      expect(repository.findById).toHaveBeenCalledWith('cd-123');
      expect(result.id).toBe('cd-123');
    });

    it('throws NotFoundException when definition does not exist', async () => {
      const { service, repository } = buildService({ findById: jest.fn().mockResolvedValue(null) });

      await expect(service.findById('missing-id')).rejects.toThrow(
        new NotFoundException('Consent definition not found.'),
      );
      expect(repository.findById).toHaveBeenCalledWith('missing-id');
    });
  });

  describe('findByCode', () => {
    it('finds definitions by code', async () => {
      const { service, repository } = buildService({
        findByCode: jest.fn().mockResolvedValue([buildRow({ version: 2 }), buildRow({ version: 1 })]),
      });

      const result = await service.findByCode('TERMS_OF_SERVICE');
      expect(repository.findByCode).toHaveBeenCalledWith('TERMS_OF_SERVICE');
      expect(result.map((r) => r.version)).toEqual([2, 1]);
    });
  });

  describe('getPublishedDefinitions', () => {
    it('returns published definitions without scope filter', async () => {
      const publishedRow = buildRow({ status: 'PUBLISHED', publishedAt: new Date('2026-09-16T01:00:00Z') });
      const { service, repository } = buildService({
        findPublished: jest.fn().mockResolvedValue([publishedRow]),
      });

      const result = await service.getPublishedDefinitions();
      expect(repository.findPublished).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(1);
      expect(result[0]!.status).toBe('PUBLISHED');
      expect(result[0]!.publishedAt).toBe('2026-09-16T01:00:00.000Z');
    });

    it('returns published definitions filtered by scope', async () => {
      const publishedRow = buildRow({
        status: 'PUBLISHED',
        scope: 'LEARNER',
        publishedAt: new Date('2026-09-16T01:00:00Z'),
      });
      const { service, repository } = buildService({
        findPublished: jest.fn().mockResolvedValue([publishedRow]),
      });

      const result = await service.getPublishedDefinitions('LEARNER');
      expect(repository.findPublished).toHaveBeenCalledWith('LEARNER');
      expect(result).toHaveLength(1);
      expect(result[0]!.scope).toBe('LEARNER');
    });
  });

  describe('transitionStatus', () => {
    it('throws NotFoundException transitioning a non-existent id', async () => {
      const { service } = buildService({ findById: jest.fn().mockResolvedValue(null) });
      await expect(service.transitionStatus('missing', 'PUBLISHED')).rejects.toThrow(
        new NotFoundException('Consent definition not found.'),
      );
    });

    it('publishes a DRAFT definition, stamping publishedAt', async () => {
      const existing = buildRow({ status: 'DRAFT' });
      const published = buildRow({ status: 'PUBLISHED', publishedAt: new Date('2026-09-16T01:00:00Z') });
      const { service, repository } = buildService({
        findById: jest.fn().mockResolvedValue(existing),
        updateStatus: jest.fn().mockResolvedValue(published),
      });

      const result = await service.transitionStatus('cd-1', 'PUBLISHED');

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'cd-1',
        expect.objectContaining({ status: 'PUBLISHED', publishedAt: expect.any(Date) }),
      );
      expect(result.status).toBe('PUBLISHED');
      expect(result.publishedAt).toBe('2026-09-16T01:00:00.000Z');
    });

    it('deprecates a PUBLISHED definition, stamping deprecatedAt', async () => {
      const existing = buildRow({ status: 'PUBLISHED', publishedAt: new Date('2026-09-16T01:00:00Z') });
      const deprecated = buildRow({
        status: 'DEPRECATED',
        publishedAt: new Date('2026-09-16T01:00:00Z'),
        deprecatedAt: new Date('2026-09-16T02:00:00Z'),
      });
      const { service, repository } = buildService({
        findById: jest.fn().mockResolvedValue(existing),
        updateStatus: jest.fn().mockResolvedValue(deprecated),
      });

      const result = await service.transitionStatus('cd-1', 'DEPRECATED');

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'cd-1',
        expect.objectContaining({ status: 'DEPRECATED', deprecatedAt: expect.any(Date) }),
      );
      expect(result.status).toBe('DEPRECATED');
      expect(result.deprecatedAt).toBe('2026-09-16T02:00:00.000Z');
    });

    it('rejects an invalid transition (e.g. ARCHIVED -> PUBLISHED)', async () => {
      const existing = buildRow({ status: 'ARCHIVED' });
      const { service } = buildService({ findById: jest.fn().mockResolvedValue(existing) });

      await expect(service.transitionStatus('cd-1', 'PUBLISHED')).rejects.toThrow(BadRequestException);
    });
  });
});
