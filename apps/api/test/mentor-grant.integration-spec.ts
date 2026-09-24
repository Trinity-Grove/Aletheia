import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

function upperCode(): string {
  return randomUUID().replace(/-/g, '').toUpperCase();
}

// Real-Postgres coverage for the mentor/external instructor model (issue
// #95 section 30, issue #232): invite by email, accept via token (never
// creates a FamilyMember row -- a mentor is not a guardian), revoke, and
// the resulting link being real enough for an AssessmentResult to
// reference the mentor's actual user id instead of a bare string.
describe('Mentor Grant (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  let guardianCookie: string;
  let familyId: string;
  let learnerId: string;
  let mentorCookie: string;
  let mentorUserId: string;
  const adminEmail = `mentor-grant-admin-${randomUUID()}@example.com`;

  async function registerAndGetCookieAndUserId(prefix: string): Promise<{ cookie: string; userId: string }> {
    const email = `${prefix}-${randomUUID()}@example.com`;
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Mentor Grant Test User' })
      .expect(201);
    const cookie = [response.headers['set-cookie']].flat().find((c) => c?.startsWith('aletheia_session='))!;

    const me = await supertest(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', cookie).expect(200);
    return { cookie, userId: me.body.id };
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Mentor Grant Test Admin' })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']].flat().find((c) => c?.startsWith('aletheia_session='))!;

    const guardian = await registerAndGetCookieAndUserId('mentor-grant-guardian');
    guardianCookie = guardian.cookie;

    const familyResponse = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', guardianCookie)
      .send({ name: 'Mentor Grant Test Family', countryCode: 'BR' })
      .expect(201);
    familyId = familyResponse.body.id;

    const learnerResponse = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', guardianCookie)
      .send({ firstName: 'Test', lastName: 'Learner', birthDate: '2013-01-01', stage: 'PRIMARY_GRAMMAR' })
      .expect(201);
    learnerId = learnerResponse.body.id;

    const mentor = await registerAndGetCookieAndUserId('mentor-grant-mentor');
    mentorCookie = mentor.cookie;
    mentorUserId = mentor.userId;
  });

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('invites a mentor for one learner with a free-form role', async () => {
    const invited = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners/${learnerId}/mentors`)
      .set('Cookie', guardianCookie)
      .send({ email: 'mentor-invite@example.com', role: 'mestre de ofício' })
      .expect(201);

    expect(invited.body.status).toBe('PENDING');
    expect(invited.body.role).toBe('mestre de ofício');
    expect(invited.body.token).toBeTruthy();
    expect(invited.body.mentorUserId).toBeFalsy();
  });

  it('rejects an invite for a learner that does not belong to the family', async () => {
    const otherGuardian = await registerAndGetCookieAndUserId('mentor-grant-other-guardian');
    const otherFamily = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', otherGuardian.cookie)
      .send({ name: 'Other Family', countryCode: 'BR' })
      .expect(201);
    const otherLearner = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${otherFamily.body.id}/learners`)
      .set('Cookie', otherGuardian.cookie)
      .send({ firstName: 'Other', lastName: 'Learner', birthDate: '2014-01-01', stage: 'PRIMARY_GRAMMAR' })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners/${otherLearner.body.id}/mentors`)
      .set('Cookie', guardianCookie)
      .send({ email: 'spoofed@example.com', role: 'tutor' })
      .expect(404);
  });

  it('rejects an invite from a non-member, 403', async () => {
    const outsider = await registerAndGetCookieAndUserId('mentor-grant-outsider');
    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners/${learnerId}/mentors`)
      .set('Cookie', outsider.cookie)
      .send({ email: 'x@example.com', role: 'tutor' })
      .expect(403);
  });

  it('accepts a mentor invitation and links the real mentor account -- never creates a FamilyMember row', async () => {
    const invited = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners/${learnerId}/mentors`)
      .set('Cookie', guardianCookie)
      .send({ email: 'accept-flow@example.com', role: 'professor de música' })
      .expect(201);

    const accepted = await supertest(app.getHttpServer())
      .post(`/api/v1/mentors/${invited.body.token}/accept`)
      .set('Cookie', mentorCookie)
      .expect(200);
    expect(accepted.body).toEqual({ success: true, familyId, learnerId });

    const listed = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/learners/${learnerId}/mentors`)
      .set('Cookie', guardianCookie)
      .expect(200);
    const grant = listed.body.find((g: { id: string }) => g.id === invited.body.id);
    expect(grant.status).toBe('ACCEPTED');
    expect(grant.mentorUserId).toBe(mentorUserId);

    // Accepting a mentor invitation is not the same as joining the
    // family: the mentor cannot act on family-scoped routes as a member.
    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', mentorCookie)
      .expect(403);
  });

  it('rejects accepting the same token twice', async () => {
    const invited = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners/${learnerId}/mentors`)
      .set('Cookie', guardianCookie)
      .send({ email: 'double-accept@example.com', role: 'tutor' })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`/api/v1/mentors/${invited.body.token}/accept`)
      .set('Cookie', mentorCookie)
      .expect(200);

    await supertest(app.getHttpServer())
      .post(`/api/v1/mentors/${invited.body.token}/accept`)
      .set('Cookie', mentorCookie)
      .expect(400);
  });

  it('rejects an invalid token, 404 not 500', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/mentors/not-a-real-token/accept')
      .set('Cookie', mentorCookie)
      .expect(404);
  });

  it('revokes a grant, and a revoked token can no longer be accepted', async () => {
    const invited = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners/${learnerId}/mentors`)
      .set('Cookie', guardianCookie)
      .send({ email: 'revoke-flow@example.com', role: 'pastor' })
      .expect(201);

    await supertest(app.getHttpServer())
      .delete(`/api/v1/mentors/${invited.body.id}`)
      .set('Cookie', guardianCookie)
      .expect(204);

    await supertest(app.getHttpServer())
      .post(`/api/v1/mentors/${invited.body.token}/accept`)
      .set('Cookie', mentorCookie)
      .expect(400);
  });

  it('rejects revoking a grant from a non-member, 403', async () => {
    const invited = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners/${learnerId}/mentors`)
      .set('Cookie', guardianCookie)
      .send({ email: 'revoke-forbidden@example.com', role: 'tutor' })
      .expect(201);

    const outsider = await registerAndGetCookieAndUserId('mentor-grant-revoke-outsider');
    await supertest(app.getHttpServer())
      .delete(`/api/v1/mentors/${invited.body.id}`)
      .set('Cookie', outsider.cookie)
      .expect(403);
  });

  it('a linked mentor account is the real assessorUserId on an assessment, not just a bare string', async () => {
    const invited = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners/${learnerId}/mentors`)
      .set('Cookie', guardianCookie)
      .send({ email: 'assessment-link@example.com', role: 'mestre de ofício' })
      .expect(201);
    await supertest(app.getHttpServer())
      .post(`/api/v1/mentors/${invited.body.token}/accept`)
      .set('Cookie', mentorCookie)
      .expect(200);

    const rubric = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/rubric-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.MENTOR.RUBRIC.${upperCode()}`, name: 'Mentor Assessment Rubric' })
      .expect(201);
    const criterion = await supertest(app.getHttpServer())
      .post(`/api/v1/admin/curriculum-definitions/rubric-definitions/${rubric.body.id}/criteria`)
      .set('Cookie', adminCookie)
      .send({ code: 'CRAFTSMANSHIP', label: 'Acabamento' })
      .expect(201);

    const assessment = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/curriculum/assessment-results`)
      .set('Cookie', guardianCookie)
      .send({
        learnerId,
        rubricDefinitionId: rubric.body.id,
        assessorType: 'MENTOR',
        assessorUserId: mentorUserId,
        scores: [{ rubricCriterionId: criterion.body.id, score: 4 }],
      })
      .expect(201);

    expect(assessment.body.assessorType).toBe('MENTOR');
    expect(assessment.body.assessorUserId).toBe(mentorUserId);
  });

  it('rejects an unauthenticated invite', async () => {
    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners/${learnerId}/mentors`)
      .send({ email: 'x@example.com', role: 'tutor' })
      .expect(401);
  });
});
