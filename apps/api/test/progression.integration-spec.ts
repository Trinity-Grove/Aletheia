import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Prisma, type EvidenceValidationStatus } from '@prisma/client';
import supertest from 'supertest';
import { progressionEvaluationResponseSchema } from '@aletheia/contracts';
import { createApplication } from '../src/main.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { ProgressionRepository } from '../src/modules/curriculum/infrastructure/progression.repository.js';

describe('Progression evaluation (real Postgres)', () => {
  let app: NestFastifyApplication;
  let db: PrismaService;
  let cookie: string;
  let familyId: string;
  let learnerId: string;
  let authorId: string;
  let domainId: string;
  let evidenceTypeId: string;
  let foreignFamilyId: string;
  let foreignLearnerId: string;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    db = app.get(PrismaService);
    const email = `progression-${randomUUID()}@example.com`;
    const registered = await supertest(app.getHttpServer()).post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Progression Guardian' }).expect(201);
    cookie = [registered.headers['set-cookie']].flat().find((value) => value?.startsWith('aletheia_session='))!;
    authorId = (await db.user.findUniqueOrThrow({ where: { email } })).id;
    const family = await supertest(app.getHttpServer()).post('/api/v1/families').set('Cookie', cookie)
      .send({ name: 'Progression Family', countryCode: 'BR' }).expect(201);
    familyId = family.body.id;
    learnerId = (await db.learner.create({ data: { familyId, firstName: 'Learner', birthDate: new Date('2015-01-01') } })).id;
    foreignFamilyId = (await db.family.create({ data: { name: 'Other Family', countryCode: 'BR' } })).id;
    foreignLearnerId = (await db.learner.create({ data: { familyId: foreignFamilyId, firstName: 'Other', birthDate: new Date('2015-01-01') } })).id;
    domainId = (await db.learningDomain.create({ data: { code: randomUUID(), name: 'Domain', status: 'PUBLISHED' } })).id;
    evidenceTypeId = (await db.evidenceTypeDefinition.create({ data: { code: randomUUID(), name: 'Text', status: 'PUBLISHED' } })).id;
  });
  afterAll(async () => { await app?.close(); });

  const evaluate = (competencyDefinitionId: string, policyId: string, learner = learnerId, family = familyId) =>
    supertest(app.getHttpServer()).get(`/api/v1/families/${family}/curriculum/progression/evaluation`)
      .set('Cookie', cookie).query({ learnerId: learner, competencyDefinitionId, policyId });
  const competency = (data: Partial<Prisma.CompetencyDefinitionUncheckedCreateInput> = {}) => db.competencyDefinition.create({
    data: { code: randomUUID(), title: 'Competency', domainId, status: 'PUBLISHED', ...data },
  });
  const policy = (data: Partial<Prisma.ProgressionPolicyUncheckedCreateInput> = {}) => db.progressionPolicy.create({
    data: { code: randomUUID(), name: 'Evidence policy', status: 'PUBLISHED', policyType: 'EVIDENCE_COUNT', rules: { minimumEvidenceCount: 2 }, ...data },
  });
  async function evidence(competencyDefinitionId: string, competencyVersion: number, status: EvidenceValidationStatus, learner = learnerId, family = familyId) {
    return db.evidenceSubmission.create({ data: {
      familyId: family, learnerId: learner, authorId, evidenceTypeId, textContent: 'Demonstration', validationStatus: status,
      competencies: { create: { competencyDefinitionId, competencyVersion } },
    } });
  }

  it('counts only validated evidence for the exact learner, family, competency row and version', async () => {
    const first = await competency();
    const second = await competency({ code: first.code, version: 2 });
    const p = await policy({ version: 3 });
    await evidence(first.id, 1, 'VALIDATED');
    await evidence(first.id, 1, 'UNVALIDATED');
    await evidence(first.id, 1, 'REJECTED');
    await evidence(first.id, 99, 'VALIDATED');
    await evidence(second.id, 2, 'VALIDATED');
    await evidence(first.id, 1, 'VALIDATED', foreignLearnerId, foreignFamilyId);
    const result = await evaluate(first.id, p.id).expect(200);
    expect(progressionEvaluationResponseSchema.safeParse(result.body).success).toBe(true);
    expect(result.body).toMatchObject({ state: 'IN_PROGRESS', competencyVersion: 1, policyVersion: 3, validatedEvidenceCount: 1, minimumEvidenceCount: 2 });
    await evidence(first.id, 1, 'VALIDATED');
    expect((await evaluate(first.id, p.id).expect(200)).body.state).toBe('MASTERED');
    expect((await evaluate(second.id, p.id).expect(200)).body.validatedEvidenceCount).toBe(1);
  });

  it('enforces authentication and family isolation', async () => {
    const c = await competency();
    const p = await policy();
    await evaluate(c.id, p.id, foreignLearnerId).expect(404);
    await evaluate(c.id, p.id, foreignLearnerId, foreignFamilyId).expect(403);
    await supertest(app.getHttpServer()).get(`/api/v1/families/${familyId}/curriculum/progression/evaluation`).expect(401);
  });

  it('keeps all traversal reads in one snapshot during concurrent validation', async () => {
    const c = await competency();
    const submission = await evidence(c.id, 1, 'UNVALIDATED');
    const repository = app.get(ProgressionRepository);
    await repository.snapshot(async (reader) => {
      expect(await reader.evidenceCount(familyId, learnerId, c.id, 1)).toBe(0);
      await db.evidenceSubmission.update({ where: { id: submission.id }, data: { validationStatus: 'VALIDATED' } });
      expect(await reader.evidenceCount(familyId, learnerId, c.id, 1)).toBe(0);
    });
    expect((await evaluate(c.id, (await policy()).id).expect(200)).body.validatedEvidenceCount).toBe(1);
  });

  it('computes unmet prerequisites and becomes mastered after their validation', async () => {
    const c = await competency();
    const prerequisite = await competency();
    const prerequisitePolicy = await policy({ rules: { minimumEvidenceCount: 1 } });
    const p = await policy({ rules: { minimumEvidenceCount: 1, prerequisites: [{ competencyDefinitionId: prerequisite.id, policyId: prerequisitePolicy.id }] } });
    await evidence(c.id, 1, 'VALIDATED');
    const blocked = await evaluate(c.id, p.id).expect(200);
    expect(blocked.body.state).toBe('BLOCKED');
    expect(blocked.body.unmetPrerequisites).toEqual([expect.objectContaining({ competencyDefinitionId: prerequisite.id, policyId: prerequisitePolicy.id, state: 'NOT_STARTED' })]);
    await evidence(prerequisite.id, 1, 'VALIDATED');
    expect((await evaluate(c.id, p.id).expect(200)).body.state).toBe('MASTERED');
  });

  it.each([
    { policyType: 'HOURS' }, { schemaVersion: '2.0.0' }, { status: 'DRAFT' as const },
    { rules: { minimumEvidenceCount: 0 } }, { rules: { minimumEvidenceCount: 1, unsupported: true } },
  ])('rejects unsupported or malformed policy %j', async (data) => {
    const c = await competency();
    const p = await policy(data);
    await evidence(c.id, 1, 'VALIDATED');
    await evaluate(c.id, p.id).expect(400);
  });

  it('rejects unpublished or unsupported competency definitions', async () => {
    const p = await policy();
    for (const data of [{ status: 'DRAFT' as const }, { status: 'DEPRECATED' as const }, { schemaVersion: '2.0.0' }]) {
      await evaluate((await competency(data)).id, p.id).expect(400);
    }
  });

  it('rejects missing prerequisite references and indirect cycles', async () => {
    const c = await competency();
    const missing = await policy({ rules: { minimumEvidenceCount: 1, prerequisites: [{ competencyDefinitionId: c.id, policyId: randomUUID() }] } });
    await evaluate(c.id, missing.id).expect(404);
    const firstId = randomUUID();
    const secondId = randomUUID();
    const first = await policy({ id: firstId, rules: { minimumEvidenceCount: 1, prerequisites: [{ competencyDefinitionId: c.id, policyId: secondId }] } });
    await policy({ id: secondId, rules: { minimumEvidenceCount: 1, prerequisites: [{ competencyDefinitionId: c.id, policyId: firstId }] } });
    await evaluate(c.id, first.id).expect(400);
  });

  it('enforces exact competency and published curriculum scopes', async () => {
    const c = await competency();
    const other = await competency();
    await evaluate(c.id, (await policy({ competencyDefinitionId: other.id })).id).expect(400);
    const curriculum = await db.curriculumDefinition.create({ data: { code: randomUUID(), name: 'Curriculum', status: 'PUBLISHED', competencies: { create: { competencyId: c.id } } } });
    const scoped = await policy({ curriculumDefinitionId: curriculum.id });
    await evaluate(c.id, scoped.id).expect(200);
    await evaluate(other.id, scoped.id).expect(400);
    await db.curriculumDefinition.update({ where: { id: curriculum.id }, data: { status: 'DEPRECATED' } });
    await evaluate(c.id, scoped.id).expect(400);
  });
});
