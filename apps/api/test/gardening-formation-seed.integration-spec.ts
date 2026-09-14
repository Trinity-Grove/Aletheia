import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { GardeningFormationSeeder } from '../src/modules/curriculum/infrastructure/gardening-formation.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { buildGardeningFormationSeedData } from '../src/modules/curriculum/infrastructure/gardening-formation.seed-data.js';

// Proves the "Plantio" foundational seed (issue #95 section 19) actually
// publishes a real, internally-consistent domain -> path -> competencies
// hierarchy against real Postgres, and that re-running it is idempotent
// (no duplicates, no altered rows) -- same shape of proof as
// BiblicalFormationSeeder (#131), MusicFormationSeeder (#132),
// TradesFormationSeeder (#134), and CookingFormationSeeder (#135).
describe('GardeningFormationSeeder (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const seedData = buildGardeningFormationSeedData();

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes the domain, path and every competency, and is idempotent on re-run', async () => {
    const seeder = app.get(GardeningFormationSeeder);

    // Don't assume a pristine database -- this suite may run against a
    // persistent local Postgres that already has this content from an
    // earlier invocation (CI always starts fresh, but local dev doesn't).
    // The real idempotency proof isn't "the first call reports fully
    // created" (that depends on starting state); it's that *any* call
    // made after the content already exists reports nothing new -- so
    // calling seed() twice in a row and asserting the second call is a
    // total no-op holds regardless of what state the first call found.
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
    // internally consistent with the domain/path just created --
    // "created hierarchy (domain -> path -> competencies) is internally
    // consistent" per the task's own verification requirement.
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
    // pointers resolve back to the same two rows (not, say, ten
    // accidental duplicate domains).
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

  it('stays neutral to Produção/Manejo/Planejamento -- no specialization terms leaked into this foundational slice', async () => {
    // Sanity check for the scope boundary documented in
    // gardening-formation.seed-data.ts: this slice covers only section
    // 19's "Fundamentos" subsection, not "Produção" (what you grow),
    // "Manejo" (ongoing care and harvest), or "Planejamento"
    // (record-keeping). This asserts that boundary was actually
    // respected in the content, not just claimed in a comment.
    const forbiddenTerms = [
      // Produção
      'horta',
      'hortaliças',
      'temperos',
      'frutas',
      'vasos',
      'agricultura urbana',
      // Manejo
      'pragas',
      'colheita',
      'armazenamento',
      // Planejamento
      'calendário',
      'diário',
      'produtividade',
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
