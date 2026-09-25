import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Family-scoped AssessmentResult (issue #96 Fase 2, section 10's last
// item: "resultado guarda qual versão foi usada") against real Postgres.
// Proves: standalone self-assessment (no evidence submission), an
// evidence-linked assessment, per-criterion scores, a free-form
// assessorType, tenant isolation, and the specific point of this table --
// a result survives a rubric's version bump.
describe('Assessment Result (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  let familyACookie: string;
  let familyAId: string;
  let familyALearnerId: string;
  let familyBCookie: string;
  let familyBId: string;
  let evidenceTypeId: string;
  const adminEmail = `assessment-result-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  async function registerWithFamilyAndLearner(
    prefix: string,
  ): Promise<{ cookie: string; familyId: string; learnerId: string }> {
    const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Assessment Result Test Guardian', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
      .expect(201);
    const cookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    const familyResponse = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', cookie)
      .send({ name: `${prefix} Family`, countryCode: 'BR' })
      .expect(201);
    const familyId = familyResponse.body.id;

    const learnerResponse = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', cookie)
      .send({ firstName: 'Test', lastName: 'Learner', birthDate: '2015-01-01', stage: 'PRIMARY_GRAMMAR', acceptedDataConsent: true })
      .expect(201);

    return { cookie, familyId, learnerId: learnerResponse.body.id };
  }

  async function createRubric(codeSuffix: string): Promise<{ id: string; criterionId: string }> {
    const rubric = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/rubric-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.ASSESSMENT.RUBRIC.${codeSuffix}`, name: 'Assessment Test Rubric' })
      .expect(201);
    const criterion = await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/rubric-definitions/${rubric.body.id}/criteria`)
      .set('Cookie', adminCookie)
      .send({ code: 'CLARITY', label: 'Clareza' })
      .expect(201);
    return { id: rubric.body.id, criterionId: criterion.body.id };
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Assessment Result Admin', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    const evidenceType = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/evidence-type-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.ASSESSMENT.EVIDENCE.${Date.now()}`, name: 'Assessment Test Evidence Type' })
      .expect(201);
    evidenceTypeId = evidenceType.body.id;

    const familyA = await registerWithFamilyAndLearner('assessment-result-family-a');
    familyACookie = familyA.cookie;
    familyAId = familyA.familyId;
    familyALearnerId = familyA.learnerId;

    const familyB = await registerWithFamilyAndLearner('assessment-result-family-b');
    familyBCookie = familyB.cookie;
    familyBId = familyB.familyId;
  });

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('records a standalone self-assessment with no evidence submission', async () => {
    const rubric = await createRubric(`SELF.${Date.now()}`);

    const created = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/assessment-results`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        rubricDefinitionId: rubric.id,
        assessorType: 'SELF',
        scores: [{ rubricCriterionId: rubric.criterionId, score: 3 }],
      })
      .expect(201);

    expect(created.body.evidenceSubmissionId).toBeNull();
    expect(created.body.rubricVersion).toBe(1);
    expect(created.body.scores).toHaveLength(1);
    expect(created.body.scores[0].score).toBe(3);
  });

  it('accepts a free-form assessorType, not a closed enum', async () => {
    const rubric = await createRubric(`FREEFORM.${Date.now()}`);

    const created = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/assessment-results`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        rubricDefinitionId: rubric.id,
        assessorType: 'CO_OP_INSTRUCTOR_NEVER_SEEN_BEFORE',
        scores: [{ rubricCriterionId: rubric.criterionId, score: 2 }],
      })
      .expect(201);
    expect(created.body.assessorType).toBe('CO_OP_INSTRUCTOR_NEVER_SEEN_BEFORE');
  });

  it('links an assessment result to an evidence submission', async () => {
    const rubric = await createRubric(`LINKED.${Date.now()}`);
    const domain = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.ASSESSMENT.DOMAIN.${Date.now()}`, name: 'Assessment Test Domain' })
      .expect(201);
    const competency = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/competency-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.ASSESSMENT.COMPETENCY.${Date.now()}`, domainId: domain.body.id, title: 'Assessment Test Competency' })
      .expect(201);

    const submission = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/evidence-submissions`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        evidenceTypeId,
        competencies: [{ competencyDefinitionId: competency.body.id }],
        textContent: 'Evidence to be assessed.',
      })
      .expect(201);

    const result = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/assessment-results`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        evidenceSubmissionId: submission.body.id,
        rubricDefinitionId: rubric.id,
        assessorType: 'PARENT',
        scores: [{ rubricCriterionId: rubric.criterionId, score: 4 }],
      })
      .expect(201);
    expect(result.body.evidenceSubmissionId).toBe(submission.body.id);
  });

  it('survives a rubric version bump -- resultado guarda qual versão foi usada', async () => {
    const rubricCode = `TEST.ASSESSMENT.VERSIONBUMP.${Date.now()}`;
    const rubricV1 = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/rubric-definitions')
      .set('Cookie', adminCookie)
      .send({ code: rubricCode, name: 'Version Bump Rubric v1' })
      .expect(201);
    expect(rubricV1.body.version).toBe(1);
    const criterionV1 = await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/rubric-definitions/${rubricV1.body.id}/criteria`)
      .set('Cookie', adminCookie)
      .send({ code: 'CLARITY', label: 'Clareza' })
      .expect(201);

    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/rubric-definitions/${rubricV1.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    const result = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/assessment-results`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        rubricDefinitionId: rubricV1.body.id,
        assessorType: 'MENTOR',
        scores: [{ rubricCriterionId: criterionV1.body.id, score: 3 }],
      })
      .expect(201);
    expect(result.body.rubricVersion).toBe(1);

    // Deprecate v1 and publish a brand-new v2 row (a *new* row, per the
    // Definition/Version pattern -- v1's row is never mutated).
    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/rubric-definitions/${rubricV1.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'DEPRECATED' })
      .expect(200);

    const rubricV2 = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/rubric-definitions')
      .set('Cookie', adminCookie)
      .send({ code: rubricCode, version: 2, name: 'Version Bump Rubric v2' })
      .expect(201);
    expect(rubricV2.body.id).not.toBe(rubricV1.body.id);

    // The original result is untouched: still v1, still pointing at v1's
    // row id.
    const refetched = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/assessment-results/${result.body.id}`)
      .set('Cookie', familyACookie)
      .expect(200);
    expect(refetched.body.rubricDefinitionId).toBe(rubricV1.body.id);
    expect(refetched.body.rubricVersion).toBe(1);
  });

  it('rejects a score for a criterion that does not belong to the rubric, 400 not 500', async () => {
    const rubricOne = await createRubric(`CROSSRUBRIC.A.${Date.now()}`);
    const rubricTwo = await createRubric(`CROSSRUBRIC.B.${Date.now()}`);

    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/assessment-results`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        rubricDefinitionId: rubricOne.id,
        assessorType: 'SELF',
        scores: [{ rubricCriterionId: rubricTwo.criterionId, score: 1 }],
      })
      .expect(400);
  });

  it('rejects a result for a learner that does not belong to the family', async () => {
    const rubric = await createRubric(`CROSSFAMILY.${Date.now()}`);
    const familyBLearner = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyBId}/learners`)
      .set('Cookie', familyBCookie)
      .send({ firstName: 'B', lastName: 'Learner', birthDate: '2016-01-01', stage: 'PRIMARY_GRAMMAR', acceptedDataConsent: true })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/assessment-results`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyBLearner.body.id,
        rubricDefinitionId: rubric.id,
        assessorType: 'SELF',
        scores: [{ rubricCriterionId: rubric.criterionId, score: 1 }],
      })
      .expect(404);
  });

  it('rejects a nonexistent rubric definition, 400 not 500', async () => {
    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/assessment-results`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        rubricDefinitionId: '00000000-0000-0000-0000-000000000000',
        assessorType: 'SELF',
        scores: [{ rubricCriterionId: '00000000-0000-0000-0000-000000000000', score: 1 }],
      })
      .expect(400);
  });

  it('tenant isolation: family B cannot read or list family A assessment results', async () => {
    const rubric = await createRubric(`ISOLATION.${Date.now()}`);
    const result = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/assessment-results`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        rubricDefinitionId: rubric.id,
        assessorType: 'SELF',
        scores: [{ rubricCriterionId: rubric.criterionId, score: 1 }],
      })
      .expect(201);

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/assessment-results/${result.body.id}`)
      .set('Cookie', familyBCookie)
      .expect(403);

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/assessment-results`)
      .set('Cookie', familyBCookie)
      .expect(403);
  });

  it('rejects an unauthenticated request', async () => {
    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/assessment-results`)
      .expect(401);
  });
});
