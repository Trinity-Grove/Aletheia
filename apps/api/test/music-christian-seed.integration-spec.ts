import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { MusicFormationSeeder } from '../src/modules/curriculum/infrastructure/music-formation.seeder.js';
import { MusicChristianSeeder } from '../src/modules/curriculum/infrastructure/music-christian.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildMusicChristianSeedData } from '../src/modules/curriculum/infrastructure/music-christian.seed-data.js';

// Proves the "Música e Cristianismo" LearningPath (issue #95 section 13)
// actually publishes a real, internally-consistent (existing MUSIC
// domain) -> (new path) -> competencies hierarchy against real Postgres,
// and that re-running is idempotent -- same shape of proof as
// music-formation-seed.integration-spec.ts (#132) and
// biblical-formation-seed.integration-spec.ts (#131).
describe('MusicChristianSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildMusicChristianSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes the path and every competency under the existing MUSIC domain, and is idempotent on re-run', async () => {
    const foundationSeeder = app.get(MusicFormationSeeder);
    await foundationSeeder.seed();

    const seeder = app.get(MusicChristianSeeder);
    await seeder.seed();
    const secondRun = await seeder.seed();
    expect(secondRun.domainCreated).toBe(false);
    expect(secondRun.pathCreated).toBe(false);
    expect(secondRun.competenciesCreated).toBe(0);

    const domains = await prisma.learningDomain.findMany({ where: { code: seedData.domain.code } });
    expect(domains).toHaveLength(1);
    const domain = domains[0]!;
    expect(domain.status).toBe('PUBLISHED');

    const paths = await prisma.learningPath.findMany({ where: { code: seedData.path.code } });
    expect(paths).toHaveLength(1);
    const path = paths[0]!;
    expect(path.status).toBe('PUBLISHED');
    expect(path.domainId).toBe(domain.id);

    expect(seedData.competencies.length).toBe(6);
    for (const competencySeed of seedData.competencies) {
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
      // school stage.
      expect(metadata.progressionAxis).toBe('DOMAIN_PROFICIENCY');
    }

    const allCompetencyPointers = new Set(
      (
        await prisma.competencyDefinition.findMany({
          where: { code: { in: seedData.competencies.map((c) => c.code) } },
          select: { domainId: true, pathId: true },
        })
      ).flatMap((row) => [row.domainId, row.pathId]),
    );
    expect(allCompetencyPointers).toEqual(new Set([domain.id, path.id]));
  });

  it('stays interdenominational and historical/descriptive -- no doctrinal-position or denominational terms in the seeded rows', () => {
    // Sanity check for the neutrality constraint documented in
    // music-christian.seed-data.ts: this content must stay
    // narrative/historical/descriptive, never a doctrinal position
    // statement or an endorsement of one denomination, worship style, or
    // theological reading over another -- same technique as PR #131's
    // biblical-formation-seed.integration-spec.ts.
    const forbiddenTerms = [
      // Denominations / traditions
      'batista',
      'presbiteriano',
      'reformado',
      'pentecostal',
      'carismático',
      'metodista',
      'luterano',
      'anglicano',
      'católico',
      'ortodoxo',
      'adventista',
      // Doctrinal-position / worship-style-endorsement language
      'cessacionismo',
      'dom de línguas',
      'batismo no espírito',
      'predestina',
      'infalibilidade papal',
      'louvor contemporâneo é superior',
      'hinos tradicionais são superiores',
      'única forma correta',
      'única maneira certa',
    ];
    const haystack = [
      seedData.domain.description,
      seedData.path.description,
      ...seedData.competencies.flatMap((c) => [c.title, ...c.starterObjectives]),
    ]
      .join(' ')
      .toLowerCase();

    for (const term of forbiddenTerms) {
      expect(haystack).not.toContain(term);
    }
  });

  it('stays within "Música e Cristianismo" scope -- no specific-instrument technique content leaked into this slice', () => {
    // Sanity check for the scope boundary documented in
    // music-christian.seed-data.ts: this slice covers only section 13's
    // "Música e Cristianismo" subsection, kept separate from the
    // per-instrument "Instrumentos" paths (MUSIC.PIANO, MUSIC.GUITAR,
    // etc., a sibling PR) -- this asserts that boundary was actually
    // respected in the content, not just claimed in a comment.
    const forbiddenTerms = ['piano', 'violão', 'guitarra', 'bateria', 'flauta doce', 'violino', 'teclado eletrônico'];
    const haystack = [
      seedData.domain.description,
      seedData.path.description,
      ...seedData.competencies.flatMap((c) => [c.title, ...c.starterObjectives]),
    ]
      .join(' ')
      .toLowerCase();

    for (const term of forbiddenTerms) {
      expect(haystack).not.toContain(term);
    }
  });
});
