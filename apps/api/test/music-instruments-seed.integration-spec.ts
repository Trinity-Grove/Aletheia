import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { MusicFormationSeeder } from '../src/modules/curriculum/infrastructure/music-formation.seeder.js';
import { MusicInstrumentsSeeder } from '../src/modules/curriculum/infrastructure/music-instruments.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildMusicInstrumentsSeedData } from '../src/modules/curriculum/infrastructure/music-instruments.seed-data.js';

// Proves the nine per-instrument "Instrumentos" paths (issue #95 section
// 13) actually publish a real, internally-consistent (existing MUSIC
// domain) -> (new instrument paths) -> competencies hierarchy against
// real Postgres, and that re-running is idempotent -- same shape of
// proof as trades-textile-craft-seed.integration-spec.ts (#153) and
// music-formation-seed.integration-spec.ts (#132).
describe('MusicInstrumentsSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildMusicInstrumentsSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes every instrument path and its competencies under the existing MUSIC domain, and is idempotent on re-run', async () => {
    const foundationSeeder = app.get(MusicFormationSeeder);
    await foundationSeeder.seed();

    const seeder = app.get(MusicInstrumentsSeeder);
    await seeder.seed();
    const secondRun = await seeder.seed();
    expect(secondRun.domainCreated).toBe(false);
    expect(secondRun.pathsCreated).toBe(0);
    expect(secondRun.competenciesCreated).toBe(0);

    const domains = await prisma.learningDomain.findMany({ where: { code: seedData.domain.code } });
    expect(domains).toHaveLength(1);
    const domain = domains[0]!;
    expect(domain.status).toBe('PUBLISHED');

    expect(seedData.paths.length).toBe(9);
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
        // domains like Música progress by DOMAIN_PROFICIENCY, not by
        // school stage. None of these competency codes contain an
        // EDUCATIONAL_STAGE path segment, so the schema's own transform
        // must have derived DOMAIN_PROFICIENCY automatically.
        expect(metadata.progressionAxis).toBe('DOMAIN_PROFICIENCY');
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

  it('keeps age recommendations internally consistent across every instrument path', () => {
    for (const pathData of seedData.paths) {
      for (const competency of pathData.competencies) {
        expect(competency.ageRecommendation.min).toBeGreaterThanOrEqual(6);
        expect(competency.ageRecommendation.min).toBeLessThanOrEqual(competency.ageRecommendation.max);
      }
    }
  });

  it('stays about instrumental technique only -- no "Música e Cristianismo" content leaked into this slice', () => {
    // Sanity check for the scope boundary documented in
    // music-instruments.seed-data.ts: this slice covers only section
    // 13's "Instrumentos" subsection. "Música e Cristianismo" (hinologia,
    // música sacra, salmos, música congregacional, etc.) is an explicitly
    // separate sibling PR -- this asserts that boundary was actually
    // respected in the content, not just claimed in a comment.
    const forbiddenTerms = [
      'hinologia',
      'hino',
      'hinário',
      'música sacra',
      'música congregacional',
      'salmo',
      'louvor',
      'adoração',
      'igreja',
      'litúrgic',
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

    for (const term of forbiddenTerms) {
      expect(haystack).not.toContain(term);
    }
  });
});
