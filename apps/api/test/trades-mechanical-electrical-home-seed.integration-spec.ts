import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { TradesFormationSeeder } from '../src/modules/curriculum/infrastructure/trades-formation.seeder.js';
import { TradesMechanicalElectricalHomeSeeder } from '../src/modules/curriculum/infrastructure/trades-mechanical-electrical-home.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildTradesMechanicalElectricalHomeSeedData } from '../src/modules/curriculum/infrastructure/trades-mechanical-electrical-home.seed-data.js';

// Proves the mechanical/electrical/home maintenance per-trade paths
// actually publish a real, internally-consistent (existing domain) ->
// (new trade paths) -> competencies hierarchy against real Postgres, and
// that re-running is idempotent -- same shape of proof as
// trades-woodworking-construction (#152), trades-textile-craft (#153)
// and every prior seed in this file group.
describe('TradesMechanicalElectricalHomeSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildTradesMechanicalElectricalHomeSeedData();

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

    const seeder = app.get(TradesMechanicalElectricalHomeSeeder);
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
        const metadata = row.metadata as { starterObjectives?: string[]; progressionAxis?: string };
        expect(metadata.starterObjectives?.length).toBeGreaterThan(0);
        // Issue #96/#154 taxonomy requirement: Ofícios is a skill-banded
        // practical domain, not locked to one school grade, so every
        // competency here must resolve to DOMAIN_PROFICIENCY (computed by
        // progressionMetadataForCode via createCompetencyDefinitionSchema's
        // transform -- see educational-taxonomy.ts).
        expect(metadata.progressionAxis).toBe('DOMAIN_PROFICIENCY');
      }
    }

    // No cross-contamination between sibling trade paths.
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

  it('keeps every competency assuming adult supervision where a real tool, moving-part or shock risk is involved (age floor sanity check)', async () => {
    // Sanity check for the age/supervision framing documented in
    // trades-mechanical-electrical-home.seed-data.ts: nothing in this
    // slice should recommend an age floor low enough to suggest
    // unsupervised use of tools, engines, or -- especially -- live
    // electrical circuits.
    for (const pathData of seedData.paths) {
      for (const competency of pathData.competencies) {
        expect(competency.ageRecommendation.min).toBeGreaterThanOrEqual(8);
        expect(competency.ageRecommendation.min).toBeLessThanOrEqual(competency.ageRecommendation.max);
      }
    }

    // Elétrica Básica carries the highest real-world risk (shock) of any
    // trade seeded so far: every hands-on competency that actually
    // touches household wiring/switches/fixtures or a live-adjacent
    // measurement (as opposed to a purely conceptual/observation-only
    // competency, like building a low-voltage battery circuit or naming
    // components without handling them) must name explicit adult
    // supervision in its starter objectives.
    const electricalPath = seedData.paths.find((p) => p.path.code === 'TRADES.BASIC_ELECTRICAL')!;
    const handsOnHouseholdWorkCodes = new Set([
      'TRADES.BASIC_ELECTRICAL.CIRCUIT_BREAKER_SAFETY',
      'TRADES.BASIC_ELECTRICAL.MULTIMETER_BASICS',
      'TRADES.BASIC_ELECTRICAL.SWITCH_REPLACEMENT',
      'TRADES.BASIC_ELECTRICAL.WIRING_BASICS',
      'TRADES.BASIC_ELECTRICAL.BULB_FIXTURE_REPLACEMENT',
      'TRADES.BASIC_ELECTRICAL.SMALL_PROJECT',
    ]);
    for (const competency of electricalPath.competencies) {
      if (!handsOnHouseholdWorkCodes.has(competency.code)) continue;
      const text = [competency.title, ...competency.starterObjectives].join(' ').toLowerCase();
      expect(text).toMatch(/supervis/);
    }
  });

  it('stays scope-neutral -- no woodworking/construction (#152) or textile/craft (#153) terms leaked into this slice', async () => {
    // Sanity check that the group boundary documented in
    // trades-mechanical-electrical-home.seed-data.ts was actually
    // respected in the content, not just claimed in a comment: this
    // slice must never reproduce the specialized vocabulary of the two
    // sibling trade groups already merged under the same TRADES domain.
    const woodworkingConstructionTerms = [
      'marcenaria',
      'carpintaria',
      'madeira',
      'serrote',
      'alvenaria',
      'argamassa',
      'tijolo',
      'esquadro',
      'encaixe',
    ];
    const textileCraftTerms = [
      'costura',
      'tecido',
      'agulha',
      'tricô',
      'crochê',
      'macramê',
      'artesanato',
      'bainha',
      'botão',
      'pincel',
      'demão',
      'lixamento',
      'fita crepe',
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

    for (const term of [...woodworkingConstructionTerms, ...textileCraftTerms]) {
      expect(haystack).not.toContain(term);
    }
  });
});
