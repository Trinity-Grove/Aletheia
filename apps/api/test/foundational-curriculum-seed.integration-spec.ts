import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApplication } from '../src/main.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { FoundationalCurriculumSeeder } from '../src/modules/curriculum/infrastructure/foundational-curriculum.seeder.js';

const CURRICULUM_CODE = 'FOUNDATIONAL.FAMILY_FORMATION';
const POLICY_CODE = 'FOUNDATIONAL.FAMILY_FORMATION.EVIDENCE_COUNT';
const DOMAIN_CODES = [
  'FAITH.BIBLICAL_FORMATION',
  'MUSIC',
  'TRADES',
  'COOKING',
  'GARDENING',
  'RESILIENCE',
];

describe('Foundational curriculum seed (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes a reusable curriculum and executable policy idempotently', async () => {
    const seeder = app.get(FoundationalCurriculumSeeder);
    await seeder.seed();
    const secondRun = await seeder.seed();

    expect(secondRun).toEqual({ curriculumCreated: false, policyCreated: false, domainsLinked: 0, competenciesLinked: 0 });

    const curricula = await prisma.curriculumDefinition.findMany({ where: { code: CURRICULUM_CODE } });
    expect(curricula).toHaveLength(1);
    const curriculum = curricula[0]!;
    expect(curriculum.status).toBe('PUBLISHED');
    expect(curriculum.publishedAt).not.toBeNull();

    const domainLinks = await prisma.curriculumDefinitionDomain.findMany({ where: { curriculumDefinitionId: curriculum.id } });
    expect(domainLinks).toHaveLength(DOMAIN_CODES.length);
    const linkedDomains = await prisma.learningDomain.findMany({ where: { id: { in: domainLinks.map((link) => link.domainId) } } });
    expect(linkedDomains.map((domain) => domain.code).sort()).toEqual([...DOMAIN_CODES].sort());

    const competencyLinks = await prisma.curriculumDefinitionCompetency.findMany({ where: { curriculumDefinitionId: curriculum.id } });
    expect(competencyLinks.length).toBeGreaterThan(0);
    const competencyRows = await prisma.competencyDefinition.findMany({ where: { id: { in: competencyLinks.map((link) => link.competencyId) } } });
    expect(competencyRows.every((competency) => competency.status === 'PUBLISHED')).toBe(true);
    expect(new Set(competencyRows.map((competency) => competency.domainId))).toEqual(new Set(linkedDomains.map((domain) => domain.id)));

    const policies = await prisma.progressionPolicy.findMany({ where: { code: POLICY_CODE } });
    expect(policies).toHaveLength(1);
    expect(policies[0]).toMatchObject({ status: 'PUBLISHED', policyType: 'EVIDENCE_COUNT', curriculumDefinitionId: curriculum.id });
    expect(policies[0]!.rules).toEqual({ minimumEvidenceCount: 1, prerequisites: [] });
  });
});
