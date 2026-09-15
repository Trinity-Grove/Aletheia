import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { TechnologyFormationSeeder } from '../src/modules/curriculum/infrastructure/technology-formation.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildTechnologyFormationSeedData } from '../src/modules/curriculum/infrastructure/technology-formation.seed-data.js';

// Proves the "Tecnologia" foundational seed (issue #95 section 16)
// actually publishes a real, internally-consistent domain -> two paths ->
// competencies hierarchy against real Postgres, and that re-running it is
// idempotent (no duplicates, no altered rows) -- same shape of proof as
// gardening-formation-seed.integration-spec.ts (#136) and
// trades-mechanical-electrical-home-seed.integration-spec.ts (#165).
describe('TechnologyFormationSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildTechnologyFormationSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes the domain, both paths and every competency, and is idempotent on re-run', async () => {
    const seeder = app.get(TechnologyFormationSeeder);

    // Don't assume a pristine database -- see gardening-formation's
    // integration spec for the rationale: the idempotency proof is that
    // *any* call made after the content already exists reports nothing
    // new, not that the very first call reports fully created.
    await seeder.seed();
    const secondRun = await seeder.seed();
    expect(secondRun.domainCreated).toBe(false);
    expect(secondRun.pathsCreated).toBe(0);
    expect(secondRun.competenciesCreated).toBe(0);

    const domains = await prisma.learningDomain.findMany({ where: { code: seedData.domain.code } });
    expect(domains).toHaveLength(1);
    const domain = domains[0]!;
    expect(domain.status).toBe('PUBLISHED');
    expect(domain.name).toBe(seedData.domain.name);
    expect(domain.publishedAt).not.toBeNull();

    expect(seedData.paths.length).toBe(2);
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
        const metadata = row.metadata as { starterObjectives?: string[]; progressionAxis?: string };
        expect(metadata.starterObjectives?.length).toBeGreaterThan(0);
        // Taxonomy requirement (PR #154): practical/proficiency-tracked
        // domains like Tecnologia progress by DOMAIN_PROFICIENCY, not by
        // school stage.
        expect(metadata.progressionAxis).toBe('DOMAIN_PROFICIENCY');
      }
    }

    // No cross-contamination between the two sibling paths.
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

  it('covers exactly the 13 items enumerated in issue #95 section 16, one competency each', () => {
    const totalCompetencies = seedData.paths.reduce((sum, p) => sum + p.competencies.length, 0);
    expect(totalCompetencies).toBe(13);
  });

  it('stays scope-neutral -- no Ofícios/TRADES-domain vocabulary leaked into this slice', () => {
    // Sanity check against the adjacent `TRADES` domain (issue #95
    // section 15, PR #134/#152/#153/#165): Tecnologia is its own modern
    // craft, not a restatement of traditional trades vocabulary, even
    // though both domains involve tools and hands-on making.
    const tradesTerms = [
      'marcenaria',
      'carpintaria',
      'madeira',
      'serrote',
      'alvenaria',
      'argamassa',
      'costura',
      'tricô',
      'crochê',
      'macramê',
      'pincel',
      'demão',
      'hidráulica',
      'torneira',
      'drywall',
    ];
    const haystack = [
      seedData.domain.description,
      ...seedData.paths.flatMap((p) => [
        p.path.description,
        ...p.competencies.flatMap((c) => [c.title, ...c.starterObjectives]),
      ]),
    ]
      .join(' ')
      .toLowerCase();

    for (const term of tradesTerms) {
      expect(haystack).not.toContain(term);
    }
  });
});
