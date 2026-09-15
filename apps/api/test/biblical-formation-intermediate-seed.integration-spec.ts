import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { BiblicalFormationSeeder } from '../src/modules/curriculum/infrastructure/biblical-formation.seeder.js';
import { BiblicalFormationIntermediateSeeder } from '../src/modules/curriculum/infrastructure/biblical-formation-intermediate.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildBiblicalFormationIntermediateSeedData } from '../src/modules/curriculum/infrastructure/biblical-formation-intermediate.seed-data.js';
import { buildBiblicalFormationSeedData } from '../src/modules/curriculum/infrastructure/biblical-formation.seed-data.js';

// Proves the intermediate "Progressão" path actually publishes a real,
// internally-consistent (existing FAITH.BIBLICAL_FORMATION domain) ->
// (new path) -> competencies hierarchy against real Postgres, and that
// re-running is idempotent -- same shape of proof as
// cooking-progression-seed.integration-spec.ts (#162).
describe('BiblicalFormationIntermediateSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildBiblicalFormationIntermediateSeedData();
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

    const seeder = app.get(BiblicalFormationIntermediateSeeder);
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

  it('stays interdenominational -- no denominational position-taking, no seminary-tier exegesis language', () => {
    // Same anti-bias sanity check as PR #131's integration spec, extended
    // for doctrinal-comparison terms: this content must survey how
    // traditions have answered contested questions, never adopt or teach
    // one answer as correct, and must stay below the seminary tier (no
    // original-language exegesis claims).
    const forbiddenTerms = [
      // Contested doctrinal positions this tier must never assert as fact
      'predestina',
      'arrebatamento',
      'batismo infantil',
      'infalibilidade papal',
      'sola fide',
      'perseverança dos santos incondicional',
      // Seminary-tier / original-language exegesis claims out of scope
      // for this path (see biblical-formation-original-languages-
      // literacy.seed-data.ts for the separate, literacy-only awareness
      // competencies, and issue #95 section 6 for the true seminary tier)
      'exegese em grego',
      'exegese em hebraico',
      'análise morfológica',
      'parsing verbal',
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
