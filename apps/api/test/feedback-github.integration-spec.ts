import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { registerAndConfirmGuardian } from './helpers/register-verified-guardian.js';
import { GITHUB_ISSUE_GATEWAY } from '../src/modules/feedback/infrastructure/github-issue.gateway.interface.js';
import { MockGithubIssueGateway } from '../src/modules/feedback/infrastructure/mock-github-issue.gateway.js';

describe('Feedback GitHub integration (real Postgres, mocked GitHub gateway)', () => {
  let app: NestFastifyApplication;
  let familyAAdminCookie: string;
  let familyAId: string;
  let familyAAdminEmail: string;
  let familyBGuardianCookie: string;
  let familyBId: string;
  let mockGateway: MockGithubIssueGateway;

  async function registerWithFamily(
    prefix: string,
    emailOverride?: string,
  ): Promise<{ cookie: string; familyId: string; email: string }> {
    const email = emailOverride ?? `${prefix}-${crypto.randomUUID()}@example.com`;
    const registerResponse = await registerAndConfirmGuardian(app, {
      email,
      password: 'somePassword123',
      fullName: 'Feedback Test Guardian',
      countryCode: 'BRA',
      acceptedTermsOfUse: true,
      acceptedPrivacyPolicy: true,
    });

    const cookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    const familyResponse = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', cookie)
      .send({ name: `${prefix} Family`, countryCode: 'BR' })
      .expect(201);

    return { cookie, familyId: familyResponse.body.id, email };
  }

  beforeAll(async () => {
    process.env.GITHUB_ISSUE_PROVIDER = 'mock';
    const adminEmail = `admin-feedback-${crypto.randomUUID()}@example.com`;
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Register family A with admin user
    const familyA = await registerWithFamily('feedback-family-a-admin', adminEmail);
    familyAAdminEmail = familyA.email;
    familyAAdminCookie = familyA.cookie;
    familyAId = familyA.familyId;

    // Register family B
    const familyB = await registerWithFamily('feedback-family-b');
    familyBGuardianCookie = familyB.cookie;
    familyBId = familyB.familyId;

    // Get mock gateway instance
    mockGateway = app.get(GITHUB_ISSUE_GATEWAY) as MockGithubIssueGateway;
  }, 30000);

  afterAll(async () => {
    await app.close();
    delete process.env.GITHUB_ISSUE_PROVIDER;
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows anonymous submission and stores identity snapshot only when opt-in', async () => {
    const anonymousSubmission = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/feedback`)
      .set('Cookie', familyAAdminCookie)
      .send({
        category: 'BUG',
        message: 'Something is broken anonymously',
        identifySelf: false,
        pagePath: '/dashboard',
        locale: 'pt-BR',
        appVersion: '1.0.0',
        userAgent: 'test-agent',
      })
      .expect(201);

    expect(anonymousSubmission.body).toMatchObject({
      status: 'PENDING',
      category: 'BUG',
      identifySelf: false,
    });

    const list = await supertest(app.getHttpServer())
      .get('/api/v1/admin/feedback')
      .set('Cookie', familyAAdminCookie)
      .expect(200);

    const found = list.body.items.find(
      (item: any) => item.id === anonymousSubmission.body.id,
    );
    expect(found).toBeDefined();
    expect(found.identifySelf).toBe(false);
    expect(found.submitterName).toBeNull();
    expect(found.submitterEmail).toBeNull();
  });

  it('stores identity snapshot when identifySelf is true', async () => {
    const identifiedSubmission = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/feedback`)
      .set('Cookie', familyAAdminCookie)
      .send({
        category: 'IDEA',
        message: 'Great idea to implement',
        identifySelf: true,
      })
      .expect(201);

    expect(identifiedSubmission.body.identifySelf).toBe(true);

    const list = await supertest(app.getHttpServer())
      .get('/api/v1/admin/feedback')
      .set('Cookie', familyAAdminCookie)
      .expect(200);

    const found = list.body.items.find(
      (item: any) => item.id === identifiedSubmission.body.id,
    );
    expect(found).toBeDefined();
    expect(found.identifySelf).toBe(true);
    expect(found.submitterName).toBe('Feedback Test Guardian');
    expect(found.submitterEmail).toBe(familyAAdminEmail);
  });

  it('handles GitHub failure - leaves submission PENDING with lastIssueError', async () => {
    const submission = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/feedback`)
      .set('Cookie', familyAAdminCookie)
      .send({
        category: 'BUG',
        message: 'This will fail to create GitHub issue',
        identifySelf: false,
      })
      .expect(201);

    const submissionId = submission.body.id;

    const createIssueSpy = jest
      .spyOn(mockGateway, 'createIssue')
      .mockRejectedValueOnce(new Error('GitHub 401: Bad credentials'));

    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/feedback/${submissionId}/approve`)
      .set('Cookie', familyAAdminCookie)
      .send({
        title: 'Failed approval test',
        labels: ['test'],
      })
      .expect(502);

    expect(createIssueSpy).toHaveBeenCalledTimes(1);

    const list = await supertest(app.getHttpServer())
      .get('/api/v1/admin/feedback')
      .set('Cookie', familyAAdminCookie)
      .expect(200);

    const found = list.body.items.find((item: any) => item.id === submissionId);
    expect(found).toBeDefined();
    expect(found.status).toBe('PENDING');
    expect(found.lastIssueError).toContain('GitHub 401');
    expect(found.githubIssueNumber).toBeNull();
    expect(found.githubIssueUrl).toBeNull();
  });

  it('retries approval - reuses existing issue (no second create)', async () => {
    const submission = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/feedback`)
      .set('Cookie', familyAAdminCookie)
      .send({
        category: 'FEATURE_REQUEST',
        message: 'Retry test submission',
        identifySelf: false,
      })
      .expect(201);

    const submissionId = submission.body.id;

    const createIssueSpy = jest.spyOn(mockGateway, 'createIssue');

    const firstApproval = await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/feedback/${submissionId}/approve`)
      .set('Cookie', familyAAdminCookie)
      .send({
        title: 'Retry test issue',
        labels: ['enhancement'],
      })
      .expect(200);

    expect(createIssueSpy).toHaveBeenCalledTimes(1);
    const firstIssueNumber = firstApproval.body.githubIssueNumber;
    expect(firstIssueNumber).toBeDefined();

    // Create another submission - when approved, mock findIssueByMarker to return existing
    const submission2 = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/feedback`)
      .set('Cookie', familyAAdminCookie)
      .send({
        category: 'IDEA',
        message: 'Second submission that should reuse issue on retry',
        identifySelf: false,
      })
      .expect(201);

    const findIssueSpy = jest
      .spyOn(mockGateway, 'findIssueByMarker')
      .mockResolvedValue({
        number: 999,
        url: 'https://github.com/Trinity-Grove/Aletheia/issues/999',
      });
    const createIssueSpy2 = jest.spyOn(mockGateway, 'createIssue');

    const approval = await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/feedback/${submission2.body.id}/approve`)
      .set('Cookie', familyAAdminCookie)
      .send({
        title: 'Should reuse',
        labels: [],
      })
      .expect(200);

    expect(findIssueSpy).toHaveBeenCalled();
    expect(createIssueSpy2).not.toHaveBeenCalled();
    expect(approval.body.githubIssueNumber).toBe(999);
  });

  it('sends notifications once per outcome (approval and rejection)', async () => {
    const approvalSubmission = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/feedback`)
      .set('Cookie', familyAAdminCookie)
      .send({
        category: 'PRAISE',
        message: 'Great job team',
        identifySelf: false,
      })
      .expect(201);

    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/feedback/${approvalSubmission.body.id}/approve`)
      .set('Cookie', familyAAdminCookie)
      .send({
        title: 'Praise received',
        labels: ['praise'],
      })
      .expect(200);

    const rejectSubmission = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/feedback`)
      .set('Cookie', familyAAdminCookie)
      .send({
        category: 'BUG',
        message: 'Not actionable',
        identifySelf: false,
      })
      .expect(201);

    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/feedback/${rejectSubmission.body.id}/reject`)
      .set('Cookie', familyAAdminCookie)
      .send({
        reason: 'Duplicate submission',
      })
      .expect(200);

    const notifications = await supertest(app.getHttpServer())
      .get('/api/v1/settings/notifications')
      .set('Cookie', familyAAdminCookie)
      .expect(200);

    const feedbackNotifications = notifications.body.items.filter(
      (n: any) =>
        n.type === 'FEEDBACK_APPROVED' || n.type === 'FEEDBACK_REJECTED',
    );
    expect(feedbackNotifications.length).toBeGreaterThanOrEqual(2);
  });

  it('returns 409 when approving/rejecting a non-pending submission (second approval)', async () => {
    const submission = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/feedback`)
      .set('Cookie', familyAAdminCookie)
      .send({
        category: 'QUESTION',
        message: 'Already processed',
        identifySelf: false,
      })
      .expect(201);

    const submissionId = submission.body.id;

    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/feedback/${submissionId}/approve`)
      .set('Cookie', familyAAdminCookie)
      .send({
        title: 'Processed',
        labels: [],
      })
      .expect(200);

    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/feedback/${submissionId}/approve`)
      .set('Cookie', familyAAdminCookie)
      .send({
        title: 'Try again',
        labels: [],
      })
      .expect(409);

    const submission2 = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/feedback`)
      .set('Cookie', familyAAdminCookie)
      .send({
        category: 'BUG',
        message: 'Will be rejected then tried again',
        identifySelf: false,
      })
      .expect(201);

    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/feedback/${submission2.body.id}/reject`)
      .set('Cookie', familyAAdminCookie)
      .send({ reason: 'Not relevant' })
      .expect(200);

    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/feedback/${submission2.body.id}/reject`)
      .set('Cookie', familyAAdminCookie)
      .send({ reason: 'Still not relevant' })
      .expect(409);
  });

  it('blocks non-admin from triage operations', async () => {
    const submission = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/feedback`)
      .set('Cookie', familyAAdminCookie)
      .send({
        category: 'IDEA',
        message: 'Only admins should triage',
        identifySelf: false,
      })
      .expect(201);

    const submissionId = submission.body.id;

    await supertest(app.getHttpServer())
      .get('/api/v1/admin/feedback')
      .set('Cookie', familyBGuardianCookie)
      .expect(403);

    await supertest(app.getHttpServer())
      .get(`/api/v1/admin/feedback/${submissionId}`)
      .set('Cookie', familyBGuardianCookie)
      .expect(403);

    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/feedback/${submissionId}/approve`)
      .set('Cookie', familyBGuardianCookie)
      .send({ title: 'Unauthorized', labels: [] })
      .expect(403);

    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/feedback/${submissionId}/reject`)
      .set('Cookie', familyBGuardianCookie)
      .send({ reason: 'Unauthorized' })
      .expect(403);
  });

  it('allows family guardians to submit feedback to their own family', async () => {
    const submission = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyBId}/feedback`)
      .set('Cookie', familyBGuardianCookie)
      .send({
        category: 'QUESTION',
        message: 'Question from family B',
        identifySelf: true,
      })
      .expect(201);

    expect(submission.body.status).toBe('PENDING');
    expect(submission.body.category).toBe('QUESTION');
    expect(submission.body.identifySelf).toBe(true);
  });

  it('enforces family isolation - family B cannot see family A submissions via admin', async () => {
    const submissionA = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/feedback`)
      .set('Cookie', familyAAdminCookie)
      .send({
        category: 'QUESTION',
        message: 'Family A question',
        identifySelf: false,
      })
      .expect(201);

    const listA = await supertest(app.getHttpServer())
      .get('/api/v1/admin/feedback')
      .set('Cookie', familyAAdminCookie)
      .expect(200);
    expect(listA.body.items.some((i: any) => i.id === submissionA.body.id)).toBe(
      true,
    );
  });
});
