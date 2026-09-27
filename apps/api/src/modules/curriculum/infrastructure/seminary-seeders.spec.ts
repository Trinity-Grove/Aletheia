import { SeminaryEvidenceTypesSeeder } from './seminary-evidence-types.seeder.js';
import { SeminaryRubricsSeeder } from './seminary-rubrics.seeder.js';
import { SeminaryCompetenciesSeeder } from './seminary-competencies.seeder.js';
import { AdvancedSeminaryTheologyPackSeeder } from './advanced-seminary-theology-pack.seeder.js';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import {
  SEMINARY_EVIDENCE_TYPE_CODES,
  SEMINARY_THEOLOGY_RUBRIC_DEFINITION,
  SEMINARY_THEOLOGY_COMPETENCIES,
  SEMINARY_DISCIPLINES_METADATA,
  SEMINARY_THEOLOGY_PACK_PAYLOAD,
} from '@aletheia/contracts';

describe('Seminary Seeders', () => {
  describe('SeminaryEvidenceTypesSeeder', () => {
    it('seeds all 5 seminary evidence types idempotently', async () => {
      const persisted = new Map<string, any>();
      const upsert = jest.fn().mockImplementation(async ({ where, create, update }) => {
        const key = `${where.code_version.code}_v${where.code_version.version}`;
        if (persisted.has(key)) {
          const updated = { ...persisted.get(key), ...update };
          persisted.set(key, updated);
          return updated;
        }
        persisted.set(key, { ...create, id: `evidence-${where.code_version.code}` });
        return persisted.get(key);
      });

      const prisma = {
        evidenceTypeDefinition: { upsert },
      } as unknown as PrismaService;

      const seeder = new SeminaryEvidenceTypesSeeder(prisma);
      const count = await seeder.seed();

      expect(count).toBe(5);
      expect(upsert).toHaveBeenCalledTimes(5);
      expect(persisted.size).toBe(5);

      for (const code of SEMINARY_EVIDENCE_TYPE_CODES) {
        const item = persisted.get(`${code}_v1`);
        expect(item).toBeDefined();
        expect(item.code).toBe(code);
        expect(item.version).toBe(1);
        expect(item.status).toBe('PUBLISHED');
        expect(item.name).toBeTruthy();
        expect(item.description).toBeTruthy();
      }

      // Re-run for idempotency
      const rerunCount = await seeder.seed();
      expect(rerunCount).toBe(5);
      expect(persisted.size).toBe(5);
    });
  });

  describe('SeminaryRubricsSeeder', () => {
    it('seeds the theology academic rigor rubric with 4 weighted criteria idempotently', async () => {
      const persistedRubrics = new Map<string, any>();
      const persistedCriteria = new Map<string, any>();

      const rubricUpsert = jest.fn().mockImplementation(async ({ where, create, update }) => {
        const key = `${where.code_version.code}_v${where.code_version.version}`;
        if (persistedRubrics.has(key)) {
          const updated = { ...persistedRubrics.get(key), ...update };
          persistedRubrics.set(key, updated);
          return updated;
        }
        const created = { ...create, id: 'rubric-theology-rigor-id' };
        persistedRubrics.set(key, created);
        return created;
      });

      const criteriaUpsert = jest.fn().mockImplementation(async ({ where, create, update }) => {
        const key = `${where.rubricId_code.rubricId}_${where.rubricId_code.code}`;
        if (persistedCriteria.has(key)) {
          const updated = { ...persistedCriteria.get(key), ...update };
          persistedCriteria.set(key, updated);
          return updated;
        }
        const created = { ...create, id: `crit-${where.rubricId_code.code}` };
        persistedCriteria.set(key, created);
        return created;
      });

      const prisma = {
        rubricDefinition: { upsert: rubricUpsert },
        rubricCriterion: { upsert: criteriaUpsert },
      } as unknown as PrismaService;

      const seeder = new SeminaryRubricsSeeder(prisma);
      const result = await seeder.seed();

      expect(result.rubricCode).toBe(SEMINARY_THEOLOGY_RUBRIC_DEFINITION.code);
      expect(result.criteriaCount).toBe(4);
      expect(persistedRubrics.size).toBe(1);
      expect(persistedCriteria.size).toBe(4);

      const rubric = persistedRubrics.get(`${SEMINARY_THEOLOGY_RUBRIC_DEFINITION.code}_v1`);
      expect(rubric).toBeDefined();
      expect(rubric.status).toBe('PUBLISHED');
      expect(rubric.version).toBe(1);
      expect(rubric.name).toBe('Rubrica de Rigor Teológico e Exegético');

      for (const criterion of SEMINARY_THEOLOGY_RUBRIC_DEFINITION.criteria) {
        const crit = persistedCriteria.get(`rubric-theology-rigor-id_${criterion.code}`);
        expect(crit).toBeDefined();
        expect(crit.rubricId).toBe('rubric-theology-rigor-id');
        expect(crit.label).toBe(criterion.name);
        expect(crit.weight).toBe(criterion.weight);
      }

      // Re-run for idempotency
      const rerunResult = await seeder.seed();
      expect(rerunResult.criteriaCount).toBe(4);
      expect(persistedRubrics.size).toBe(1);
      expect(persistedCriteria.size).toBe(4);
    });
  });

  describe('SeminaryCompetenciesSeeder', () => {
    it('seeds domain FAITH.THEOLOGY, path FAITH.THEOLOGY.SEMINARY, and all 24 competencies idempotently', async () => {
      const persistedDomains = new Map<string, any>();
      const persistedPaths = new Map<string, any>();
      const persistedCompetencies = new Map<string, any>();

      const domainUpsert = jest.fn().mockImplementation(async ({ where, create, update }) => {
        const key = `${where.code_version.code}_v${where.code_version.version}`;
        if (persistedDomains.has(key)) {
          const updated = { ...persistedDomains.get(key), ...update };
          persistedDomains.set(key, updated);
          return updated;
        }
        const created = { ...create, id: 'domain-faith-theology-id' };
        persistedDomains.set(key, created);
        return created;
      });

      const pathUpsert = jest.fn().mockImplementation(async ({ where, create, update }) => {
        const key = `${where.code_version.code}_v${where.code_version.version}`;
        if (persistedPaths.has(key)) {
          const updated = { ...persistedPaths.get(key), ...update };
          persistedPaths.set(key, updated);
          return updated;
        }
        const created = { ...create, id: 'path-faith-theology-seminary-id' };
        persistedPaths.set(key, created);
        return created;
      });

      const competencyUpsert = jest.fn().mockImplementation(async ({ where, create, update }) => {
        const key = `${where.code_version.code}_v${where.code_version.version}`;
        if (persistedCompetencies.has(key)) {
          const updated = { ...persistedCompetencies.get(key), ...update };
          persistedCompetencies.set(key, updated);
          return updated;
        }
        const created = { ...create, id: `comp-${where.code_version.code}` };
        persistedCompetencies.set(key, created);
        return created;
      });

      const prisma = {
        learningDomain: { upsert: domainUpsert },
        learningPath: { upsert: pathUpsert },
        competencyDefinition: { upsert: competencyUpsert },
      } as unknown as PrismaService;

      const seeder = new SeminaryCompetenciesSeeder(prisma);
      const result = await seeder.seed();

      expect(result.domainCreatedOrFound).toBe('FAITH.THEOLOGY');
      expect(result.pathCreatedOrFound).toBe('FAITH.THEOLOGY.SEMINARY');
      expect(result.competenciesCount).toBe(24);

      const domain = persistedDomains.get('FAITH.THEOLOGY_v1');
      expect(domain).toBeDefined();
      expect(domain.name).toBe('Teologia e Formação Ministerial');
      expect(domain.status).toBe('PUBLISHED');

      const path = persistedPaths.get('FAITH.THEOLOGY.SEMINARY_v1');
      expect(path).toBeDefined();
      expect(path.domainId).toBe('domain-faith-theology-id');
      expect(path.name).toBe('Formação Teológica de Nível Seminário');
      expect(path.status).toBe('PUBLISHED');

      expect(persistedCompetencies.size).toBe(24);
      for (const compCode of SEMINARY_THEOLOGY_COMPETENCIES) {
        const comp = persistedCompetencies.get(`${compCode}_v1`);
        expect(comp).toBeDefined();
        expect(comp.domainId).toBe('domain-faith-theology-id');
        expect(comp.pathId).toBe('path-faith-theology-seminary-id');
        expect(comp.status).toBe('PUBLISHED');
        expect(comp.title).toBeTruthy();
        expect(comp.level).toBeGreaterThanOrEqual(1);
        expect(comp.level).toBeLessThanOrEqual(4);
        expect(comp.metadata.topics.length).toBeGreaterThan(0);
      }

      // Re-run for idempotency
      const rerun = await seeder.seed();
      expect(rerun.competenciesCount).toBe(24);
      expect(persistedCompetencies.size).toBe(24);
    });
  });

  describe('AdvancedSeminaryTheologyPackSeeder', () => {
    it('seeds the ADVANCED_SEMINARY_THEOLOGY pack with payload idempotently', async () => {
      const persistedPacks = new Map<string, any>();
      const packUpsert = jest.fn().mockImplementation(async ({ where, create, update }) => {
        const key = `${where.code_version.code}_v${where.code_version.version}`;
        if (persistedPacks.has(key)) {
          const updated = { ...persistedPacks.get(key), ...update };
          persistedPacks.set(key, updated);
          return updated;
        }
        const created = { ...create, id: 'pack-advanced-seminary-theology-id' };
        persistedPacks.set(key, created);
        return created;
      });

      const prisma = {
        curriculumPack: { upsert: packUpsert },
      } as unknown as PrismaService;

      const seeder = new AdvancedSeminaryTheologyPackSeeder(prisma);
      const result = await seeder.seed();

      expect(result.code).toBe('ADVANCED_SEMINARY_THEOLOGY');
      expect(result.version).toBe(1);
      expect(result.cycles).toBe(4);
      expect(result.disciplines).toBe(24);

      const pack = persistedPacks.get('ADVANCED_SEMINARY_THEOLOGY_v1');
      expect(pack).toBeDefined();
      expect(pack.status).toBe('PUBLISHED');
      expect(pack.schemaVersion).toBe('1.0.0');
      expect(pack.name).toBe('Módulo Teológico Avançado (Nível Seminário)');
      expect(pack.metadata).toEqual(SEMINARY_THEOLOGY_PACK_PAYLOAD);

      // Re-run for idempotency
      const rerun = await seeder.seed();
      expect(rerun.disciplines).toBe(24);
      expect(persistedPacks.size).toBe(1);
    });
  });
});
