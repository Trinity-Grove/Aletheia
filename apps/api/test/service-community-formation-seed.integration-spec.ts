import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { ServiceCommunityFormationSeeder } from '../src/modules/curriculum/infrastructure/service-community-formation.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildServiceCommunityFormationSeedData } from '../src/modules/curriculum/infrastructure/service-community-formation.seed-data.js';

// Proves the "Serviço e Comunidade" foundational seed (issue #95 section
// 24) actually publishes a real, internally-consistent domain -> path ->
// competencies hierarchy against real Postgres, and that re-running it
// is idempotent (no duplicates, no altered rows) -- same shape of proof
// as PhysicalFormationSeeder (#169) and the other Domain -> Path ->
// Competency seeders.
describe('ServiceCommunityFormationSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildServiceCommunityFormationSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes the domain, path and every competency, and is idempotent on re-run', async () => {
    const seeder = app.get(ServiceCommunityFormationSeeder);

    // Don't assume a pristine database -- this suite may run against a
    // persistent local Postgres that already has this content from an
    // earlier invocation. The idempotency proof is that *any* call made
    // after the content already exists reports nothing new, so calling
    // seed() twice in a row and asserting the second call is a total
    // no-op holds regardless of what state the first call found.
    await seeder.seed();
    const secondRun = await seeder.seed();
    expect(secondRun.domainCreated).toBe(false);
    expect(secondRun.pathCreated).toBe(false);
    expect(secondRun.competenciesCreated).toBe(0);

    // Exactly one domain row, PUBLISHED, matching the seed data.
    const domains = await prisma.learningDomain.findMany({ where: { code: seedData.domain.code } });
    expect(domains).toHaveLength(1);
    const domain = domains[0]!;
    expect(domain.status).toBe('PUBLISHED');
    expect(domain.name).toBe(seedData.domain.name);
    expect(domain.publishedAt).not.toBeNull();

    // Exactly one path row, PUBLISHED, belonging to that exact domain.
    const paths = await prisma.learningPath.findMany({ where: { code: seedData.path.code } });
    expect(paths).toHaveLength(1);
    const path = paths[0]!;
    expect(path.status).toBe('PUBLISHED');
    expect(path.domainId).toBe(domain.id);

    // Every competency exists exactly once, is PUBLISHED, and is
    // internally consistent with the domain/path just created.
    for (const competencySeed of seedData.competencies) {
      const rows = await prisma.competencyDefinition.findMany({ where: { code: competencySeed.code } });
      expect(rows).toHaveLength(1);
      const row = rows[0]!;
      expect(row.status).toBe('PUBLISHED');
      expect(row.domainId).toBe(domain.id);
      expect(row.pathId).toBe(path.id);
      expect(row.title).toBe(competencySeed.title);
      const metadata = row.metadata as { starterObjectives?: string[] };
      expect(metadata.starterObjectives?.length).toBeGreaterThan(0);
    }

    // No cross-contamination: every seeded competency's domain/path
    // pointers resolve back to the same two rows.
    const allCompetencyDomainIds = new Set(
      (
        await prisma.competencyDefinition.findMany({
          where: { code: { in: seedData.competencies.map((c) => c.code) } },
          select: { domainId: true, pathId: true },
        })
      ).flatMap((row) => [row.domainId, row.pathId]),
    );
    expect(allCompetencyDomainIds).toEqual(new Set([domain.id, path.id]));
  });

  it('stays interdenominational -- no doctrinal-position or denomination-specific terms leaked into this foundational slice', async () => {
    // Sanity check for the neutrality principle documented in
    // service-community-formation.seed-data.ts (issue #96 / issue #95
    // section 4): "Serviço na Comunidade de Fé" must not assume or
    // privilege any specific denomination, worship tradition, or
    // doctrinal position. Same forbidden-term shape as
    // biblical-formation-seed.integration-spec.ts (PR #131).
    const forbiddenTerms = [
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
      'predestina',
      'arrebatamento',
      'batismo infantil',
      'infalibilidade papal',
      'sola fide',
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

  it('does not duplicate the deliberately excluded registro/portfólio mechanism items as new catalog content', async () => {
    // Sanity check for the reuse-not-build boundary documented in
    // service-community-formation.seed-data.ts: "Registro de
    // atividades" and "Portfólio de serviço" are deliberately NOT
    // competencies here (served by the existing EvidenceSubmission/
    // portfolio infrastructure instead).
    const competencyTitles = seedData.competencies.map((c) => c.title.toLowerCase());
    expect(competencyTitles).not.toContain('registro de atividades');
    expect(competencyTitles).not.toContain('portfólio de serviço');
    expect(competencyTitles).not.toContain('portfolio de serviço');
  });
});
