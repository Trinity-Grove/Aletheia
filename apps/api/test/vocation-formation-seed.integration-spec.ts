import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { VocationFormationSeeder } from '../src/modules/curriculum/infrastructure/vocation-formation.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildVocationFormationSeedData } from '../src/modules/curriculum/infrastructure/vocation-formation.seed-data.js';

// Proves the "Vocação" foundational seed (issue #95 section 17) actually
// publishes a real, internally-consistent domain -> two paths ->
// competencies hierarchy against real Postgres, and that re-running it is
// idempotent (no duplicates, no altered rows) -- same shape of proof as
// technology-formation-seed.integration-spec.ts (#167).
describe('VocationFormationSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildVocationFormationSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes the domain, both paths and every competency, and is idempotent on re-run', async () => {
    const seeder = app.get(VocationFormationSeeder);

    // Don't assume a pristine database -- the idempotency proof is that
    // *any* call made after the content already exists reports nothing
    // new, not that the very first call reports fully created.
    await seeder.seed();
    const secondRun = await seeder.seed();
    expect(secondRun.domainCreated).toBe(false);
    expect(secondRun.pathsCreated).toBe(0);
    expect(secondRun.competenciesCreated).toBe(0);

    const domains = await prisma.learningDomain.findMany({ where: { code: seedData.domain.code } });
    expect(domains).toHaveLength(1);
    const domain = domains[0]!;
    expect(domain.status).toBe('PUBLISHED');
    expect(domain.name).toBe(seedData.domain.name);
    expect(domain.publishedAt).not.toBeNull();

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
        // Taxonomy requirement (PR #154): practical/proficiency-tracked
        // domains like Vocação progress by DOMAIN_PROFICIENCY, not by
        // school stage.
        expect(metadata.progressionAxis).toBe('DOMAIN_PROFICIENCY');
      }
    }

    // No cross-contamination between the two sibling paths.
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

  it('covers exactly the 13 items enumerated in issue #95 section 17, one competency each', () => {
    const totalCompetencies = seedData.paths.reduce((sum, p) => sum + p.competencies.length, 0);
    expect(totalCompetencies).toBe(13);
  });

  it('stays interdenominational and historical/descriptive -- no doctrinal-position or denominational terms in the seeded rows', () => {
    // Sanity check for the neutrality constraint documented in
    // vocation-formation.seed-data.ts: "Reflexão sobre Vocação Cristã" and
    // "Trabalho Entendido como Serviço e Responsabilidade" must stay
    // narrative/historical/comparative, never a doctrinal position
    // statement or an endorsement of one denomination's reading of
    // vocação/chamado over another -- same technique as PR #131's
    // biblical-formation and PR #158's music-christian neutrality tests.
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
      // Doctrinal-position / single-answer language
      'predestina',
      'infalibilidade papal',
      'única forma correta',
      'única maneira certa',
      'única interpretação correta',
      'a verdadeira vocação é',
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

  it('stays scope-neutral -- no Tecnologia or Ofícios/TRADES-domain vocabulary leaked into this slice', () => {
    // Sanity check against the adjacent TECHNOLOGY (issue #95 section 16,
    // PR #167) and TRADES (section 15) domains: Vocação is about
    // self-discovery, mentorship and career/purpose practice in general,
    // not a restatement of any one specific craft or technical
    // specialization's vocabulary.
    const adjacentDomainTerms = [
      'programação',
      'arduino',
      'esp32',
      'impressão 3d',
      'marcenaria',
      'carpintaria',
      'costura',
      'hidráulica',
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

    for (const term of adjacentDomainTerms) {
      expect(haystack).not.toContain(term);
    }
  });
});
