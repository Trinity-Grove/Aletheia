import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { ArtsFormationSeeder } from '../src/modules/curriculum/infrastructure/arts-formation.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildArtsFormationSeedData } from '../src/modules/curriculum/infrastructure/arts-formation.seed-data.js';

describe('ArtsFormationSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildArtsFormationSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });
  afterAll(async () => app.close());

  it('publishes one internally consistent ARTS hierarchy and is idempotent', async () => {
    const seeder = app.get(ArtsFormationSeeder);
    await seeder.seed();
    const secondRun = await seeder.seed();
    expect(secondRun).toEqual({ domainCreated: false, pathCreated: false, competenciesCreated: 0 });

    const domain = await prisma.learningDomain.findFirst({ where: { code: 'ARTS', version: 1 } });
    expect(domain?.status).toBe('PUBLISHED');
    const path = await prisma.learningPath.findFirst({ where: { code: 'ARTS.FOUNDATIONS', version: 1 } });
    expect(path?.domainId).toBe(domain?.id);
    const rows = await prisma.competencyDefinition.findMany({ where: { code: { startsWith: 'ARTS.FOUNDATIONS.' }, version: 1 } });
    expect(rows).toHaveLength(seedData.competencies.length);
    for (const competency of seedData.competencies) {
      const row = rows.find((item) => item.code === competency.code);
      expect(row?.status).toBe('PUBLISHED');
      expect(row?.domainId).toBe(domain?.id);
      expect(row?.pathId).toBe(path?.id);
      expect((row?.metadata as { progressionAxis?: string }).progressionAxis).toBe('DOMAIN_PROFICIENCY');
    }
  });

  it('keeps the catalog scoped to arts rather than trade safety or religious instruction', () => {
    const text = JSON.stringify(seedData).toLowerCase();
    expect(text).not.toContain('ferramenta elétrica');
    expect(text).not.toContain('denominacional');
    expect(text).not.toContain('doutrina');
  });
});
