import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { GardeningFormationSeeder } from '../src/modules/curriculum/infrastructure/gardening-formation.seeder.js';
import { GardeningProductionSeeder } from '../src/modules/curriculum/infrastructure/gardening-production.seeder.js';
import { GardeningManagementPlanningSeeder } from '../src/modules/curriculum/infrastructure/gardening-management-planning.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildGardeningManagementPlanningSeedData } from '../src/modules/curriculum/infrastructure/gardening-management-planning.seed-data.js';

// Proves the Manejo/Planejamento paths (issue #95 section 19) actually
// publish a real, internally-consistent (existing GARDENING domain) ->
// (new paths) -> competencies hierarchy against real Postgres, and that
// re-running is idempotent -- same shape of proof as gardening-production
// (previous PR) and the Resiliência multi-PR sequence (#157/#160/#161).
describe('GardeningManagementPlanningSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildGardeningManagementPlanningSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes every path and its competencies under the existing GARDENING domain, and is idempotent on re-run', async () => {
    const foundationSeeder = app.get(GardeningFormationSeeder);
    await foundationSeeder.seed();
    const productionSeeder = app.get(GardeningProductionSeeder);
    await productionSeeder.seed();

    const seeder = app.get(GardeningManagementPlanningSeeder);
    await seeder.seed();
    const secondRun = await seeder.seed();
    expect(secondRun.domainCreated).toBe(false);
    expect(secondRun.pathsCreated).toBe(0);
    expect(secondRun.competenciesCreated).toBe(0);

    const domains = await prisma.learningDomain.findMany({ where: { code: seedData.domain.code } });
    expect(domains).toHaveLength(1);
    const domain = domains[0]!;
    expect(domain.status).toBe('PUBLISHED');

    expect(seedData.paths.length).toBe(2);
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
        // PR #154 taxonomy requirement: domain-proficiency progression.
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

  it('keeps pest control organic/manual, child-appropriate, and never references aggressive chemical products', () => {
    const pestCompetency = seedData.paths
      .find((p) => p.path.code === 'GARDENING.MANAGEMENT')!
      .competencies.find((c) => c.code === 'GARDENING.MANAGEMENT.PEST_CONTROL')!;
    const text = pestCompetency.starterObjectives.join(' ').toLowerCase();

    const forbiddenChemicalTerms = ['agrotóxico', 'pesticida químico', 'veneno', 'inseticida químico'];
    for (const term of forbiddenChemicalTerms) {
      expect(text).not.toContain(term);
    }
    expect(text).toContain('orgânic');
  });

  it('stays scoped to Manejo/Planejamento -- no Fundamentos/Produção terms leaked in', () => {
    const forbiddenTerms = [
      // Fundamentos (GARDENING.FOUNDATIONS, PR #136)
      'germinação',
      'substrato',
      'compostagem',
      // Produção (previous PR)
      'horta comunitária',
      'agricultura urbana',
      'cultivo em vasos',
      // Culinária (COOKING domain) scope-neutrality -- storage/harvest is
      // in scope, cooking-based preservation technique is not.
      'receita',
      'cozinhar',
      'fermentação',
      'conserva de cozinha',
      // Ofícios (TRADES domain) scope-neutrality
      'equipamento de proteção',
      'ferramenta elétrica',
    ];
    const haystack = seedData.paths
      .flatMap((p) => [p.path.description, ...p.competencies.flatMap((c) => [c.title, ...c.starterObjectives])])
      .join(' ')
      .toLowerCase();

    for (const term of forbiddenTerms) {
      expect(haystack).not.toContain(term);
    }
  });
});
