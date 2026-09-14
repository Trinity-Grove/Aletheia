import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { MathSubjectSeeder } from '../src/modules/curriculum/infrastructure/math-subject.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildMathSubjectSeedData } from '../src/modules/curriculum/infrastructure/math-subject.seed-data.js';

// Proves the "Matemática" core-academic-subject seed actually publishes
// a real, internally-consistent domain -> (multiple grade-band paths) ->
// competencies hierarchy against real Postgres, and that re-running it
// is idempotent (no duplicates, no altered rows) -- same shape of proof
// as every prior content seed (#131/#132/#134/#135/#136/#137), extended
// to cover multiple LearningPaths under one domain since academic
// subjects need real grade progression, unlike the flat single-path
// enrichment domains.
describe('MathSubjectSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildMathSubjectSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes the domain, every grade-band path and every competency, and is idempotent on re-run', async () => {
    const seeder = app.get(MathSubjectSeeder);

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
    // to this exact domain -- proving the "multiple LearningPaths under
    // one LearningDomain" shape actually persisted correctly.
    expect(seedData.paths.length).toBeGreaterThanOrEqual(2);
    for (const pathData of seedData.paths) {
      const paths = await prisma.learningPath.findMany({ where: { code: pathData.path.code } });
      expect(paths).toHaveLength(1);
      const path = paths[0]!;
      expect(path.status).toBe('PUBLISHED');
      expect(path.domainId).toBe(domain.id);

      // Every competency in this path exists exactly once, is PUBLISHED,
      // and is internally consistent with the domain and THIS specific
      // path (not a sibling grade-band path) -- "created hierarchy
      // (domain -> path -> competencies) is internally consistent" per
      // the task's own verification requirement, extended to prove
      // competencies land under the correct grade band.
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

    // No cross-contamination between grade bands: a PRIMARY_GRAMMAR
    // competency's pathId must never resolve to the MIDDLE_LOGIC path,
    // and vice versa.
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

  it('keeps each grade band age-appropriate -- no advanced-band concepts leaked into the earlier band, and the later band genuinely escalates', async () => {
    // Sanity check standing in for the "scope-neutrality" tests used by
    // prior seeds, adapted to this domain's actual risk: since the two
    // paths intentionally build on the same subject (unlike the
    // enrichment domains' mutually exclusive subsections), the
    // meaningful check isn't "these two bands never share vocabulary" --
    // it's that PRIMARY_GRAMMAR (younger band) never uses MIDDLE_LOGIC
    // (older band) concepts, and that MIDDLE_LOGIC actually contains
    // genuinely more advanced material rather than just repeating the
    // younger band under a different label.
    const primaryGrammar = seedData.paths.find((p) => p.path.code === 'MATH.PRIMARY_GRAMMAR');
    const middleLogic = seedData.paths.find((p) => p.path.code === 'MATH.MIDDLE_LOGIC');
    expect(primaryGrammar).toBeDefined();
    expect(middleLogic).toBeDefined();

    // Word stems, not full singular/plural forms -- "fração"/"frações"
    // and "decimal"/"decimais" diverge after the stem in Portuguese, so a
    // literal singular-form substring check would silently miss the
    // plural forms actually used in the content below.
    const advancedOnlyTerms = [
      'equaç',
      'incógnita',
      'porcentagem',
      'fraç',
      'decim',
      'negativ',
      'regra de três',
      'proporç',
      'estatística',
      'perímetro',
      'área',
    ];

    const primaryGrammarText = primaryGrammar!.competencies
      .flatMap((c) => [c.title, ...c.starterObjectives])
      .join(' ')
      .toLowerCase();
    for (const term of advancedOnlyTerms) {
      expect(primaryGrammarText).not.toContain(term);
    }

    // MIDDLE_LOGIC must actually escalate -- contain at least several of
    // those genuinely more advanced concepts, proving it isn't a
    // re-labeled copy of the younger band.
    const middleLogicText = middleLogic!.competencies
      .flatMap((c) => [c.title, ...c.starterObjectives])
      .join(' ')
      .toLowerCase();
    const advancedTermsPresent = advancedOnlyTerms.filter((term) => middleLogicText.includes(term));
    expect(advancedTermsPresent.length).toBeGreaterThanOrEqual(5);

    // Every competency in every band declares an ageRecommendation
    // that's internally consistent (min <= max) and roughly matches its
    // band -- PRIMARY_GRAMMAR competencies shouldn't recommend ages past
    // 10, MIDDLE_LOGIC competencies shouldn't recommend ages under 10.
    for (const competency of primaryGrammar!.competencies) {
      expect(competency.ageRecommendation.min).toBeLessThanOrEqual(competency.ageRecommendation.max);
      expect(competency.ageRecommendation.max).toBeLessThanOrEqual(10);
    }
    for (const competency of middleLogic!.competencies) {
      expect(competency.ageRecommendation.min).toBeLessThanOrEqual(competency.ageRecommendation.max);
      expect(competency.ageRecommendation.min).toBeGreaterThanOrEqual(10);
    }
  });
});
