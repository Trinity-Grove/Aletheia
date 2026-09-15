import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { ResilienceFormationSeeder } from '../src/modules/curriculum/infrastructure/resilience-formation.seeder.js';
import { ResilienceNavigationCampingSeeder } from '../src/modules/curriculum/infrastructure/resilience-navigation-camping.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildResilienceNavigationCampingSeedData } from '../src/modules/curriculum/infrastructure/resilience-navigation-camping.seed-data.js';

// Proves the Navegação/Acampamento paths actually publish a real,
// internally-consistent (existing RESILIENCE domain) -> (new paths) ->
// competencies hierarchy against real Postgres, and that re-running is
// idempotent -- same shape of proof as the trades per-trade seeders
// (#152, #153) and ResilienceFormationSeeder (#137).
describe('ResilienceNavigationCampingSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildResilienceNavigationCampingSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes every path and its competencies under the existing RESILIENCE domain, and is idempotent on re-run', async () => {
    const foundationSeeder = app.get(ResilienceFormationSeeder);
    await foundationSeeder.seed();

    const seeder = app.get(ResilienceNavigationCampingSeeder);
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

  it('keeps every outdoor-risk competency framed with adult supervision or age-appropriateness language', () => {
    // Every objective that touches orientation error or shelter/campsite
    // risk must carry explicit supervision/age-appropriateness framing,
    // per this project's child-safety principle (issue #95 section 35),
    // matching the tone PR #137 established.
    const supervisionMarkers = ['supervisão', 'adulto', 'acompanhado'];
    for (const pathData of seedData.paths) {
      for (const competency of pathData.competencies) {
        const text = competency.starterObjectives.join(' ').toLowerCase();
        const hasSupervisionLanguage = supervisionMarkers.some((marker) => text.includes(marker));
        expect(hasSupervisionLanguage).toBe(true);
      }
    }
  });

  it('stays scoped to Navegação/Acampamento -- no Primeiros-Socorros/Água/Fogo/Emergências-reais terms leaked in', () => {
    // Deliberately excludes seedData.domain.description from the
    // haystack: the shared domain-level description (owned by PR #137)
    // legitimately mentions "primeiros socorros" as the domain's
    // flagship path -- that's not a leak, it's the pre-existing parent
    // description this seeder defensively reuses. The real scope
    // boundary to prove is that the NEW path/competency content this
    // seeder introduces doesn't drift into adjacent subsections.
    const forbiddenTerms = [
      // Primeiros socorros
      'primeiros socorros',
      'queimadura',
      'engasgo',
      'ferimento',
      // Água (subsection)
      'potabilização',
      'purificação',
      'afogamento',
      'flutuação',
      // Fogo
      'fogueira',
      'extinção',
      'incêndio',
      // Emergências reais
      'enchente',
      'evacuação',
      'kit de emergência',
      'ponto de encontro',
      'tempestade',
      'rcp',
      'heimlich',
      // Culinária / Ofícios scope-neutrality
      'receita',
      'cozinhar',
      'ferramenta elétrica',
      'serra',
    ];
    const haystack = seedData.paths
      .flatMap((p) => [p.path.description, ...p.competencies.flatMap((c) => [c.title, ...c.starterObjectives])])
      .join(' ')
      .toLowerCase();

    for (const term of forbiddenTerms) {
      expect(haystack).not.toContain(term);
    }
  });

  it('never centers weapons or confrontation -- prevention/safety/helping tone only, per the issue\'s explicit framing', () => {
    // Word-boundary match, not substring: "arma" is a legitimate
    // substring of Portuguese words like "armazenamento" (storage) that
    // have nothing to do with weapons.
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
