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
  function buildService(
    repoOverrides: Partial<JurisdictionDefinitionsRepository> = {},
    prismaOverride?: any,
  ) {
    const repository = {
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findCurrentPublishedByCode: jest.fn(),
      updateStatus: jest.fn(),
      ...repoOverrides,
    } as unknown as JurisdictionDefinitionsRepository;
    return { service: new JurisdictionDefinitionsService(repository, prismaOverride), repository };
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

  describe('getFamilyJurisdiction', () => {
    it('returns published BR jurisdiction with instructional thresholds and sources when family has default settings', async () => {
      const publishedRow = buildRow({
        code: 'BR',
        name: 'Brasil',
        version: 1,
        status: 'PUBLISHED',
        metadata: {
          minInstructionalDays: 200,
          minInstructionalHours: 800,
          privacyProfile: 'GDPR_LIKE',
          confidenceLevel: 'CONTESTED',
          officialSource: 'LDB Lei 9.394/1996, Art. 24, I',
          legalBasisNotes: 'Liberdade constitucional da família na condução pedagógica.',
        },
      });
      const { service, repository } = buildService({
        findCurrentPublishedByCode: jest.fn().mockResolvedValue(publishedRow),
      });

      const result = await service.getFamilyJurisdiction('fam_123');

      expect(repository.findCurrentPublishedByCode).toHaveBeenCalledWith('BR');
      expect(result).toEqual({
        code: 'BR',
        name: 'Brasil',
        version: 1,
        privacyProfile: 'GDPR_LIKE',
        confidenceLevel: 'CONTESTED',
        minInstructionalDays: 200,
        minInstructionalHours: 800,
        officialSource: 'LDB Lei 9.394/1996, Art. 24, I',
        legalBasisSummary: 'Liberdade constitucional da família na condução pedagógica.',
      });
    });

    it('returns safe national fallback when no definition is found in DB', async () => {
      const { service, repository } = buildService({
        findCurrentPublishedByCode: jest.fn().mockResolvedValue(null),
      });

      const result = await service.getFamilyJurisdiction('fam_123');

      expect(repository.findCurrentPublishedByCode).toHaveBeenCalledWith('BR');
      expect(result).toEqual({
        code: 'BR',
        name: 'Brasil (Referencial Nacional)',
        version: 1,
        privacyProfile: 'GDPR_LIKE',
        confidenceLevel: 'ESTABLISHED',
        minInstructionalDays: 200,
        minInstructionalHours: 800,
        officialSource:
          'Lei de Diretrizes e Bases da Educação Nacional (Lei 9.394/1996) e Jurisprudência do STF (RE 888.815)',
        legalBasisSummary:
          'Liberdade constitucional da família na condução pedagógica e dever de comprovação de instrução regular.',
      });
    });

    it('resolves jurisdiction from family compliance requirement when present', async () => {
      const publishedRow = buildRow({
        code: 'US-FL',
        name: 'United States - Florida',
        version: 1,
        status: 'PUBLISHED',
        metadata: {
          minInstructionalDays: 180,
          minInstructionalHours: 720,
          confidenceLevel: 'ESTABLISHED',
          officialSource: 'Florida Statutes 1002.41',
          legalBasisNotes: 'Annual educational evaluation required.',
        },
      });
      const prismaMock = {
        complianceRequirement: {
          findFirst: jest.fn().mockResolvedValue({ jurisdiction: 'US-FL', jurisdictionDefinitionId: null }),
        },
        family: {
          findUnique: jest.fn(),
        },
      };
      const { service, repository } = buildService(
        {
          findCurrentPublishedByCode: jest.fn().mockResolvedValue(publishedRow),
        },
        prismaMock,
      );

      const validFamilyUuid = 'a0000000-0000-4000-8000-000000000001';
      const result = await service.getFamilyJurisdiction(validFamilyUuid);

      expect(repository.findCurrentPublishedByCode).toHaveBeenCalledWith('US-FL');
      expect(result.code).toBe('US-FL');
      expect(result.minInstructionalDays).toBe(180);
      expect(result.minInstructionalHours).toBe(720);
    });

    it('resolves pinned jurisdiction by definition ID when compliance requirement specifies it', async () => {
      const pinnedRow = buildRow({
        id: 'pinned-id-1',
        code: 'BR',
        name: 'Brasil Histórico',
        version: 1,
        status: 'PUBLISHED',
        metadata: {
          minInstructionalDays: 200,
          minInstructionalHours: 800,
          confidenceLevel: 'ESTABLISHED',
        },
      });
      const prismaMock = {
        complianceRequirement: {
          findFirst: jest.fn().mockResolvedValue({ jurisdiction: 'BR', jurisdictionDefinitionId: 'pinned-id-1' }),
        },
      };
      const { service, repository } = buildService(
        {
          findById: jest.fn().mockResolvedValue(pinnedRow),
        },
        prismaMock,
      );

      const validFamilyUuid = 'a0000000-0000-4000-8000-000000000001';
      const result = await service.getFamilyJurisdiction(validFamilyUuid);

      expect(repository.findById).toHaveBeenCalledWith('pinned-id-1');
      expect(result.code).toBe('BR');
      expect(result.name).toBe('Brasil Histórico');
    });

    it('normalizes ISO alpha-3 countryCode BRA to BR when resolving family jurisdiction', async () => {
      const publishedRow = buildRow({
        code: 'BR',
        name: 'Brasil',
        version: 1,
        status: 'PUBLISHED',
      });
      const prismaMock = {
        complianceRequirement: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        family: {
          findUnique: jest.fn().mockResolvedValue({ countryCode: 'BRA' }),
        },
      };
      const { service, repository } = buildService(
        {
          findCurrentPublishedByCode: jest.fn().mockResolvedValue(publishedRow),
        },
        prismaMock,
      );

      const validFamilyUuid = 'a0000000-0000-4000-8000-000000000001';
      const result = await service.getFamilyJurisdiction(validFamilyUuid);

      expect(prismaMock.family.findUnique).toHaveBeenCalledWith({
        where: { id: validFamilyUuid },
        select: { countryCode: true },
      });
      expect(repository.findCurrentPublishedByCode).toHaveBeenCalledWith('BR');
      expect(result.code).toBe('BR');
    });
  });
});

