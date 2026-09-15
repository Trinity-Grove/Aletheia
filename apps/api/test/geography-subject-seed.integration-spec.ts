import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { GeographySubjectSeeder } from '../src/modules/curriculum/infrastructure/geography-subject.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildGeographySubjectSeedData } from '../src/modules/curriculum/infrastructure/geography-subject.seed-data.js';

// Proves the "Geografia" core-academic-subject seed actually publishes a
// real, internally-consistent domain -> (multiple grade-band paths) ->
// competencies hierarchy against real Postgres, and that re-running it
// is idempotent (no duplicates, no altered rows) -- same shape of proof
// as MathSubjectSeeder (#142/#145), ScienceSubjectSeeder (#147) and
// HistorySubjectSeeder (#149).
describe('GeographySubjectSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildGeographySubjectSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes the domain, every grade-band path and every competency, and is idempotent on re-run', async () => {
    const seeder = app.get(GeographySubjectSeeder);

    // Don't assume a pristine database -- this suite may run against a
    // persistent local Postgres that already has this content from an
    // earlier invocation (CI always starts fresh, but local dev doesn't).
    // The real idempotency proof isn't "the first call reports fully
    // created" (that depends on starting state); it's that *any* call
    // made after the content already exists reports nothing new -- so
    // calling seed() twice in a row and asserting the second call is a
    // total no-op holds regardless of what state the first call found.
    await seeder.seed();
    const secondRun = await seeder.seed();
    expect(secondRun.domainCreated).toBe(false);
    expect(secondRun.pathsCreated).toBe(0);
    expect(secondRun.competenciesCreated).toBe(0);

    // Exactly one domain row, PUBLISHED, matching the seed data.
    const domains = await prisma.learningDomain.findMany({ where: { code: seedData.domain.code } });
    expect(domains).toHaveLength(1);
    const domain = domains[0]!;
    expect(domain.status).toBe('PUBLISHED');
    expect(domain.name).toBe(seedData.domain.name);
    expect(domain.publishedAt).not.toBeNull();

    // Every grade-band path exists exactly once, PUBLISHED, and belongs
    // to this exact domain.
    expect(seedData.paths.length).toBeGreaterThanOrEqual(2);
    for (const pathData of seedData.paths) {
      const paths = await prisma.learningPath.findMany({ where: { code: pathData.path.code } });
      expect(paths).toHaveLength(1);
      const path = paths[0]!;
      expect(path.status).toBe('PUBLISHED');
      expect(path.domainId).toBe(domain.id);

      // Every competency in this path exists exactly once, is PUBLISHED,
      // and is internally consistent with the domain and THIS specific
      // path (not a sibling grade-band path).
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

    // No cross-contamination between grade bands: a competency's pathId
    // must never resolve to a sibling band's path.
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

  it('keeps each grade band age-appropriate -- no advanced-band concepts leaked into an earlier band, and each later band genuinely escalates', async () => {
    // Same reasoning as math/science/history-subject-seed.integration-spec.ts:
    // all three bands intentionally build on the same subject, so the
    // meaningful check isn't "these bands never share vocabulary" -- it's
    // that each younger band never uses an older band's concepts, and each
    // older band genuinely contains new material rather than repeating the
    // younger one under a different label.
    function textFor(pathCode: string): string {
      const path = seedData.paths.find((p) => p.path.code === pathCode);
      expect(path).toBeDefined();
      return path!.competencies
        .flatMap((c) => [c.title, ...c.starterObjectives])
        .join(' ')
        .toLowerCase();
    }

    const earlyYearsText = textFor('GEOGRAPHY.EARLY_YEARS');
    const primaryGrammarText = textFor('GEOGRAPHY.PRIMARY_GRAMMAR');
    const middleLogicText = textFor('GEOGRAPHY.MIDDLE_LOGIC');

    // EARLY_YEARS is limited to personal spatial awareness (perto/longe,
    // casa/vizinhança, elementos da natureza ao redor) -- no formal
    // cartography, cardinal directions, or Brazil/world geography yet.
    // Word stems, not full singular/plural phrases -- the same class of
    // bug already caught in the Matemática/Ciências/História seeds'
    // equivalent tests (e.g. "bioma" would NOT substring-match "biomas").
    // Note: 'climátic' (not 'clima') is used as the MIDDLE_LOGIC-only
    // marker specifically because EARLY_YEARS.WEATHER_SEASONS's own title
    // ("Clima e Estações do Ano ao Redor") already contains "clima" --
    // using the bare word would be a false-positive collision against our
    // own EARLY_YEARS content, not a real scope violation.
    const primaryGrammarOnwardTerms = ['cardeal', 'continente', 'bioma', 'hidrográfic', 'espaço urbano', 'espaço rural'];
    const middleLogicOnlyTerms = ['relevo', 'planalto', 'climátic', 'escala', 'coordenadas geográficas', 'demografia', 'urbanização', 'migração', 'sustentabilidade'];

    for (const term of [...primaryGrammarOnwardTerms, ...middleLogicOnlyTerms]) {
      expect(earlyYearsText).not.toContain(term);
    }

    // PRIMARY_GRAMMAR must escalate beyond EARLY_YEARS (trivially true by
    // construction) but must not yet reach into MIDDLE_LOGIC-only
    // territory (relief/landforms, climate types, cartography/scale,
    // demographics, urbanization/migration, sustainability) -- that's the
    // next band's job.
    const primaryGrammarOwnTermsPresent = primaryGrammarOnwardTerms.filter((term) => primaryGrammarText.includes(term));
    expect(primaryGrammarOwnTermsPresent.length).toBeGreaterThanOrEqual(4);
    for (const term of middleLogicOnlyTerms) {
      expect(primaryGrammarText).not.toContain(term);
    }

    // MIDDLE_LOGIC must actually escalate beyond PRIMARY_GRAMMAR --
    // contain several genuinely new concepts, proving it isn't a
    // re-labeled copy.
    const middleLogicOwnTermsPresent = middleLogicOnlyTerms.filter((term) => middleLogicText.includes(term));
    expect(middleLogicOwnTermsPresent.length).toBeGreaterThanOrEqual(5);

    // Every competency in every band declares an ageRecommendation
    // that's internally consistent (min <= max) and roughly matches its
    // band.
    function assertAgeBounds(pathCode: string, opts: { maxCeiling?: number; minFloor?: number }): void {
      const path = seedData.paths.find((p) => p.path.code === pathCode)!;
      for (const competency of path.competencies) {
        expect(competency.ageRecommendation.min).toBeLessThanOrEqual(competency.ageRecommendation.max);
        if (opts.maxCeiling !== undefined) {
          expect(competency.ageRecommendation.max).toBeLessThanOrEqual(opts.maxCeiling);
        }
        if (opts.minFloor !== undefined) {
          expect(competency.ageRecommendation.min).toBeGreaterThanOrEqual(opts.minFloor);
        }
      }
    }
    assertAgeBounds('GEOGRAPHY.EARLY_YEARS', { maxCeiling: 6 });
    assertAgeBounds('GEOGRAPHY.PRIMARY_GRAMMAR', { minFloor: 6, maxCeiling: 10 });
    assertAgeBounds('GEOGRAPHY.MIDDLE_LOGIC', { minFloor: 10, maxCeiling: 14 });
  });

  it('stays scoped to the current bands -- no Ensino Médio geopolitical/economic-geography terminology leaked in', async () => {
    // Sanity check for the scope boundary documented in
    // geography-subject.seed-data.ts: HIGH_RHETORIC (geopolitics and
    // economic geography) is explicitly out of scope for this slice.
    // This asserts that boundary was actually respected in the content,
    // not just claimed in a comment.
    const forbiddenTerms = ['geopolítica mundial', 'globalização econômica', 'geografia econômica', 'blocos econômicos', 'imperialismo'];
    const haystack = [
      seedData.domain.description,
      ...seedData.paths.flatMap((p) => [p.path.description, ...p.competencies.flatMap((c) => [c.title, ...c.starterObjectives])]),
    ]
      .join(' ')
      .toLowerCase();

    for (const term of forbiddenTerms) {
      expect(haystack).not.toContain(term);
    }
  });
});
