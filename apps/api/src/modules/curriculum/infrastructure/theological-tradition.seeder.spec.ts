import { PrismaService } from '../../../platform/database/prisma.service.js';
import { TheologicalTraditionSeeder } from './theological-tradition.seeder.js';

describe('TheologicalTraditionSeeder', () => {
  it('seeds all 9 baseline theological traditions idempotently', async () => {
    const upserted: any[] = [];
    const upsert = jest.fn().mockImplementation(async (args) => {
      upserted.push(args);
      return args.create;
    });

    const prisma = {
      theologicalTraditionDefinition: { upsert },
    } as unknown as PrismaService;

    const seeder = new TheologicalTraditionSeeder(prisma);
    const count = await seeder.seed();

    expect(count).toBe(9);
    expect(upsert).toHaveBeenCalledTimes(9);

    for (const call of upserted) {
      expect(call.where).toEqual({
        code_version: {
          code: call.create.code,
          version: 1,
        },
      });
      expect(call.create.version).toBe(1);
      expect(call.create.status).toBe('PUBLISHED');
      expect(call.create.schemaVersion).toBe('1.0.0');
      expect(call.create.name).toBeTruthy();
      expect(call.create.description).toBeTruthy();
      expect(call.create.metadata).toBeDefined();
      expect(call.create.publishedAt).toBeInstanceOf(Date);
      expect(call.update).toEqual({});
    }
  });

  it.each(['PUBLISHED', 'DEPRECATED', 'ARCHIVED', 'DRAFT'])(
    'does not overwrite an existing %s version or its publication date',
    async (status) => {
      const original = {
        code: 'BAPTIST',
        version: 1,
        status,
        name: 'Custom Admin Name',
        description: 'Custom description',
        metadata: { custom: true },
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

      const prisma = {
        theologicalTraditionDefinition: { upsert },
      } as unknown as PrismaService;

      const seeder = new TheologicalTraditionSeeder(prisma);
      expect(await seeder.seed()).toBe(9);
      await seeder.seed();
      expect(persisted).toEqual(original);
    },
  );
});
