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

  it('keeps each grade band age-appropriate -- no advanced-band concepts leaked into an earlier band, and each later band genuinely escalates', async () => {
    // Sanity check standing in for the "scope-neutrality" tests used by
    // prior seeds, adapted to this domain's actual risk: since all four
    // paths intentionally build on the same subject (unlike the
    // enrichment domains' mutually exclusive subsections), the
    // meaningful check isn't "these bands never share vocabulary" --
    // it's that each younger band never uses an older band's concepts,
    // and that each older band actually contains genuinely more advanced
    // material rather than just repeating the younger one under a
    // different label.
    function textFor(pathCode: string): string {
      const path = seedData.paths.find((p) => p.path.code === pathCode);
      expect(path).toBeDefined();
      return path!.competencies
        .flatMap((c) => [c.title, ...c.starterObjectives])
        .join(' ')
        .toLowerCase();
    }

    const earlyYearsText = textFor('MATH.EARLY_YEARS');
    const primaryGrammarText = textFor('MATH.PRIMARY_GRAMMAR');
    const middleLogicText = textFor('MATH.MIDDLE_LOGIC');
    const highRhetoricText = textFor('MATH.HIGH_RHETORIC');

    // Word stems, not full singular/plural forms -- "fração"/"frações"
    // and "decimal"/"decimais" diverge after the stem in Portuguese, so a
    // literal singular-form substring check would silently miss the
    // plural forms actually used in the content below (the exact bug
    // this test caught once already, per the task's own reminder).
    const primaryGrammarOnwardTerms = [
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
    const highRhetoricOnlyTerms = [
      'função',
      'funções',
      'segundo grau',
      'discriminante',
      'probabilidade',
      'logaritm',
      'exponencial',
      'volume',
      'sólido',
    ];

    // EARLY_YEARS must never use PRIMARY_GRAMMAR-onward concepts (formal
    // arithmetic operations, fractions, equations, etc.) or
    // HIGH_RHETORIC-only concepts -- it's pre-arithmetic by design.
    for (const term of [...primaryGrammarOnwardTerms, ...highRhetoricOnlyTerms]) {
      expect(earlyYearsText).not.toContain(term);
    }

    // PRIMARY_GRAMMAR must never use MIDDLE_LOGIC/HIGH_RHETORIC concepts.
    for (const term of [...primaryGrammarOnwardTerms, ...highRhetoricOnlyTerms]) {
      expect(primaryGrammarText).not.toContain(term);
    }

    // MIDDLE_LOGIC must actually escalate beyond PRIMARY_GRAMMAR --
    // contain several genuinely more advanced concepts -- but must not
    // yet reach into HIGH_RHETORIC-only territory (functions, quadratics,
    // probability, logarithms), which is the next band's job.
    const middleLogicAdvancedTermsPresent = primaryGrammarOnwardTerms.filter((term) => middleLogicText.includes(term));
    expect(middleLogicAdvancedTermsPresent.length).toBeGreaterThanOrEqual(5);
    for (const term of highRhetoricOnlyTerms) {
      expect(middleLogicText).not.toContain(term);
    }

    // HIGH_RHETORIC must actually escalate beyond MIDDLE_LOGIC -- contain
    // several genuinely new concepts, proving it isn't a re-labeled copy.
    const highRhetoricAdvancedTermsPresent = highRhetoricOnlyTerms.filter((term) => highRhetoricText.includes(term));
    expect(highRhetoricAdvancedTermsPresent.length).toBeGreaterThanOrEqual(5);

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
    assertAgeBounds('MATH.EARLY_YEARS', { maxCeiling: 6 });
    assertAgeBounds('MATH.PRIMARY_GRAMMAR', { minFloor: 6, maxCeiling: 10 });
    assertAgeBounds('MATH.MIDDLE_LOGIC', { minFloor: 10, maxCeiling: 14 });
    assertAgeBounds('MATH.HIGH_RHETORIC', { minFloor: 15 });
  });
});
