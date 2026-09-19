import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { PedagogicalFramework } from '@aletheia/contracts';
import { createApplication } from '../src/main.js';
import { CurriculumTemplateEngine } from '../src/modules/curriculum/infrastructure/curriculum-template.engine.js';
import { PedagogicalModelDefinitionResolver } from '../src/modules/curriculum/infrastructure/pedagogical-model-definition.resolver.js';
import { PedagogicalModelDefinitionSeeder } from '../src/modules/curriculum/infrastructure/pedagogical-model-definition.seeder.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';

// Proves the data-driven resolver (reads pedagogical_model_definitions from
// Postgres) is equivalent to the pre-existing hardcoded
// CurriculumTemplateEngine switch-case, for every framework it covers --
// the acceptance bar for issue #96 Fase 0, deliverable 4. Both code paths
// are compared here only as a compatibility proof. The application reads
// the catalog; the old engine is a baseline fixture for migration content.
describe('Pedagogical model definition resolver equivalence (real Postgres)', () => {
  let app: NestFastifyApplication;
  let resolver: PedagogicalModelDefinitionResolver;
  const engine = new CurriculumTemplateEngine();

  const TEMPLATE_BEARING_FRAMEWORKS: Exclude<PedagogicalFramework, 'CUSTOM'>[] = [
    'CLASSICAL_TRIVIUM',
    'CHARLOTTE_MASON',
    'TRADITIONAL',
    'UNIT_STUDIES',
    'MONTESSORI',
    'PROJECT_BASED',
    'GUIDED_UNSCHOOLING',
    'ECLECTIC',
  ];

  beforeAll(async () => {
    app = await createApplication();
    await app.init();

    // Do not seed here: this must prove migration-only installations work.
    resolver = app.get(PedagogicalModelDefinitionResolver);
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(TEMPLATE_BEARING_FRAMEWORKS)(
    'returns the exact same subject definitions as CurriculumTemplateEngine for %s',
    async (framework) => {
      const fromData = await resolver.getSubjectDefinitions(framework);
      const fromEngine = engine.getTemplateDefinitions(framework);
      expect(fromData).toEqual(fromEngine);
    },
  );

  it('returns an empty list for a code with no PUBLISHED definition', async () => {
    const result = await resolver.getSubjectDefinitions('DOES_NOT_EXIST');
    expect(result).toEqual([]);
  });

  it('preserves the migration-installed versions when the seed is rerun', async () => {
    const prisma = app.get(PrismaService);
    const query = { where: { code: { in: TEMPLATE_BEARING_FRAMEWORKS }, version: 1 }, orderBy: { code: 'asc' as const } };
    const before = await prisma.pedagogicalModelDefinition.findMany(query);
    expect(before).toHaveLength(8);
    await app.get(PedagogicalModelDefinitionSeeder).seed();
    const after = await prisma.pedagogicalModelDefinition.findMany(query);
    expect(after).toEqual(before);
  });

  describe('listPublishedCatalog (issue #96 section 35, family-facing template catalog)', () => {
    it('includes every migration-installed framework exactly once', async () => {
      const catalog = await resolver.listPublishedCatalog();
      const codes = catalog.map((entry) => entry.code);
      for (const framework of TEMPLATE_BEARING_FRAMEWORKS) {
        expect(codes.filter((code) => code === framework)).toHaveLength(1);
      }
    });

    it('returns only code/name/description, no admin-facing fields', async () => {
      const catalog = await resolver.listPublishedCatalog();
      const montessori = catalog.find((entry) => entry.code === 'MONTESSORI');
      expect(montessori).toBeDefined();
      expect(Object.keys(montessori!).sort()).toEqual(['code', 'description', 'name', 'subjects']);
    });

    it('picks up a brand-new PUBLISHED code with no code change or deploy', async () => {
      const prisma = app.get(PrismaService);
      const code = `TEST.CATALOG.${Date.now()}`;
      await prisma.pedagogicalModelDefinition.create({
        data: { code, status: 'PUBLISHED', name: 'Catalog-Only Test Model', publishedAt: new Date() },
      });

      const catalog = await resolver.listPublishedCatalog();
      expect(catalog.find((entry) => entry.code === code)?.name).toBe('Catalog-Only Test Model');
    });

    it('excludes DRAFT rows and returns only the latest version per code', async () => {
      const prisma = app.get(PrismaService);
      const code = `TEST.CATALOG.VERSIONED.${Date.now()}`;
      await prisma.pedagogicalModelDefinition.create({
        data: { code, version: 1, status: 'PUBLISHED', name: 'Old Version', publishedAt: new Date() },
      });
      await prisma.pedagogicalModelDefinition.create({
        data: { code, version: 2, status: 'PUBLISHED', name: 'New Version', publishedAt: new Date() },
      });
      const draftCode = `TEST.CATALOG.DRAFT.${Date.now()}`;
      await prisma.pedagogicalModelDefinition.create({
        data: { code: draftCode, status: 'DRAFT', name: 'Should Not Appear' },
      });

      const catalog = await resolver.listPublishedCatalog();
      const matchingVersioned = catalog.filter((entry) => entry.code === code);
      expect(matchingVersioned).toHaveLength(1);
      expect(matchingVersioned[0]?.name).toBe('New Version');
      expect(catalog.find((entry) => entry.code === draftCode)).toBeUndefined();
    });
  });
});
