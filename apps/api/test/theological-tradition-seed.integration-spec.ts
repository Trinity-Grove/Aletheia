import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { TheologicalTraditionCatalogResolver } from '../src/modules/curriculum/infrastructure/theological-tradition-catalog.resolver.js';
import { TheologicalTraditionSeeder } from '../src/modules/curriculum/infrastructure/theological-tradition.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';

describe('Theological tradition seeding and catalog resolver (real Postgres)', () => {
  let app: NestFastifyApplication;
  let resolver: TheologicalTraditionCatalogResolver;
  let seeder: TheologicalTraditionSeeder;
  let prisma: PrismaService;

  const EXPECTED_CODES = [
    'ANGLICAN',
    'BAPTIST',
    'CONGREGATIONAL',
    'DISPENSATIONAL',
    'LUTHERAN',
    'METHODIST_WESLEYAN',
    'NON_DENOMINATIONAL',
    'PENTECOSTAL',
    'REFORMED_PRESBYTERIAN',
  ];

  beforeAll(async () => {
    app = await createApplication();
    await app.init();

    resolver = app.get(TheologicalTraditionCatalogResolver);
    seeder = app.get(TheologicalTraditionSeeder);
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('seeds all 9 baseline historical traditions into PostgreSQL', async () => {
    const seededCount = await seeder.seed();
    expect(seededCount).toBe(9);

    const rows = await prisma.theologicalTraditionDefinition.findMany({
      where: { code: { in: EXPECTED_CODES }, version: 1 },
      orderBy: { code: 'asc' },
    });

    expect(rows).toHaveLength(9);
    for (const row of rows) {
      expect(row.status).toBe('PUBLISHED');
      expect(row.name).toBeTruthy();
      expect(row.description).toBeTruthy();
      expect(row.publishedAt).toBeInstanceOf(Date);
    }
  });

  it('is idempotent on subsequent seed executions and preserves existing rows', async () => {
    const beforeRows = await prisma.theologicalTraditionDefinition.findMany({
      where: { code: { in: EXPECTED_CODES }, version: 1 },
      orderBy: { code: 'asc' },
    });

    const secondCount = await seeder.seed();
    expect(secondCount).toBe(9);

    const afterRows = await prisma.theologicalTraditionDefinition.findMany({
      where: { code: { in: EXPECTED_CODES }, version: 1 },
      orderBy: { code: 'asc' },
    });

    expect(afterRows).toEqual(beforeRows);
  });

  describe('TheologicalTraditionCatalogResolver.listPublishedCatalog', () => {
    it('returns all 9 historical traditions with code, name, and description', async () => {
      const catalog = await resolver.listPublishedCatalog();
      const codes = catalog.map((entry) => entry.code).sort();

      for (const expected of EXPECTED_CODES) {
        expect(codes).toContain(expected);
      }

      for (const entry of catalog) {
        expect(entry.code).toBeTruthy();
        expect(entry.name).toBeTruthy();
        expect(entry.description).toBeTruthy();
      }
    });

    it('returns only the latest published version per tradition code and excludes drafts', async () => {
      const testCode = `TEST_TRADITION_${Date.now()}`;
      await prisma.theologicalTraditionDefinition.create({
        data: {
          code: testCode,
          version: 1,
          status: 'PUBLISHED',
          name: 'Version 1 Test',
          description: 'V1',
          publishedAt: new Date(),
        },
      });
      await prisma.theologicalTraditionDefinition.create({
        data: {
          code: testCode,
          version: 2,
          status: 'PUBLISHED',
          name: 'Version 2 Test',
          description: 'V2',
          publishedAt: new Date(),
        },
      });

      const draftCode = `TEST_DRAFT_TRADITION_${Date.now()}`;
      await prisma.theologicalTraditionDefinition.create({
        data: {
          code: draftCode,
          version: 1,
          status: 'DRAFT',
          name: 'Draft Tradition',
          description: 'Draft',
        },
      });

      const catalog = await resolver.listPublishedCatalog();

      const matching = catalog.filter((entry) => entry.code === testCode);
      expect(matching).toHaveLength(1);
      expect(matching[0]?.name).toBe('Version 2 Test');

      const draftMatch = catalog.find((entry) => entry.code === draftCode);
      expect(draftMatch).toBeUndefined();

      // Clean up test rows
      await prisma.theologicalTraditionDefinition.deleteMany({
        where: { code: { in: [testCode, draftCode] } },
      });
    });
  });
});
