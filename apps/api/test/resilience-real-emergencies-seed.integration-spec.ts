import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { ResilienceFormationSeeder } from '../src/modules/curriculum/infrastructure/resilience-formation.seeder.js';
import { ResilienceRealEmergenciesSeeder } from '../src/modules/curriculum/infrastructure/resilience-real-emergencies.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildResilienceRealEmergenciesSeedData } from '../src/modules/curriculum/infrastructure/resilience-real-emergencies.seed-data.js';

// Proves the Emergências Reais path actually publishes a real,
// internally-consistent (existing RESILIENCE domain) -> (new path) ->
// competencies hierarchy against real Postgres, and that re-running is
// idempotent -- same shape of proof as resilience-navigation-camping
// (#157) and resilience-water-fire (#160), and every prior seed in this
// file group. This is the last of the 3 sibling PRs, completing issue
// #95 section 20.
describe('ResilienceRealEmergenciesSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildResilienceRealEmergenciesSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes the path and every competency under the existing RESILIENCE domain, and is idempotent on re-run', async () => {
    const foundationSeeder = app.get(ResilienceFormationSeeder);
    await foundationSeeder.seed();

    const seeder = app.get(ResilienceRealEmergenciesSeeder);
    await seeder.seed();
    const secondRun = await seeder.seed();
    expect(secondRun.domainCreated).toBe(false);
    expect(secondRun.pathsCreated).toBe(0);
    expect(secondRun.competenciesCreated).toBe(0);

    const domains = await prisma.learningDomain.findMany({ where: { code: seedData.domain.code } });
    expect(domains).toHaveLength(1);
    const domain = domains[0]!;
    expect(domain.status).toBe('PUBLISHED');

    expect(seedData.paths.length).toBe(1);
    expect(seedData.paths[0]!.competencies.length).toBe(10);
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

  it('keeps every emergency-response competency framed with adult supervision or age-appropriateness language', () => {
    // This project's child-safety principle (issue #95 section 35)
    // requires explicit supervision/age-appropriateness framing for
    // every objective involving physical risk -- matching the tone PR
    // #137 established.
    const supervisionMarkers = ['supervisão', 'adulto', 'acompanhado'];
    for (const pathData of seedData.paths) {
      for (const competency of pathData.competencies) {
        const text = competency.starterObjectives.join(' ').toLowerCase();
        const hasSupervisionLanguage = supervisionMarkers.some((marker) => text.includes(marker));
        expect(hasSupervisionLanguage).toBe(true);
      }
    }
  });

  it('stays scoped to Emergências reais -- no Primeiros-Socorros/Navegação/Acampamento/Água/Fogo content leaked or duplicated in', () => {
    // Deliberately excludes seedData.domain.description from the
    // haystack -- see resilience-navigation-camping-seed.integration-spec.ts
    // for why (the shared domain description legitimately references
    // Primeiros Socorros as the domain's flagship path, pre-existing #137
    // content this seeder defensively reuses, not a leak).
    const forbiddenTerms = [
      // Primeiros socorros (including CPR/Heimlich, deliberately not
      // duplicated here -- see the seed-data.ts scope-neutrality note)
      'primeiros socorros',
      'queimadura',
      'engasgo',
      'ferimento',
      'rcp',
      'heimlich',
      // Navegação
      'bússola',
      'pontos cardeais',
      // Acampamento
      'barraca',
      'leave no trace',
      // Água (subsection)
      'potabilização',
      'purificação',
      'filtragem',
      'fervura',
      // Fogo (prevention/campfire/extinguishing skills, not the
      // crisis-response FIRES competency's own content)
      'fogueira',
      'extinção',
      'acender',
      // Culinária / Ofícios scope-neutrality
      'receita',
      'cozinhar',
      'ferramenta elétrica',
    ];
    const haystack = seedData.paths
      .flatMap((p) => [p.path.description, ...p.competencies.flatMap((c) => [c.title, ...c.starterObjectives])])
      .join(' ')
      .toLowerCase();

    for (const term of forbiddenTerms) {
      const wordBoundaryPattern = new RegExp(`\\b${term}\\b`, 'i');
      expect(wordBoundaryPattern.test(haystack)).toBe(false);
    }
  });

  it('never centers weapons or confrontation -- prevention/safety/helping tone only, per the issue\'s explicit framing', () => {
    const forbiddenTerms = ['arma', 'confronto', 'defesa pessoal', 'ataque', 'combate'];
    const haystack = [
      seedData.domain.description,
      ...seedData.paths.flatMap((p) => [p.path.description, ...p.competencies.flatMap((c) => [c.title, ...c.starterObjectives])]),
    ]
      .join(' ')
      .toLowerCase();

    for (const term of forbiddenTerms) {
      const wordBoundaryPattern = new RegExp(`\\b${term}\\b`, 'i');
      expect(wordBoundaryPattern.test(haystack)).toBe(false);
    }
  });
});
