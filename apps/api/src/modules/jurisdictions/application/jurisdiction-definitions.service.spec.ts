import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JurisdictionDefinitionsService } from './jurisdiction-definitions.service.js';
import type { JurisdictionDefinitionsRepository } from '../infrastructure/jurisdiction-definitions.repository.js';

function buildRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'jd-1',
    code: 'BR',
    version: 1,
    status: 'DRAFT',
    schemaVersion: '1.0.0',
    name: 'Brasil',
    description: null,
    metadata: {},
    createdAt: new Date('2026-09-15T00:00:00Z'),
    publishedAt: null,
    deprecatedAt: null,
    ...overrides,
  };
}

describe('JurisdictionDefinitionsService', () => {
  function buildService(repoOverrides: Partial<JurisdictionDefinitionsRepository> = {}) {
    const repository = {
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findCurrentPublishedByCode: jest.fn(),
      updateStatus: jest.fn(),
      ...repoOverrides,
    } as unknown as JurisdictionDefinitionsRepository;
    return { service: new JurisdictionDefinitionsService(repository), repository };
  }

  it('creates a jurisdiction definition and maps it to a response DTO', async () => {
    const row = buildRow();
    const { service, repository } = buildService({ create: jest.fn().mockResolvedValue(row) });

    const result = await service.create({
      code: 'BR',
      version: 1,
      status: 'DRAFT',
      schemaVersion: '1.0.0',
      name: 'Brasil',
      metadata: {},
    } as any);

    expect(repository.create).toHaveBeenCalled();
    expect(result).toEqual({
      id: 'jd-1',
      code: 'BR',
      version: 1,
      status: 'DRAFT',
      schemaVersion: '1.0.0',
      name: 'Brasil',
      description: null,
      metadata: {},
      createdAt: '2026-09-15T00:00:00.000Z',
      publishedAt: null,
      deprecatedAt: null,
    });
  });

  it('maps a duplicate code/version write into a 400, not a raw Prisma error', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: '6.19.3',
    });
    const { service } = buildService({ create: jest.fn().mockRejectedValue(prismaError) });

    await expect(
      service.create({ code: 'BR', version: 1, status: 'DRAFT', schemaVersion: '1.0.0', name: 'Brasil', metadata: {} } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('lists jurisdiction definitions', async () => {
    const { service, repository } = buildService({ list: jest.fn().mockResolvedValue([buildRow()]) });
    const result = await service.list();
    expect(repository.list).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('finds by code, e.g. resolving every version of BR', async () => {
    const { service, repository } = buildService({
      findByCode: jest.fn().mockResolvedValue([buildRow({ version: 2 }), buildRow({ version: 1 })]),
    });
    const result = await service.findByCode('BR');
    expect(repository.findByCode).toHaveBeenCalledWith('BR');
    expect(result.map((r) => r.version)).toEqual([2, 1]);
  });

  it('throws NotFoundException transitioning a non-existent id', async () => {
    const { service } = buildService({ findById: jest.fn().mockResolvedValue(null) });
    await expect(service.transitionStatus('missing', 'PUBLISHED')).rejects.toThrow(NotFoundException);
  });

  it('publishes a DRAFT definition, stamping publishedAt', async () => {
    const existing = buildRow({ status: 'DRAFT' });
    const published = buildRow({ status: 'PUBLISHED', publishedAt: new Date('2026-09-15T01:00:00Z') });
    const { service, repository } = buildService({
      findById: jest.fn().mockResolvedValue(existing),
      updateStatus: jest.fn().mockResolvedValue(published),
    });

    const result = await service.transitionStatus('jd-1', 'PUBLISHED');

    expect(repository.updateStatus).toHaveBeenCalledWith(
      'jd-1',
      expect.objectContaining({ status: 'PUBLISHED', publishedAt: expect.any(Date) }),
    );
    expect(result.status).toBe('PUBLISHED');
    expect(result.publishedAt).not.toBeNull();
  });

  it('rejects an invalid transition (e.g. ARCHIVED -> PUBLISHED)', async () => {
    const existing = buildRow({ status: 'ARCHIVED' });
    const { service } = buildService({ findById: jest.fn().mockResolvedValue(existing) });

    await expect(service.transitionStatus('jd-1', 'PUBLISHED')).rejects.toThrow(BadRequestException);
  });
});
