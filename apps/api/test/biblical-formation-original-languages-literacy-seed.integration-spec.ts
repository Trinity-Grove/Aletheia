import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { BiblicalFormationSeeder } from '../src/modules/curriculum/infrastructure/biblical-formation.seeder.js';
import { BiblicalFormationOriginalLanguagesLiteracySeeder } from '../src/modules/curriculum/infrastructure/biblical-formation-original-languages-literacy.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildOriginalLanguagesLiteracySeedData } from '../src/modules/curriculum/infrastructure/biblical-formation-original-languages-literacy.seed-data.js';
import { buildBiblicalFormationSeedData } from '../src/modules/curriculum/infrastructure/biblical-formation.seed-data.js';

// Proves the original-languages-literacy path actually publishes a real,
// internally-consistent (existing FAITH.BIBLICAL_FORMATION domain) ->
// (new path) -> competencies hierarchy against real Postgres, and that
// re-running is idempotent.
describe('BiblicalFormationOriginalLanguagesLiteracySeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildOriginalLanguagesLiteracySeedData();
  const introductorySeedData = buildBiblicalFormationSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes the path and its competencies under the existing FAITH.BIBLICAL_FORMATION domain, and is idempotent on re-run', async () => {
    const introductorySeeder = app.get(BiblicalFormationSeeder);
    await introductorySeeder.seed();

    const seeder = app.get(BiblicalFormationOriginalLanguagesLiteracySeeder);
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
      // PR #154 taxonomy requirement: domain-proficiency progression.
      expect(metadata.progressionAxis).toBe('DOMAIN_PROFICIENCY');
    }
  });

  it('never duplicates an introductory-tier competency code', () => {
    const introductoryCodes = new Set(introductorySeedData.competencies.map((c) => c.code));
    for (const competency of seedData.competencies) {
      expect(introductoryCodes.has(competency.code)).toBe(false);
    }
  });

  it('never embeds actual scriptural text, copyrighted lexicon content, or restricted-license source editions (PR #122 rule + this seed data licensing scope)', () => {
    // This is the load-bearing safety check for this PR: every objective
    // must stay at the awareness/skill level, never embed or quote real
    // biblical text, and never cite a source this seed's own research
    // flagged as NOT safe to use (SBLGNT, Nestle-Aland/UBS, BDAG, HALOT).
    const forbiddenTerms = [
      // Copyrighted / restricted-license sources explicitly excluded by
      // this seed's licensing research (see the seed-data file header) --
      // must never appear as if they were used as a source.
      'sblgnt',
      'nestle-aland',
      'nestle aland',
      ' ubs ',
      'bdag',
      'halot',
      // Signals that would indicate actual scriptural text got embedded
      // rather than just described (a very rough heuristic: common verse-
      // reference shorthand should never appear in this literacy-only
      // content since no passage is ever cited or quoted).
      'gênesis 1:1',
      'joão 3:16',
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
});
