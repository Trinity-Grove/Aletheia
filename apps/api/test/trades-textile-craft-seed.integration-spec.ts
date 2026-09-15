import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { TradesFormationSeeder } from '../src/modules/curriculum/infrastructure/trades-formation.seeder.js';
import { TradesTextileCraftSeeder } from '../src/modules/curriculum/infrastructure/trades-textile-craft.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildTradesTextileCraftSeedData } from '../src/modules/curriculum/infrastructure/trades-textile-craft.seed-data.js';

// Proves the textile/craft per-trade paths actually publish a real,
// internally-consistent (existing domain) -> (new trade paths) ->
// competencies hierarchy against real Postgres, and that re-running is
// idempotent -- same shape of proof as trades-woodworking-construction
// (#152) and every prior seed in this file group.
describe('TradesTextileCraftSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildTradesTextileCraftSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes every trade path and its competencies under the existing TRADES domain, and is idempotent on re-run', async () => {
    const foundationSeeder = app.get(TradesFormationSeeder);
    await foundationSeeder.seed();

    const seeder = app.get(TradesTextileCraftSeeder);
    await seeder.seed();
    const secondRun = await seeder.seed();
    expect(secondRun.domainCreated).toBe(false);
    expect(secondRun.pathsCreated).toBe(0);
    expect(secondRun.competenciesCreated).toBe(0);

    const domains = await prisma.learningDomain.findMany({ where: { code: seedData.domain.code } });
    expect(domains).toHaveLength(1);
    const domain = domains[0]!;
    expect(domain.status).toBe('PUBLISHED');

    expect(seedData.paths.length).toBe(3);
    for (const pathData of seedData.paths) {
      const paths = await prisma.learningPath.findMany({ where: { code: pathData.path.code } });
      expect(paths).toHaveLength(1);
      const path = paths[0]!;
      expect(path.status).toBe('PUBLISHED');
      expect(path.domainId).toBe(domain.id);

      for (const competencySeed of pathData.competencies) {
        const rows = await prisma.competencyDefinition.findMany({ where: { code: competencySeed.code } });
        expect(rows).toHaveLength(1);
        const row = rows[0]!;
        expect(row.status).toBe('PUBLISHED');
        expect(row.domainId).toBe(domain.id);
        expect(row.pathId).toBe(path.id);
        expect(row.title).toBe(competencySeed.title);
        const metadata = row.metadata as { starterObjectives?: string[] };
        expect(metadata.starterObjectives?.length).toBeGreaterThan(0);
      }
    }

    const allPathIdsByCode = new Map(
      (await prisma.learningPath.findMany({ where: { code: { in: seedData.paths.map((p) => p.path.code) } } })).map(
        (p) => [p.code, p.id],
      ),
    );
    for (const pathData of seedData.paths) {
      const expectedPathId = allPathIdsByCode.get(pathData.path.code);
      const rows = await prisma.competencyDefinition.findMany({
        where: { code: { in: pathData.competencies.map((c) => c.code) } },
        select: { pathId: true },
      });
      for (const row of rows) {
        expect(row.pathId).toBe(expectedPathId);
      }
    }
  });

  it('keeps every competency assuming adult supervision where a real tool or material risk is involved (age floor sanity check)', async () => {
    for (const pathData of seedData.paths) {
      for (const competency of pathData.competencies) {
        expect(competency.ageRecommendation.min).toBeGreaterThanOrEqual(6);
        expect(competency.ageRecommendation.min).toBeLessThanOrEqual(competency.ageRecommendation.max);
      }
    }
  });
});
