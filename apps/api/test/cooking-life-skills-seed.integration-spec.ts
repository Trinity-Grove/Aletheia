import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { CookingFormationSeeder } from '../src/modules/curriculum/infrastructure/cooking-formation.seeder.js';
import { CookingLifeSkillsSeeder } from '../src/modules/curriculum/infrastructure/cooking-life-skills.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildCookingLifeSkillsSeedData } from '../src/modules/curriculum/infrastructure/cooking-life-skills.seed-data.js';
import { buildCookingFormationSeedData } from '../src/modules/curriculum/infrastructure/cooking-formation.seed-data.js';
import { buildCookingProgressionSeedData } from '../src/modules/curriculum/infrastructure/cooking-progression.seed-data.js';

// Proves the Vida Prática na Cozinha path actually publishes a real,
// internally-consistent (existing COOKING domain) -> (new path) ->
// competencies hierarchy against real Postgres, and that re-running is
// idempotent -- same shape of proof as cooking-progression (#162) and
// every prior seed in this file group.
describe('CookingLifeSkillsSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildCookingLifeSkillsSeedData();
  const foundationsSeedData = buildCookingFormationSeedData();
  const progressionSeedData = buildCookingProgressionSeedData();

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

    const seeder = app.get(CookingLifeSkillsSeeder);
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

  it('stays scoped to food-specific household logistics -- no general personal/family-finance terms leaked in', () => {
    // The domain-boundary decision (see cooking-life-skills.seed-data.ts
    // and the comment posted on issue #95): "orçamento" and "custo por
    // refeição" stay scoped to kitchen-management skills (estimating and
    // comparing a grocery list, dividing a cooked dish's ingredient cost
    // by portions), never growing into general personal/family finance
    // (issue #95 section 22, "Educação financeira prática" -- a
    // deliberately out-of-scope, not-yet-built domain).
    const forbiddenTerms = [
      'poupança',
      'investimento',
      'dívida',
      'juros',
      'empréstimo',
      'cartão de crédito',
      'renda familiar',
      'empreendedorismo',
      'consumo responsável',
    ];
    // Deliberately excludes seedData.path.description from the haystack:
    // it legitimately names "educação financeira" once, in a negation
    // ("não é educação financeira geral") that documents the boundary
    // decision itself, not a leak into the taught competency content.
    // The actual competency titles/objectives below are what must stay
    // clean of general-finance vocabulary.
    const haystack = seedData.competencies
      .flatMap((c) => [c.title, ...c.starterObjectives])
      .join(' ')
      .toLowerCase();

    for (const term of forbiddenTerms) {
      expect(haystack).not.toContain(term);
    }
  });

  it('keeps the money-adjacent competencies (orçamento, custo por refeição) explicitly framed as kitchen-management skills', () => {
    const budget = seedData.competencies.find((c) => c.code === 'COOKING.LIFE_SKILLS.BUDGET');
    const costPerMeal = seedData.competencies.find((c) => c.code === 'COOKING.LIFE_SKILLS.COST_PER_MEAL');
    expect(budget).toBeDefined();
    expect(costPerMeal).toBeDefined();

    const kitchenFramingMarkers = ['gestão da cozinha', 'lista de compras', 'ingredientes'];
    for (const competency of [budget!, costPerMeal!]) {
      const text = competency.starterObjectives.join(' ').toLowerCase();
      const hasKitchenFraming = kitchenFramingMarkers.some((marker) => text.includes(marker));
      expect(hasKitchenFraming).toBe(true);
    }
  });

  it('stays scoped to Vida prática -- no Fundamentos or Progressão terms leaked in, and no competency-code collision', () => {
    const forbiddenTerms = [
      // Fundamentos (COOKING.FOUNDATIONS)
      'higiene',
      'segurança alimentar',
      'facas',
      // Progressão (COOKING.PROGRESSION)
      'panificação',
      'fermentação',
      'aproveitamento integral',
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

    const foundationsCodes = new Set(foundationsSeedData.competencies.map((c) => c.code));
    const progressionCodes = new Set(progressionSeedData.competencies.map((c) => c.code));
    for (const competency of seedData.competencies) {
      expect(foundationsCodes.has(competency.code)).toBe(false);
      expect(progressionCodes.has(competency.code)).toBe(false);
    }
  });
});
