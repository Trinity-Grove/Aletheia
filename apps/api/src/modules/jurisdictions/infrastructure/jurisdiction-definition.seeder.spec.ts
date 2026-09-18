import { PrismaService } from '../../../platform/database/prisma.service.js';
import { JurisdictionDefinitionSeeder } from './jurisdiction-definition.seeder.js';
import { BRAZIL_JURISDICTION_SEED } from './brazil-jurisdiction.seed-data.js';
import { URUGUAY_JURISDICTION_SEED } from './uruguay-jurisdiction.seed-data.js';
import { US_TEXAS_JURISDICTION_SEED } from './us-texas-jurisdiction.seed-data.js';
import { US_FLORIDA_JURISDICTION_SEED } from './us-florida-jurisdiction.seed-data.js';

describe('JurisdictionDefinitionSeeder', () => {
  it('seeds baseline rows for BR, UY, US-TX, and US-FL on first run', async () => {
    const upsert = jest.fn().mockResolvedValue({});
    const prisma = { jurisdictionDefinition: { upsert } } as unknown as PrismaService;
    const seeder = new JurisdictionDefinitionSeeder(prisma);

    const count = await seeder.seed();

    expect(count).toBe(4);
    expect(upsert).toHaveBeenCalledTimes(4);

    const codes = upsert.mock.calls.map((c: any) => c[0].create.code);
    expect(codes).toEqual(['BR', 'UY', 'US-TX', 'US-FL']);

    const brCall = upsert.mock.calls[0][0];
    expect(brCall.where).toEqual({ code_version: { code: 'BR', version: 1 } });
    expect(brCall.create.code).toBe('BR');
    expect(brCall.create.status).toBe('PUBLISHED');
    expect(brCall.create.metadata).toEqual(BRAZIL_JURISDICTION_SEED.metadata);
    expect(brCall.update).toEqual({});

    const uyCall = upsert.mock.calls[1][0];
    expect(uyCall.where).toEqual({ code_version: { code: 'UY', version: 1 } });
    expect(uyCall.create.metadata).toEqual(URUGUAY_JURISDICTION_SEED.metadata);

    const txCall = upsert.mock.calls[2][0];
    expect(txCall.where).toEqual({ code_version: { code: 'US-TX', version: 1 } });
    expect(txCall.create.metadata).toEqual(US_TEXAS_JURISDICTION_SEED.metadata);

    const flCall = upsert.mock.calls[3][0];
    expect(flCall.where).toEqual({ code_version: { code: 'US-FL', version: 1 } });
    expect(flCall.create.metadata).toEqual(US_FLORIDA_JURISDICTION_SEED.metadata);
  });

  it.each(['PUBLISHED', 'DEPRECATED', 'ARCHIVED', 'DRAFT'])(
    'does not overwrite an existing %s version or its publication date (idempotent rerun)',
    async (status) => {
      const original = {
        code: 'BR',
        version: 1,
        status,
        name: 'Admin-edited name',
        description: 'Admin-edited description',
        metadata: { confidenceLevel: 'ESTABLISHED' },
        publishedAt: new Date('2026-01-01T00:00:00Z'),
      };
      const persisted = structuredClone(original);
      const upsert = jest.fn().mockImplementation(async ({ where, update, create }) => {
        if (where.code_version.code === original.code) {
          Object.assign(persisted, update);
          return persisted;
        }
        return create;
      });
      const prisma = { jurisdictionDefinition: { upsert } } as unknown as PrismaService;
      const seeder = new JurisdictionDefinitionSeeder(prisma);

      expect(await seeder.seed()).toBe(4);
      await seeder.seed();

      expect(persisted).toEqual(original);
    },
  );
});
