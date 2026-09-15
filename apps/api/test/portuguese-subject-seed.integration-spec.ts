import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { PortugueseSubjectSeeder } from '../src/modules/curriculum/infrastructure/portuguese-subject.seeder.js';
import { buildPortugueseSubjectSeedData } from '../src/modules/curriculum/infrastructure/portuguese-subject.seed-data.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';

describe('PortugueseSubjectSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildPortugueseSubjectSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes every grade-band path and its competencies, then is idempotent', async () => {
    const seeder = app.get(PortugueseSubjectSeeder);
    await seeder.seed();
    const secondRun = await seeder.seed();
    expect(secondRun).toEqual({ domainCreated: false, pathsCreated: 0, competenciesCreated: 0 });

    const domains = await prisma.learningDomain.findMany({ where: { code: seedData.domain.code } });
    expect(domains).toHaveLength(1);
    const domain = domains[0]!;
    expect(domain.status).toBe('PUBLISHED');

    for (const pathData of seedData.paths) {
      const paths = await prisma.learningPath.findMany({ where: { code: pathData.path.code } });
      expect(paths).toHaveLength(1);
      const path = paths[0]!;
      expect(path.status).toBe('PUBLISHED');
      expect(path.domainId).toBe(domain.id);
      for (const competencySeed of pathData.competencies) {
        const rows = await prisma.competencyDefinition.findMany({ where: { code: competencySeed.code } });
        expect(rows).toHaveLength(1);
        expect(rows[0]!.status).toBe('PUBLISHED');
        expect(rows[0]!.domainId).toBe(domain.id);
        expect(rows[0]!.pathId).toBe(path.id);
      }
    }
  });

  it('keeps the early-years and primary-grammar content in separate paths', async () => {
    const paths = await prisma.learningPath.findMany({
      where: { code: { in: seedData.paths.map((path) => path.path.code) } },
      select: { code: true, id: true },
    });
    const pathIds = new Map(paths.map((path) => [path.code, path.id]));
    for (const pathData of seedData.paths) {
      const rows = await prisma.competencyDefinition.findMany({
        where: { code: { in: pathData.competencies.map((competency) => competency.code) } },
        select: { pathId: true },
      });
      expect(rows.length).toBe(pathData.competencies.length);
      for (const row of rows) expect(row.pathId).toBe(pathIds.get(pathData.path.code));
    }
  });
});
