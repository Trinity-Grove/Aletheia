import { PrismaService } from '../../../platform/database/prisma.service.js';
import { JurisdictionDefinitionSeeder } from './jurisdiction-definition.seeder.js';
import { BRAZIL_JURISDICTION_SEED } from './brazil-jurisdiction.seed-data.js';

describe('JurisdictionDefinitionSeeder', () => {
  it('seeds exactly the Brasil (BR) row on a first run', async () => {
    const upsert = jest.fn().mockResolvedValue({});
    const prisma = { jurisdictionDefinition: { upsert } } as unknown as PrismaService;
    const seeder = new JurisdictionDefinitionSeeder(prisma);

    const count = await seeder.seed();

    expect(count).toBe(1);
    expect(upsert).toHaveBeenCalledTimes(1);
    const call = upsert.mock.calls[0][0];
    expect(call.where).toEqual({ code_version: { code: 'BR', version: 1 } });
    expect(call.create.code).toBe('BR');
    expect(call.create.status).toBe('PUBLISHED');
    expect(call.create.metadata).toEqual(BRAZIL_JURISDICTION_SEED.metadata);
    // Never mutates an existing row -- update is a no-op object.
    expect(call.update).toEqual({});
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

      expect(await seeder.seed()).toBe(1);
      await seeder.seed();

      expect(persisted).toEqual(original);
    },
  );
});
