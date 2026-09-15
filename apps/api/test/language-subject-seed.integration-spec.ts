import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { LanguageSubjectSeeder } from '../src/modules/curriculum/infrastructure/language-subject.seeder.js';
import { buildLanguageSubjectSeedData } from '../src/modules/curriculum/infrastructure/language-subject.seed-data.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';

describe('LanguageSubjectSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildLanguageSubjectSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes the three language domains and all profile tracks idempotently', async () => {
    const seeder = app.get(LanguageSubjectSeeder);
    await seeder.seed();
    const secondRun = await seeder.seed();
    expect(secondRun).toEqual({ domainsCreated: 0, pathsCreated: 0, competenciesCreated: 0 });

    for (const language of seedData) {
      const domain = await prisma.learningDomain.findFirst({ where: { code: language.domain.code, version: 1 } });
      expect(domain?.status).toBe('PUBLISHED');
      expect(domain).toBeDefined();
      for (const pathData of language.paths) {
        const path = await prisma.learningPath.findFirst({ where: { code: pathData.path.code, version: 1 } });
        expect(path?.status).toBe('PUBLISHED');
        expect(path?.domainId).toBe(domain!.id);
        const competencies = await prisma.competencyDefinition.findMany({
          where: { code: { in: pathData.competencies.map((competency) => competency.code) }, version: 1 },
        });
        expect(competencies).toHaveLength(pathData.competencies.length);
        expect(competencies.every((competency) => competency.status === 'PUBLISHED' && competency.pathId === path!.id)).toBe(true);
      }
    }
  });
});
