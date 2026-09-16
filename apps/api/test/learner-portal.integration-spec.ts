import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Learner-scoped evidence submission + progress view (issue #34), against
// real Postgres. This is the first slice added on top of the existing
// learner-access backbone (grant/revoke, learner session cookie, agenda) --
// the point of this file is proving the learner-facing routes are STRICTLY
// narrower than the guardian-facing ones: a learner can act only on their
// own data, never a sibling's, even within the same family, and the
// existing guardian-facing evidence/progress endpoints are untouched.
describe('Learner Portal: evidence submission + progress (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  let guardianCookie: string;
  let familyId: string;
  let learnerAId: string; // has portal access enabled
  let learnerBId: string; // sibling, no portal access granted
  let learnerASessionCookie: string;
  let evidenceTypeId: string;
  let competencyId: string;
  let curriculumDefinitionId: string;
  const adminEmail = `learner-portal-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  function extractCookie(response: { headers: Record<string, unknown> }, prefix: string): string {
    const cookie = [response.headers['set-cookie']].flat().find((c) => (c as string)?.startsWith(prefix));
    if (!cookie) throw new Error(`Expected a ${prefix} cookie in the response.`);
    return cookie as string;
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Learner Portal Admin' })
      .expect(201);
    adminCookie = extractCookie(adminResponse, 'aletheia_session=');

    const evidenceType = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/evidence-type-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.LEARNER.PORTAL.EVIDENCE.${Date.now()}`, name: 'Learner Portal Test Evidence Type' })
      .expect(201);
    evidenceTypeId = evidenceType.body.id;

    const domain = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.LEARNER.PORTAL.DOMAIN.${Date.now()}`, name: 'Learner Portal Test Domain' })
      .expect(201);

    const competency = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/competency-definitions')
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.LEARNER.PORTAL.COMPETENCY.${Date.now()}`,
        domainId: domain.body.id,
        title: 'Learner Portal Test Competency',
      })
      .expect(201);
    competencyId = competency.body.id;

    const curriculum = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/curriculum-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.LEARNER.PORTAL.CURRICULUM.${Date.now()}`, name: 'Learner Portal Test Curriculum' })
      .expect(201);
    curriculumDefinitionId = curriculum.body.id;

    await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/curriculum-definitions/${curriculumDefinitionId}/competencies`)
      .set('Cookie', adminCookie)
      .send({ competencyId })
      .expect(201);

    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/curriculum-definitions/${curriculumDefinitionId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    // One guardian, one family, two learner children (siblings).
    const guardianEmail = `learner-portal-guardian-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const guardianResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: guardianEmail, password: 'somePassword123', fullName: 'Learner Portal Test Guardian' })
      .expect(201);
    guardianCookie = extractCookie(guardianResponse, 'aletheia_session=');

    const familyResponse = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', guardianCookie)
      .send({ name: 'Learner Portal Test Family', countryCode: 'BR' })
      .expect(201);
    familyId = familyResponse.body.id;

    const learnerA = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', guardianCookie)
      .send({ firstName: 'Ana', lastName: 'Sibling', birthDate: '2015-01-01', stage: 'PRIMARY_GRAMMAR' })
      .expect(201);
    learnerAId = learnerA.body.id;

    const learnerB = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', guardianCookie)
      .send({ firstName: 'Beto', lastName: 'Sibling', birthDate: '2013-01-01', stage: 'MIDDLE_LOGIC' })
      .expect(201);
    learnerBId = learnerB.body.id;

    // Activate the curriculum for BOTH siblings, so both have tracked
    // competencies -- otherwise a "learner B has nothing" result could
    // hide a real isolation bug (empty response either way).
    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/curriculum/competency-tracking/activate`)
      .set('Cookie', guardianCookie)
      .send({ learnerId: learnerAId, curriculumDefinitionId })
      .expect(201);
    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/curriculum/competency-tracking/activate`)
      .set('Cookie', guardianCookie)
      .send({ learnerId: learnerBId, curriculumDefinitionId })
      .expect(201);

    // Grant portal access to learner A only (mirrors a guardian enabling
    // the portal for one child but not [yet] the other).
    const grant = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners/${learnerAId}/access/grant`)
      .set('Cookie', guardianCookie)
      .expect(201);
    const learnerCode = grant.body.code;

    const learnerLogin = await supertest(app.getHttpServer())
      .post('/api/v1/learner-access/login')
      .send({ learnerId: learnerAId, code: learnerCode })
      .expect(200);
    learnerASessionCookie = extractCookie(learnerLogin, 'aletheia_learner_session=');
  }, 30000);

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  describe('a learner acting on their own data', () => {
    it('submits evidence for their own tracked competency', async () => {
      const created = await supertest(app.getHttpServer())
        .post(`/api/v1/learner-access/learners/${learnerAId}/evidence-submissions`)
        .set('Cookie', learnerASessionCookie)
        .send({
          evidenceTypeId,
          competencies: [{ competencyDefinitionId: competencyId }],
          textContent: 'I finished the reading and can narrate it back.',
        })
        .expect(201);

      expect(created.body.learnerId).toBe(learnerAId);
      expect(created.body.familyId).toBe(familyId);
      // Evidence submitted through the portal is still UNVALIDATED by
      // default -- a learner gets no privileged write path, only a
      // narrower gate in front of the identical guardian-facing one.
      expect(created.body.validationStatus).toBe('UNVALIDATED');
      // Attribution: since a learner session is not a User, the FK
      // resolves to the guardian who granted this exact access.
      expect(created.body.authorId).toBeTruthy();
    });

    it('views their own progress', async () => {
      const progress = await supertest(app.getHttpServer())
        .get(`/api/v1/learner-access/learners/${learnerAId}/progress`)
        .set('Cookie', learnerASessionCookie)
        .expect(200);

      expect(Array.isArray(progress.body)).toBe(true);
      expect(progress.body.length).toBeGreaterThan(0);
      for (const tracking of progress.body) {
        expect(tracking.learnerId).toBe(learnerAId);
      }
    });
  });

  describe('cross-learner isolation (the critical test)', () => {
    it('rejects a learner submitting evidence under a sibling learnerId route param, even in the same family', async () => {
      await supertest(app.getHttpServer())
        .post(`/api/v1/learner-access/learners/${learnerBId}/evidence-submissions`)
        .set('Cookie', learnerASessionCookie)
        .send({
          evidenceTypeId,
          competencies: [{ competencyDefinitionId: competencyId }],
          textContent: 'Attempting to submit evidence as my sibling.',
        })
        .expect(403);
    });

    it('rejects a learner viewing a sibling’s progress via the sibling’s learnerId route param', async () => {
      await supertest(app.getHttpServer())
        .get(`/api/v1/learner-access/learners/${learnerBId}/progress`)
        .set('Cookie', learnerASessionCookie)
        .expect(403);
    });

    it('the evidence submission request body has no learnerId field to spoof in the first place', async () => {
      // Even if a learner tried to smuggle a different learnerId into the
      // body, the learner-facing schema has no such field: it is silently
      // stripped, and the route param (verified against the session) is
      // the only source of truth for whose evidence this is.
      const created = await supertest(app.getHttpServer())
        .post(`/api/v1/learner-access/learners/${learnerAId}/evidence-submissions`)
        .set('Cookie', learnerASessionCookie)
        .send({
          learnerId: learnerBId, // ignored -- not part of the accepted schema
          evidenceTypeId,
          competencies: [{ competencyDefinitionId: competencyId }],
          textContent: 'Body-smuggled learnerId must be ignored.',
        })
        .expect(201);

      expect(created.body.learnerId).toBe(learnerAId);
      expect(created.body.learnerId).not.toBe(learnerBId);
    });

    it('rejects any learner-access route entirely for a learner with no enabled grant', async () => {
      // Learner B never had access granted, so there is no valid session
      // to even attempt this with -- confirms a sibling genuinely cannot
      // reach their own learner-access routes without a guardian grant,
      // let alone another sibling's.
      await supertest(app.getHttpServer())
        .get(`/api/v1/learner-access/learners/${learnerBId}/progress`)
        .expect(401);
    });
  });

  describe('unauthenticated and revoked access', () => {
    it('rejects an unauthenticated request to either new route', async () => {
      await supertest(app.getHttpServer())
        .post(`/api/v1/learner-access/learners/${learnerAId}/evidence-submissions`)
        .send({ evidenceTypeId, competencies: [{ competencyDefinitionId: competencyId }], textContent: 'x' })
        .expect(401);

      await supertest(app.getHttpServer())
        .get(`/api/v1/learner-access/learners/${learnerAId}/progress`)
        .expect(401);
    });

    it('revoking access takes effect on the very next request, blocking both new routes', async () => {
      await supertest(app.getHttpServer())
        .patch(`/api/v1/families/${familyId}/learners/${learnerAId}/access/revoke`)
        .set('Cookie', guardianCookie)
        .expect(200);

      await supertest(app.getHttpServer())
        .get(`/api/v1/learner-access/learners/${learnerAId}/progress`)
        .set('Cookie', learnerASessionCookie)
        .expect(401);

      await supertest(app.getHttpServer())
        .post(`/api/v1/learner-access/learners/${learnerAId}/evidence-submissions`)
        .set('Cookie', learnerASessionCookie)
        .send({
          evidenceTypeId,
          competencies: [{ competencyDefinitionId: competencyId }],
          textContent: 'Should be rejected -- access was just revoked.',
        })
        .expect(401);

      // Re-enable for the guardian-facing regression check below.
      await supertest(app.getHttpServer())
        .patch(`/api/v1/families/${familyId}/learners/${learnerAId}/access/enable`)
        .set('Cookie', guardianCookie)
        .expect(200);
    });
  });

  describe('guardian-facing endpoints remain completely unchanged', () => {
    it('the guardian can still submit evidence directly with the family-scoped route, unaffected by the learner routes', async () => {
      const created = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyId}/curriculum/evidence-submissions`)
        .set('Cookie', guardianCookie)
        .send({
          learnerId: learnerAId,
          evidenceTypeId,
          competencies: [{ competencyDefinitionId: competencyId }],
          textContent: 'Guardian-submitted evidence, unrelated to the learner portal.',
        })
        .expect(201);
      expect(created.body.learnerId).toBe(learnerAId);
      expect(created.body.validationStatus).toBe('UNVALIDATED');
    });

    it('the guardian can still list and validate evidence submissions across all their learners', async () => {
      const list = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyId}/curriculum/evidence-submissions`)
        .set('Cookie', guardianCookie)
        .query({ learnerId: learnerAId })
        .expect(200);
      expect(Array.isArray(list.body)).toBe(true);
      expect(list.body.length).toBeGreaterThan(0);

      const validated = await supertest(app.getHttpServer())
        .patch(`/api/v1/families/${familyId}/curriculum/evidence-submissions/${list.body[0].id}/validation`)
        .set('Cookie', guardianCookie)
        .send({ status: 'VALIDATED' })
        .expect(200);
      expect(validated.body.validationStatus).toBe('VALIDATED');
    });

    it('the guardian can still list tracked competencies for any learner in the family, including via the family route', async () => {
      const list = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyId}/curriculum/competency-tracking`)
        .set('Cookie', guardianCookie)
        .query({ learnerId: learnerBId })
        .expect(200);
      expect(Array.isArray(list.body)).toBe(true);
      expect(list.body.length).toBeGreaterThan(0);
      for (const tracking of list.body) {
        expect(tracking.learnerId).toBe(learnerBId);
      }
    });
  });
});
