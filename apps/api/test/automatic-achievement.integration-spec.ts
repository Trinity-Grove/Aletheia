import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { learnerCompetencyAchievementResponseSchema } from '@aletheia/contracts';
import { createApplication } from '../src/main.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { LearnerCompetencyApprovalService } from '../src/modules/curriculum/application/learner-competency-approval.service.js';
import { registerAndConfirmGuardian } from './helpers/register-verified-guardian.js';

describe('Automatic competency achievements (real Postgres)', () => {
  let app: NestFastifyApplication;
  let db: PrismaService;
  let adminCookie: string;
  let family: { cookie: string; familyId: string; learnerId: string; actorId: string };
  let other: typeof family;
  const adminEmail = `achievement-admin-${randomUUID()}@example.com`;
  const previousAdmins = process.env.PLATFORM_ADMIN_EMAILS;
  const adminBase = '/api/v1/admin/curriculum-definitions';

  async function register(email: string) {
    const response = await registerAndConfirmGuardian(app, { email, password: 'somePassword123', fullName: 'Achievement Test Guardian', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
    return [response.headers['set-cookie']].flat().find((value) => value?.startsWith('aletheia_session='))!;
  }

  async function createFamily() {
    const email = `achievement-guardian-${randomUUID()}@example.com`;
    const cookie = await register(email);
    const created = await supertest(app.getHttpServer()).post('/api/v1/families').set('Cookie', cookie)
      .send({ name: 'Achievement Family', countryCode: 'BR' }).expect(201);
    const familyId = created.body.id as string;
    const learner = await supertest(app.getHttpServer()).post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', cookie).send({ firstName: 'Learner', birthDate: '2015-01-01', stage: 'PRIMARY_GRAMMAR', acceptedDataConsent: true }).expect(201);
    const actorId = (await db.user.findUniqueOrThrow({ where: { email } })).id;
    return { cookie, familyId, learnerId: learner.body.id as string, actorId };
  }

  async function definition(kind: string, data: Record<string, unknown>) {
    const created = await supertest(app.getHttpServer()).post(`${adminBase}/${kind}`).set('Cookie', adminCookie)
      .send({ code: `ACHIEVEMENT.${randomUUID().replaceAll('-', '').toUpperCase()}`, ...data }).expect(201);
    await supertest(app.getHttpServer()).patch(`${adminBase}/${kind}/${created.body.id}/status`)
      .set('Cookie', adminCookie).send({ status: 'PUBLISHED' }).expect(200);
    return created.body as { id: string; version: number };
  }

  const base = () => `/api/v1/families/${family.familyId}/curriculum`;
  const awards = () => supertest(app.getHttpServer()).get(`${base()}/achievements`)
    .set('Cookie', family.cookie).query({ learnerId: family.learnerId });
  const validate = (id: string, status: 'VALIDATED' | 'REJECTED') => supertest(app.getHttpServer())
    .patch(`${base()}/evidence-submissions/${id}/validation`).set('Cookie', family.cookie).send({ status });

  async function fixture() {
    const domain = await definition('learning-domains', { name: 'Achievement Domain' });
    const competency = await definition('competency-definitions', { title: 'Achievement Competency', domainId: domain.id });
    const curriculum = await supertest(app.getHttpServer()).post(`${adminBase}/curriculum-definitions`)
      .set('Cookie', adminCookie).send({ code: `ACHIEVEMENT.${randomUUID().replaceAll('-', '').toUpperCase()}`, name: 'Achievement Curriculum' }).expect(201);
    await supertest(app.getHttpServer()).post(`${adminBase}/curriculum-definitions/${curriculum.body.id}/competencies`)
      .set('Cookie', adminCookie).send({ competencyId: competency.id }).expect(201);
    await supertest(app.getHttpServer()).patch(`${adminBase}/curriculum-definitions/${curriculum.body.id}/status`)
      .set('Cookie', adminCookie).send({ status: 'PUBLISHED' }).expect(200);
    const policy = await definition('progression-policies', {
      name: 'One validated demonstration', policyType: 'EVIDENCE_COUNT', rules: { minimumEvidenceCount: 1 },
      curriculumDefinitionId: curriculum.body.id,
    });
    const evidenceType = await definition('evidence-type-definitions', { name: 'Text demonstration' });
    const activated = await supertest(app.getHttpServer()).post(`${base()}/competency-tracking/activate`)
      .set('Cookie', family.cookie).send({ learnerId: family.learnerId, curriculumDefinitionId: curriculum.body.id, progressionPolicyId: policy.id }).expect(201);
    const trackingId = activated.body.trackings[0].id as string;
    expect(activated.body.trackings[0]).toMatchObject({ progressionPolicyId: policy.id, policyVersion: policy.version });
    const submitted = await supertest(app.getHttpServer()).post(`${base()}/evidence-submissions`)
      .set('Cookie', family.cookie).send({ learnerId: family.learnerId, evidenceTypeId: evidenceType.id,
        textContent: 'Human-reviewed demonstration', competencies: [{ competencyDefinitionId: competency.id }] }).expect(201);
    return { competency, policy, curriculumId: curriculum.body.id as string, trackingId, evidenceId: submitted.body.id as string };
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    db = app.get(PrismaService);
    adminCookie = await register(adminEmail);
    family = await createFamily();
    other = await createFamily();
  }, 30000);

  afterAll(async () => {
    await app?.close();
    if (previousAdmins === undefined) delete process.env.PLATFORM_ADMIN_EMAILS;
    else process.env.PLATFORM_ADMIN_EMAILS = previousAdmins;
  });

  it('awards only after human validation and preserves one exact snapshot across concurrent retries', async () => {
    const f = await fixture();
    expect((await awards().expect(200)).body.filter((row: { trackingId: string }) => row.trackingId === f.trackingId)).toEqual([]);
    await validate(f.evidenceId, 'VALIDATED').expect(200);
    const listed = (await awards().expect(200)).body;
    const award = listed.find((row: { trackingId: string }) => row.trackingId === f.trackingId);
    expect(learnerCompetencyAchievementResponseSchema.safeParse(award).success).toBe(true);
    expect(award).toMatchObject({ familyId: family.familyId, learnerId: family.learnerId, trackingId: f.trackingId,
      competencyDefinitionId: f.competency.id, competencyVersion: f.competency.version,
      curriculumDefinitionId: f.curriculumId, curriculumVersion: 1,
      progressionPolicyId: f.policy.id, policyVersion: f.policy.version, awardedByUserId: family.actorId,
      minimumEvidenceCount: 1, validatedEvidenceCount: 1,
      evidenceSnapshot: { evidenceSubmissionIds: [f.evidenceId], prerequisites: [] } });
    const evaluation = await supertest(app.getHttpServer()).get(`${base()}/progression/evaluation`)
      .set('Cookie', family.cookie).query({ trackingId: f.trackingId, policyId: f.policy.id }).expect(200);
    expect(evaluation.body.state).toBe('MASTERED');
    const retries = await Promise.all(Array.from({ length: 3 }, () => validate(f.evidenceId, 'VALIDATED')));
    expect(retries.map((response) => response.status)).toEqual([200, 200, 200]);
    const after = (await awards().expect(200)).body.filter((row: { trackingId: string }) => row.trackingId === f.trackingId);
    expect(after).toEqual([award]);
  }, 30000);

  it('appends one rejection review without changing or deleting the awarded snapshot', async () => {
    const f = await fixture();
    await validate(f.evidenceId, 'VALIDATED').expect(200);
    const original = await db.learnerCompetencyAchievement.findUniqueOrThrow({ where: { trackingId: f.trackingId } });
    await validate(f.evidenceId, 'REJECTED').expect(200);
    await validate(f.evidenceId, 'REJECTED').expect(200);
    expect(await db.learnerCompetencyAchievement.findUniqueOrThrow({ where: { trackingId: f.trackingId } })).toEqual(original);
    const reviews = await db.learnerCompetencyAchievementReview.findMany({ where: { achievementId: original.id } });
    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({ achievementId: original.id, evidenceSubmissionId: f.evidenceId,
      familyId: family.familyId, learnerId: family.learnerId, reviewedByUserId: family.actorId, reason: 'EVIDENCE_REJECTED' });
    const award = (await awards().expect(200)).body.find((row: { id: string }) => row.id === original.id);
    expect(award.reviews).toEqual([expect.objectContaining({ id: reviews[0]!.id, evidenceSubmissionId: f.evidenceId })]);
    const evaluation = await supertest(app.getHttpServer()).get(`${base()}/progression/evaluation`)
      .set('Cookie', family.cookie).query({ trackingId: f.trackingId, policyId: f.policy.id }).expect(200);
    expect(evaluation.body.state).toBe('NOT_STARTED');
  }, 30000);

  it('does not reconcile a rubric policy into an achievement until evidence and all rubric criteria pass', async () => {
    const f = await fixture();
    const rubric = await db.rubricDefinition.create({ data: { code: `RUBRIC.${randomUUID()}`, name: 'Achievement rubric', status: 'PUBLISHED', criteria: { create: [
      { code: 'criterion-a', label: 'Criterion A', scaleMin: 0, scaleMax: 4 },
      { code: 'criterion-b', label: 'Criterion B', scaleMin: 1, scaleMax: 5 },
    ] } }, include: { criteria: true } });
    const policy = await definition('progression-policies', {
      name: 'Evidence plus rubric', policyType: 'EVIDENCE_RUBRIC', curriculumDefinitionId: f.curriculumId,
      rules: { minimumEvidenceCount: 1, rubricDefinitionId: rubric.id, rubricVersion: rubric.version,
        minimumScoresByCriterion: { [rubric.criteria[0]!.id]: 3, [rubric.criteria[1]!.id]: 2 }, requireHumanApproval: false },
    });
    await db.learnerCompetencyTracking.update({ where: { id: f.trackingId }, data: { progressionPolicyId: policy.id, policyVersion: policy.version } });
    await validate(f.evidenceId, 'VALIDATED').expect(200);
    expect(await db.learnerCompetencyAchievement.count({ where: { trackingId: f.trackingId } })).toBe(0);
    await db.assessmentResult.create({ data: { familyId: family.familyId, learnerId: family.learnerId,
      rubricDefinitionId: rubric.id, rubricVersion: rubric.version, assessorType: 'PARENT', assessorUserId: family.actorId,
      scores: { create: [{ rubricCriterionId: rubric.criteria[0]!.id, score: 4 }, { rubricCriterionId: rubric.criteria[1]!.id, score: 3 }] } } });
    await validate(f.evidenceId, 'VALIDATED').expect(200);
    expect(await db.learnerCompetencyAchievement.count({ where: { trackingId: f.trackingId } })).toBe(1);
  }, 30000);

  it('persists an idempotent approval and awards atomically with rubric and decision provenance', async () => {
    const f = await fixture();
    const rubric = await db.rubricDefinition.create({ data: { code: `RUBRIC.${randomUUID()}`, name: 'Approval rubric', status: 'PUBLISHED', criteria: { create: [
      { code: 'criterion-a', label: 'Criterion A', scaleMin: 0, scaleMax: 4 },
    ] } }, include: { criteria: true } });
    const policy = await definition('progression-policies', {
      name: 'Human-approved rubric', policyType: 'EVIDENCE_RUBRIC', curriculumDefinitionId: f.curriculumId,
      rules: { minimumEvidenceCount: 1, rubricDefinitionId: rubric.id, rubricVersion: rubric.version,
        minimumScoresByCriterion: { [rubric.criteria[0]!.id]: 3 }, requireHumanApproval: true },
    });
    await db.learnerCompetencyTracking.update({ where: { id: f.trackingId }, data: { progressionPolicyId: policy.id, policyVersion: policy.version } });
    await db.assessmentResult.create({ data: { familyId: family.familyId, learnerId: family.learnerId,
      rubricDefinitionId: rubric.id, rubricVersion: rubric.version, assessorType: 'PARENT', assessorUserId: family.actorId,
      scores: { create: [{ rubricCriterionId: rubric.criteria[0]!.id, score: 4 }] } } });
    await validate(f.evidenceId, 'VALIDATED').expect(200);
    const service = app.get(LearnerCompetencyApprovalService);
    const decision = { idempotencyKey: randomUUID(), decision: 'APPROVED' as const };
    const concurrent = await Promise.all([
      service.record(family.familyId, f.trackingId, family.actorId, decision),
      service.record(family.familyId, f.trackingId, family.actorId, decision),
    ]);
    expect(concurrent[0]).toEqual(concurrent[1]);
    expect(await db.learnerCompetencyApprovalEvent.count({ where: { familyId: family.familyId, trackingId: f.trackingId } })).toBe(1);
    expect(await db.learnerCompetencyAchievement.count({ where: { trackingId: f.trackingId } })).toBe(1);
    const award = await db.learnerCompetencyAchievement.findUniqueOrThrow({ where: { trackingId: f.trackingId } });
    expect(award.evidenceSnapshot).toMatchObject({
      rubricAssessment: { rubricDefinitionId: rubric.id, rubricVersion: rubric.version, assessorUserId: family.actorId },
      approval: { approvalEventId: concurrent[0].id, decision: 'APPROVED', decidedByUserId: family.actorId },
    });
    await expect(service.record(family.familyId, f.trackingId, other.actorId, decision)).rejects.toThrow();
    await expect(service.record(family.familyId, f.trackingId, family.actorId,
      { ...decision, decision: 'RETURNED', reason: 'Different payload' })).rejects.toThrow();
    await expect(db.learnerCompetencyApprovalEvent.update({ where: { id: concurrent[0].id }, data: { reason: 'tamper' } })).rejects.toThrow();
  }, 30000);

  it('requires fresh qualifying input after a return and scopes each decision to the exact learner tracking', async () => {
    const f = await fixture();
    const rubric = await db.rubricDefinition.create({ data: { code: `RUBRIC.${randomUUID()}`, name: 'Return rubric', status: 'PUBLISHED', criteria: { create: [
      { code: 'criterion-a', label: 'Criterion A', scaleMin: 0, scaleMax: 4 },
    ] } }, include: { criteria: true } });
    const policy = await definition('progression-policies', {
      name: 'Returned rubric', policyType: 'EVIDENCE_RUBRIC', curriculumDefinitionId: f.curriculumId,
      rules: { minimumEvidenceCount: 1, rubricDefinitionId: rubric.id, rubricVersion: rubric.version,
        minimumScoresByCriterion: { [rubric.criteria[0]!.id]: 3 }, requireHumanApproval: true },
    });
    await db.learnerCompetencyTracking.update({ where: { id: f.trackingId }, data: { progressionPolicyId: policy.id, policyVersion: policy.version } });
    await db.assessmentResult.create({ data: { familyId: family.familyId, learnerId: family.learnerId,
      rubricDefinitionId: rubric.id, rubricVersion: rubric.version, assessorType: 'PARENT', assessorUserId: family.actorId,
      scores: { create: [{ rubricCriterionId: rubric.criteria[0]!.id, score: 4 }] } } });
    await validate(f.evidenceId, 'VALIDATED').expect(200);
    const service = app.get(LearnerCompetencyApprovalService);
    const returned = await service.record(family.familyId, f.trackingId, family.actorId,
      { idempotencyKey: randomUUID(), decision: 'RETURNED', reason: 'Please add a new example' });
    const evaluate = () => supertest(app.getHttpServer()).get(`${base()}/progression/evaluation`)
      .set('Cookie', family.cookie).query({ trackingId: f.trackingId, policyId: policy.id });
    expect((await evaluate().expect(200)).body.state).toBe('IN_PROGRESS');
    await expect(service.record(family.familyId, f.trackingId, family.actorId,
      { idempotencyKey: randomUUID(), decision: 'APPROVED' })).rejects.toThrow();
    await db.assessmentResult.create({ data: { familyId: family.familyId, learnerId: family.learnerId,
      rubricDefinitionId: rubric.id, rubricVersion: rubric.version, assessorType: 'PARENT', assessorUserId: family.actorId,
      scores: { create: [{ rubricCriterionId: rubric.criteria[0]!.id, score: 4 }] } } });
    expect((await evaluate().expect(200)).body.state).toBe('AWAITING_APPROVAL');
    const returnedAgain = await service.record(family.familyId, f.trackingId, family.actorId,
      { idempotencyKey: randomUUID(), decision: 'RETURNED', reason: 'Please include a new demonstration' });
    expect((await evaluate().expect(200)).body.state).toBe('IN_PROGRESS');
    await validate(f.evidenceId, 'VALIDATED').expect(200);
    expect((await evaluate().expect(200)).body.state).toBe('AWAITING_APPROVAL');
    expect(returned).toMatchObject({ familyId: family.familyId, learnerId: family.learnerId, trackingId: f.trackingId,
      progressionPolicyId: policy.id, competencyVersion: f.competency.version, decision: 'RETURNED' });
    expect(await db.learnerCompetencyAchievement.count({ where: { trackingId: f.trackingId } })).toBe(0);
    expect(returnedAgain.decision).toBe('RETURNED');
  }, 30000);

  it('isolates achievement reads and evidence validation by family', async () => {
    const f = await fixture();
    await supertest(app.getHttpServer()).get(`${base()}/achievements`).expect(401);
    await supertest(app.getHttpServer()).get(`${base()}/achievements`).set('Cookie', other.cookie).expect(403);
    await supertest(app.getHttpServer()).patch(`${base()}/evidence-submissions/${f.evidenceId}/validation`)
      .set('Cookie', other.cookie).send({ status: 'VALIDATED' }).expect(403);
    await supertest(app.getHttpServer()).patch(`/api/v1/families/${other.familyId}/curriculum/evidence-submissions/${f.evidenceId}/validation`)
      .set('Cookie', other.cookie).send({ status: 'VALIDATED' }).expect(404);
    expect(await db.learnerCompetencyAchievement.count({ where: { trackingId: f.trackingId } })).toBe(0);
    await validate(f.evidenceId, 'VALIDATED').expect(200);
    const isolated = await supertest(app.getHttpServer()).get(`/api/v1/families/${other.familyId}/curriculum/achievements`)
      .set('Cookie', other.cookie).query({ learnerId: family.learnerId }).expect(200);
    expect(isolated.body).toEqual([]);
  }, 30000);
});
