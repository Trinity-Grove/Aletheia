import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { GardeningFormationSeeder } from '../src/modules/curriculum/infrastructure/gardening-formation.seeder.js';
import { GardeningProductionSeeder } from '../src/modules/curriculum/infrastructure/gardening-production.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildGardeningProductionSeedData } from '../src/modules/curriculum/infrastructure/gardening-production.seed-data.js';

// Proves the "Produção" path (issue #95 section 19) actually publishes a
// real, internally-consistent (existing GARDENING domain) -> (new path)
// -> competencies hierarchy against real Postgres, and that re-running is
// idempotent -- same shape of proof as gardening-formation (#136) and the
// Resiliência multi-PR sequence (#157/#160/#161).
describe('GardeningProductionSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildGardeningProductionSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes the path and every competency under the existing GARDENING domain, and is idempotent on re-run', async () => {
    const foundationSeeder = app.get(GardeningFormationSeeder);
    await foundationSeeder.seed();

    const seeder = app.get(GardeningProductionSeeder);
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

  it('stays scoped to Produção -- no Fundamentos/Manejo/Planejamento terms leaked in', () => {
    const forbiddenTerms = [
      // Fundamentos (GARDENING.FOUNDATIONS, PR #136) -- germination/soil
      // basics this path assumes as a prerequisite, not repeats.
      'germinação',
      'substrato',
      'compostagem',
      'irrigação',
      // Manejo (next PR)
      'praga',
      'colheita',
      'armazenamento',
      'conservação',
      // Planejamento (next PR)
      'calendário de plantio',
      'diário da horta',
      'registro de cultivo',
      // Culinária (COOKING domain) scope-neutrality -- growing/identifying
      // is in scope, cooking technique is not.
      'receita',
      'cozinhar',
      'fogão',
      'tempero de cozinha',
      // Ofícios (TRADES domain) scope-neutrality -- tool safety is not
      // this path's concern.
      'equipamento de proteção',
      'ferramenta elétrica',
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
});
