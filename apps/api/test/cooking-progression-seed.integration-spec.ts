import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { CookingFormationSeeder } from '../src/modules/curriculum/infrastructure/cooking-formation.seeder.js';
import { CookingProgressionSeeder } from '../src/modules/curriculum/infrastructure/cooking-progression.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildCookingProgressionSeedData } from '../src/modules/curriculum/infrastructure/cooking-progression.seed-data.js';
import { buildCookingFormationSeedData } from '../src/modules/curriculum/infrastructure/cooking-formation.seed-data.js';

// Proves the Progressão path actually publishes a real, internally-
// consistent (existing COOKING domain) -> (new path) -> competencies
// hierarchy against real Postgres, and that re-running is idempotent --
// same shape of proof as resilience-water-fire (#160) and every prior
// seed in this file group.
describe('CookingProgressionSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildCookingProgressionSeedData();
  const foundationsSeedData = buildCookingFormationSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes the path and its competencies under the existing COOKING domain, and is idempotent on re-run', async () => {
    const foundationSeeder = app.get(CookingFormationSeeder);
    await foundationSeeder.seed();

    const seeder = app.get(CookingProgressionSeeder);
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

  it('stays scoped to Progressão -- no Fundamentos or Vida-prática (food-budgeting/finance) terms leaked in', () => {
    const forbiddenTerms = [
      // Fundamentos (COOKING.FOUNDATIONS) -- already-covered basics, not
      // this path's own competency scope. "higiene" itself is
      // deliberately not in this list: it's legitimately referenced in
      // passing (e.g. hygiene care around fermentation, and a one-word
      // cross-reference back to the Fundamentos path this one builds on)
      // without ever becoming its own competency here.
      'segurança alimentar',
      'organização da cozinha',
      // Vida prática (food-logistics/finance-adjacent, a separate,
      // deliberately out-of-scope sibling path)
      'lista de compras',
      'orçamento',
      'despensa',
      'estoque doméstico',
      'nutrição',
      // General personal-finance terms that must never leak into
      // Culinária content at all (issue #95 section 22 territory)
      'poupança',
      'investimento',
      'dívida',
      'juros',
      'empréstimo',
      'cartão de crédito',
      'renda familiar',
    ];
    const haystack = [
      seedData.path.description,
      ...seedData.competencies.flatMap((c) => [c.title, ...c.starterObjectives]),
    ]
      .join(' ')
      .toLowerCase();

    for (const term of forbiddenTerms) {
      expect(haystack).not.toContain(term);
    }
  });

  it('never duplicates a Fundamentos competency code', () => {
    const foundationsCodes = new Set(foundationsSeedData.competencies.map((c) => c.code));
    for (const competency of seedData.competencies) {
      expect(foundationsCodes.has(competency.code)).toBe(false);
    }
  });
});
