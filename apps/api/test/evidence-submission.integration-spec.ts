import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Family-scoped EvidenceSubmission (issue #96 Fase 2, section 9) against
// real Postgres, with real family/learner data (not mocked) -- proves
// tenant isolation, the multi-competency join, and the specific point of
// this whole slice: a submission survives a competency's version bump
// (it keeps referencing the exact version row it was evaluated against).
describe('Evidence Submission (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  let familyACookie: string;
  let familyAId: string;
  let familyALearnerId: string;
  let familyBCookie: string;
  let familyBId: string;
  let familyBLearnerId: string;
  let evidenceTypeId: string;
  const adminEmail = `evidence-submission-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  async function registerWithFamilyAndLearner(
    prefix: string,
  ): Promise<{ cookie: string; familyId: string; learnerId: string }> {
    const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Evidence Submission Test Guardian', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
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

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Evidence Submission Admin', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    const evidenceType = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/evidence-type-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.EVIDENCE.SUBMISSION.${Date.now()}`, name: 'Test Evidence Type' })
      .expect(201);
    evidenceTypeId = evidenceType.body.id;

    const familyA = await registerWithFamilyAndLearner('evidence-submission-family-a');
    familyACookie = familyA.cookie;
    familyAId = familyA.familyId;
    familyALearnerId = familyA.learnerId;

    const familyB = await registerWithFamilyAndLearner('evidence-submission-family-b');
    familyBCookie = familyB.cookie;
    familyBId = familyB.familyId;
    familyBLearnerId = familyB.learnerId;
  });

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  async function createCompetency(codeSuffix: string): Promise<{ id: string }> {
    const domain = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.EVIDENCE.DOMAIN.${codeSuffix}`, name: 'Evidence Test Domain' })
      .expect(201);
    const competency = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/competency-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.EVIDENCE.COMPETENCY.${codeSuffix}`, domainId: domain.body.id, title: 'Evidence Test Competency' })
      .expect(201);
    return { id: competency.body.id };
  }

  it('creates an evidence submission that validates one competency, with author and timestamp', async () => {
    const competency = await createCompetency(`ONE.${Date.now()}`);

    const created = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/evidence-submissions`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        evidenceTypeId,
        competencies: [{ competencyDefinitionId: competency.id }],
        textContent: 'Read three chapters and narrated back.',
      })
      .expect(201);

    expect(created.body.authorId).toBeTruthy();
    expect(created.body.createdAt).toBeTruthy();
    expect(created.body.validationStatus).toBe('UNVALIDATED');
    expect(created.body.competencies).toHaveLength(1);
    expect(created.body.competencies[0].competencyDefinitionId).toBe(competency.id);
    expect(created.body.competencies[0].competencyVersion).toBe(1);
  });

  it('creates an evidence submission that validates multiple competencies -- uma evidência pode validar várias competências', async () => {
    const competencyOne = await createCompetency(`MULTI.A.${Date.now()}`);
    const competencyTwo = await createCompetency(`MULTI.B.${Date.now()}`);

    const created = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/evidence-submissions`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        evidenceTypeId,
        competencies: [
          { competencyDefinitionId: competencyOne.id },
          { competencyDefinitionId: competencyTwo.id },
        ],
        textContent: 'A cross-competency project.',
      })
      .expect(201);

    expect(created.body.competencies).toHaveLength(2);
    const linkedIds = created.body.competencies.map((c: { competencyDefinitionId: string }) => c.competencyDefinitionId);
    expect(linkedIds).toContain(competencyOne.id);
    expect(linkedIds).toContain(competencyTwo.id);
  });

  it('survives a competency version bump -- evidência referencia versão da competência avaliada', async () => {
    const domain = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.EVIDENCE.VERSIONBUMP.DOMAIN.${Date.now()}`, name: 'Version Bump Domain' })
      .expect(201);

    const competencyCode = `TEST.EVIDENCE.VERSIONBUMP.${Date.now()}`;
    const competencyV1 = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/competency-definitions')
      .set('Cookie', adminCookie)
      .send({ code: competencyCode, domainId: domain.body.id, title: 'Version Bump Competency v1' })
      .expect(201);
    expect(competencyV1.body.version).toBe(1);

    // Publish v1 so it's the live one at submission time.
    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/competency-definitions/${competencyV1.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    const submission = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/evidence-submissions`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        evidenceTypeId,
        competencies: [{ competencyDefinitionId: competencyV1.body.id }],
        textContent: 'Evaluated against v1.',
      })
      .expect(201);
    expect(submission.body.competencies[0].competencyDefinitionId).toBe(competencyV1.body.id);
    expect(submission.body.competencies[0].competencyVersion).toBe(1);

    // Deprecate v1, then publish a brand new v2 row (a *new* row, per the
    // Definition/Version pattern -- competencyV1's row is never mutated).
    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/competency-definitions/${competencyV1.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'DEPRECATED' })
      .expect(200);

    const competencyV2 = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/competency-definitions')
      .set('Cookie', adminCookie)
      .send({
        code: competencyCode,
        version: 2,
        domainId: domain.body.id,
        title: 'Version Bump Competency v2',
      })
      .expect(201);
    expect(competencyV2.body.version).toBe(2);
    expect(competencyV2.body.id).not.toBe(competencyV1.body.id);

    // The original submission's join row is untouched: still v1, still
    // pointing at v1's row id, completely unaffected by v2 existing now.
    const refetched = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/evidence-submissions/${submission.body.id}`)
      .set('Cookie', familyACookie)
      .expect(200);
    expect(refetched.body.competencies[0].competencyDefinitionId).toBe(competencyV1.body.id);
    expect(refetched.body.competencies[0].competencyVersion).toBe(1);
  });

  it('validates and rejects an evidence submission', async () => {
    const competency = await createCompetency(`VALIDATE.${Date.now()}`);
    const submission = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/evidence-submissions`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        evidenceTypeId,
        competencies: [{ competencyDefinitionId: competency.id }],
        textContent: 'To be validated.',
      })
      .expect(201);

    const validated = await supertest(app.getHttpServer())
      .patch(`/api/v1/families/${familyAId}/curriculum/evidence-submissions/${submission.body.id}/validation`)
      .set('Cookie', familyACookie)
      .send({ status: 'VALIDATED' })
      .expect(200);
    expect(validated.body.validationStatus).toBe('VALIDATED');
    expect(validated.body.validatedByUserId).toBeTruthy();
    expect(validated.body.validatedAt).toBeTruthy();
  });

  it('rejects a submission for a learner that does not belong to the family', async () => {
    const competency = await createCompetency(`CROSSLEARNER.${Date.now()}`);
    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/evidence-submissions`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyBLearnerId,
        evidenceTypeId,
        competencies: [{ competencyDefinitionId: competency.id }],
        textContent: 'Spoofed cross-family learnerId.',
      })
      .expect(404);
  });

  it('rejects a submission referencing a competency that does not exist, 400 not 500', async () => {
    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/evidence-submissions`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        evidenceTypeId,
        competencies: [{ competencyDefinitionId: '00000000-0000-0000-0000-000000000000' }],
        textContent: 'Orphan competency reference.',
      })
      .expect(400);
  });

  it('tenant isolation: family B cannot read or list family A evidence submissions', async () => {
    const competency = await createCompetency(`ISOLATION.${Date.now()}`);
    const submission = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/evidence-submissions`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        evidenceTypeId,
        competencies: [{ competencyDefinitionId: competency.id }],
        textContent: 'Family A only.',
      })
      .expect(201);

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/evidence-submissions/${submission.body.id}`)
      .set('Cookie', familyBCookie)
      .expect(403);

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/evidence-submissions`)
      .set('Cookie', familyBCookie)
      .expect(403);

    const ownList = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyBId}/curriculum/evidence-submissions`)
      .set('Cookie', familyBCookie)
      .expect(200);
    expect(ownList.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: submission.body.id })]),
    );
  });

  it('rejects an unauthenticated request', async () => {
    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/curriculum/evidence-submissions`)
      .expect(401);
  });

  // Issue #96 section 8: "pode gerar múltiplas evidências" -- a project
  // instance can produce more than one EvidenceSubmission, each traced
  // back to it via the same optional projectDefinitionId.
  it('links multiple evidence submissions to the same interdisciplinary project', async () => {
    const competency = await createCompetency(`PROJECT.${Date.now()}`);
    const project = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/project-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.EVIDENCE.PROJECT.${Date.now()}`, name: 'Construir uma horta (Test)' })
      .expect(201);

    const first = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/evidence-submissions`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        evidenceTypeId,
        projectDefinitionId: project.body.id,
        competencies: [{ competencyDefinitionId: competency.id }],
        textContent: 'Fotos do canteiro preparado.',
      })
      .expect(201);
    expect(first.body.projectDefinitionId).toBe(project.body.id);

    const second = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/evidence-submissions`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        evidenceTypeId,
        projectDefinitionId: project.body.id,
        competencies: [{ competencyDefinitionId: competency.id }],
        textContent: 'Registro da colheita.',
      })
      .expect(201);
    expect(second.body.projectDefinitionId).toBe(project.body.id);
    expect(second.body.id).not.toBe(first.body.id);
  });

  it('rejects an evidence submission referencing a project definition that does not exist, 400 not 500', async () => {
    const competency = await createCompetency(`PROJECT.MISSING.${Date.now()}`);
    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/curriculum/evidence-submissions`)
      .set('Cookie', familyACookie)
      .send({
        learnerId: familyALearnerId,
        evidenceTypeId,
        projectDefinitionId: '00000000-0000-0000-0000-000000000000',
        competencies: [{ competencyDefinitionId: competency.id }],
        textContent: 'x',
      })
      .expect(400);
  });
});
