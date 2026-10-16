import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { registerAndConfirmGuardian } from './helpers/register-verified-guardian.js';
import { MENTOR_GRANT_PUBLIC_API, type MentorGrantPublicApi } from '../src/modules/mentors/application/public-api.js';

describe('Authenticated competency approval API (real Postgres)', () => {
  let app: NestFastifyApplication;
  let db: PrismaService;
  let adminCookie: string;
  let familyCookie: string;
  let familyId: string;
  let learnerId: string;
  let guardianId: string;
  let mentorCookie: string;
  let mentorId: string;
  let grantId: string;
  let trackingId: string;
  const adminEmail = `competency-approval-admin-${randomUUID()}@example.com`;
  const base = '/api/v1/admin/curriculum-definitions';

  async function register(email: string) {
    const result = await registerAndConfirmGuardian(app, { email, password: 'somePassword123', fullName: 'Approval API User', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true });
    return [result.headers['set-cookie']].flat().find((value) => value?.startsWith('aletheia_session='))!;
  }

  async function published(kind: string, data: Record<string, unknown>) {
    const definition = await supertest(app.getHttpServer()).post(`${base}/${kind}`).set('Cookie', adminCookie)
      .send({ code: `APPROVAL.${randomUUID().replaceAll('-', '').toUpperCase()}`, ...data }).expect(201);
    await supertest(app.getHttpServer()).patch(`${base}/${kind}/${definition.body.id}/status`).set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' }).expect(200);
    return definition.body;
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    db = app.get(PrismaService);
    adminCookie = await register(adminEmail);
    familyCookie = await register(`approval-family-${randomUUID()}@example.com`);
    guardianId = (await supertest(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', familyCookie).expect(200)).body.id;
    const family = await supertest(app.getHttpServer()).post('/api/v1/families').set('Cookie', familyCookie)
      .send({ name: 'Approval API Family', countryCode: 'BR' }).expect(201);
    familyId = family.body.id;
    learnerId = (await supertest(app.getHttpServer()).post(`/api/v1/families/${familyId}/learners`).set('Cookie', familyCookie)
      .send({ firstName: 'Learner', birthDate: '2015-01-01', stage: 'PRIMARY_GRAMMAR', acceptedDataConsent: true }).expect(201)).body.id;
    mentorCookie = await register(`approval-mentor-${randomUUID()}@example.com`);
    mentorId = (await supertest(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', mentorCookie).expect(200)).body.id;

    const domain = await published('learning-domains', { name: 'Approval API Domain' });
    const competency = await published('competency-definitions', { title: 'Approval API Competency', domainId: domain.id });
    const curriculum = await supertest(app.getHttpServer()).post(`${base}/curriculum-definitions`).set('Cookie', adminCookie)
      .send({ code: `APPROVAL.${randomUUID().replaceAll('-', '').toUpperCase()}`, name: 'Approval API Curriculum' }).expect(201);
    await supertest(app.getHttpServer()).post(`${base}/curriculum-definitions/${curriculum.body.id}/competencies`).set('Cookie', adminCookie)
      .send({ competencyId: competency.id }).expect(201);
    await supertest(app.getHttpServer()).patch(`${base}/curriculum-definitions/${curriculum.body.id}/status`).set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' }).expect(200);
    const rubric = await db.rubricDefinition.create({ data: { code: `APPROVAL.${randomUUID()}`, name: 'Approval API Rubric', status: 'PUBLISHED', criteria: { create: [{ code: 'criterion', label: 'Criterion', scaleMin: 0, scaleMax: 4 }] } }, include: { criteria: true } });
    const policy = await published('progression-policies', { name: 'Evidence and approval', policyType: 'EVIDENCE_RUBRIC', curriculumDefinitionId: curriculum.body.id,
      rules: { minimumEvidenceCount: 1, rubricDefinitionId: rubric.id, rubricVersion: rubric.version, minimumScoresByCriterion: { [rubric.criteria[0]!.id]: 3 }, requireHumanApproval: true } });
    const evidenceType = await published('evidence-type-definitions', { name: 'Approval API Evidence' });
    const activation = await supertest(app.getHttpServer()).post(`/api/v1/families/${familyId}/curriculum/competency-tracking/activate`)
      .set('Cookie', familyCookie).send({ learnerId, curriculumDefinitionId: curriculum.body.id, progressionPolicyId: policy.id }).expect(201);
    trackingId = activation.body.trackings[0].id;
    await db.assessmentResult.create({ data: { familyId, learnerId, rubricDefinitionId: rubric.id, rubricVersion: rubric.version,
      assessorType: 'GUARDIAN', assessorUserId: guardianId, scores: { create: [{ rubricCriterionId: rubric.criteria[0]!.id, score: 4 }] } } });
    const evidence = await supertest(app.getHttpServer()).post(`/api/v1/families/${familyId}/curriculum/evidence-submissions`).set('Cookie', familyCookie)
      .send({ learnerId, evidenceTypeId: evidenceType.id, textContent: 'Demonstration', competencies: [{ competencyDefinitionId: competency.id }] }).expect(201);
    const invited = await supertest(app.getHttpServer()).post(`/api/v1/families/${familyId}/learners/${learnerId}/mentors`).set('Cookie', familyCookie)
      .send({ email: `approval-mentor-${randomUUID()}@example.com`, role: 'mentor', canApproveProgression: true }).expect(201);
    grantId = invited.body.id;
    await supertest(app.getHttpServer()).post(`/api/v1/mentors/${invited.body.token}/accept`).set('Cookie', mentorCookie).expect(200);
    await supertest(app.getHttpServer()).patch(`/api/v1/families/${familyId}/curriculum/evidence-submissions/${evidence.body.id}/validation`)
      .set('Cookie', familyCookie).send({ status: 'VALIDATED' }).expect(200);
  }, 60000);

  afterAll(async () => {
    await app?.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('isolates mentor inbox and decisions to active accepted capability grants and uses authenticated actor identity', async () => {
    const inboxPath = '/api/v1/mentors/progression-approvals';
    const mentorApi = app.get<MentorGrantPublicApi>(MENTOR_GRANT_PUBLIC_API);
    expect((await supertest(app.getHttpServer()).get(inboxPath).set('Cookie', mentorCookie).expect(200)).body)
      .toEqual([expect.objectContaining({ familyId, learnerId, evaluation: expect.objectContaining({ trackingId, state: 'AWAITING_APPROVAL' }) })]);
    expect(await mentorApi.canMentorApproveProgression(mentorId, randomUUID(), learnerId)).toBe(false);
    expect(await mentorApi.canMentorApproveProgression(mentorId, familyId, randomUUID())).toBe(false);
    const originalGrant = await db.mentorGrant.findUniqueOrThrow({ where: { id: grantId } });
    await db.mentorGrant.update({ where: { id: grantId }, data: { status: 'PENDING' } });
    expect(await mentorApi.canMentorApproveProgression(mentorId, familyId, learnerId)).toBe(false);
    expect((await supertest(app.getHttpServer()).get(inboxPath).set('Cookie', mentorCookie).expect(200)).body).toEqual([]);
    await db.mentorGrant.update({ where: { id: grantId }, data: { status: 'ACCEPTED' } });
    await db.mentorGrant.update({ where: { id: grantId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await mentorApi.canMentorApproveProgression(mentorId, familyId, learnerId)).toBe(false);
    await db.mentorGrant.update({ where: { id: grantId }, data: { expiresAt: originalGrant.expiresAt } });
    const otherCookie = await register(`approval-other-${randomUUID()}@example.com`);
    expect((await supertest(app.getHttpServer()).get(inboxPath).set('Cookie', otherCookie).expect(200)).body).toEqual([]);
    await supertest(app.getHttpServer()).post(`/api/v1/mentors/progression-approvals/${trackingId}/decision`).set('Cookie', otherCookie)
      .send({ idempotencyKey: randomUUID(), decision: 'APPROVED' }).expect(404);

    const disabled = await supertest(app.getHttpServer()).patch(`/api/v1/families/${familyId}/learners/${learnerId}/mentors/${grantId}/progression-approval`)
      .set('Cookie', familyCookie).send({ enabled: false }).expect(200);
    expect(disabled.body.status).toBe('ACCEPTED');
    expect((await supertest(app.getHttpServer()).get(inboxPath).set('Cookie', mentorCookie).expect(200)).body).toEqual([]);
    await supertest(app.getHttpServer()).post(`/api/v1/mentors/progression-approvals/${trackingId}/decision`).set('Cookie', mentorCookie)
      .send({ idempotencyKey: randomUUID(), decision: 'APPROVED' }).expect(404);

    await supertest(app.getHttpServer()).patch(`/api/v1/families/${familyId}/learners/${learnerId}/mentors/${grantId}/progression-approval`)
      .set('Cookie', familyCookie).send({ enabled: true }).expect(200);
    const decision = await supertest(app.getHttpServer()).post(`/api/v1/mentors/progression-approvals/${trackingId}/decision`).set('Cookie', mentorCookie)
      .send({ idempotencyKey: randomUUID(), decision: 'APPROVED', actorUserId: guardianId }).expect(200);
    expect(decision.body.actorUserId).toBe(mentorId);
    expect(await db.learnerCompetencyAchievement.count({ where: { trackingId } })).toBe(1);
    await supertest(app.getHttpServer()).delete(`/api/v1/mentors/${grantId}`).set('Cookie', familyCookie).expect(204);
    expect(await db.mentorGrant.findUniqueOrThrow({ where: { id: grantId } })).toMatchObject({ status: 'REVOKED', canApproveProgression: true });
    expect(await mentorApi.canMentorApproveProgression(mentorId, familyId, learnerId)).toBe(false);
  }, 60000);

  it('requires authentication and rejects family scope crossing', async () => {
    await supertest(app.getHttpServer()).get('/api/v1/mentors/progression-approvals').expect(401);
    const otherCookie = await register(`approval-cross-family-${randomUUID()}@example.com`);
    const otherFamily = await supertest(app.getHttpServer()).post('/api/v1/families').set('Cookie', otherCookie)
      .send({ name: 'Other family', countryCode: 'BR' }).expect(201);
    await supertest(app.getHttpServer()).post(`/api/v1/families/${otherFamily.body.id}/curriculum/competency-tracking/${trackingId}/approval`)
      .set('Cookie', otherCookie).send({ idempotencyKey: randomUUID(), decision: 'APPROVED' }).expect(404);
  }, 30000);
});
