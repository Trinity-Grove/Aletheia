import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { registerAndConfirmGuardian } from './helpers/register-verified-guardian.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { FeedbackRepository } from '../src/modules/feedback/infrastructure/feedback.repository.js';
import { NotificationRepository } from '../src/modules/settings/infrastructure/notification.repository.js';
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
  let prisma: PrismaService;
  const originalProvider = process.env.GITHUB_ISSUE_PROVIDER;
  const originalAdmins = process.env.PLATFORM_ADMIN_EMAILS;

  async function registerWithFamily(prefix: string, emailOverride?: string) {
    const email = emailOverride ?? `${prefix}-${crypto.randomUUID()}@example.com`;
    const registration = await registerAndConfirmGuardian(app, {
      email, password: 'somePassword123', fullName: 'Feedback Test Guardian',
      countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true,
    });
    const cookie = [registration.headers['set-cookie']].flat()
      .find((value) => value?.startsWith('aletheia_session='))!;
    const family = await supertest(app.getHttpServer()).post('/api/v1/families')
      .set('Cookie', cookie).send({ name: `${prefix} Family`, countryCode: 'BR' }).expect(201);
    return { cookie, familyId: family.body.id as string, email };
  }

  async function submit(message: string, identifySelf = false) {
    return supertest(app.getHttpServer()).post(`/api/v1/families/${familyAId}/feedback`)
      .set('Cookie', familyAAdminCookie).send({ category: 'BUG', message, identifySelf }).expect(201);
  }

  function approve(id: string) {
    return supertest(app.getHttpServer()).post(`/api/v1/admin/feedback/${id}/approve`)
      .set('Cookie', familyAAdminCookie).send({ title: 'Feedback integration issue', labels: [] });
  }

  async function notifications() {
    const response = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyAId}/notifications`)
      .set('Cookie', familyAAdminCookie).expect(200);
    return response.body as Array<{ type: string; linkUrl: string | null; message: string }>;
  }

  beforeAll(async () => {
    process.env.GITHUB_ISSUE_PROVIDER = 'mock';
    const adminEmail = `admin-feedback-${crypto.randomUUID()}@example.com`;
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    const familyA = await registerWithFamily('feedback-family-a-admin', adminEmail);
    familyAAdminEmail = familyA.email;
    familyAAdminCookie = familyA.cookie;
    familyAId = familyA.familyId;
    const familyB = await registerWithFamily('feedback-family-b');
    familyBGuardianCookie = familyB.cookie;
    familyBId = familyB.familyId;
    mockGateway = app.get(GITHUB_ISSUE_GATEWAY);
    prisma = app.get(PrismaService);
  }, 30000);

  afterAll(async () => {
    await app?.close();
    if (originalProvider === undefined) delete process.env.GITHUB_ISSUE_PROVIDER;
    else process.env.GITHUB_ISSUE_PROVIDER = originalProvider;
    if (originalAdmins === undefined) delete process.env.PLATFORM_ADMIN_EMAILS;
    else process.env.PLATFORM_ADMIN_EMAILS = originalAdmins;
  });

  beforeEach(() => jest.restoreAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it('serializes concurrent approvals so only one issue and notification are created', async () => {
    const submission = await submit('Concurrent approvals must not duplicate this issue');
    const before = await notifications();
    const create = mockGateway.createIssue.bind(mockGateway);
    const createIssue = jest.spyOn(mockGateway, 'createIssue').mockImplementation(async params => {
      await new Promise(resolve => setTimeout(resolve, 150));
      return create(params);
    });
    const results = await Promise.all([approve(submission.body.id), approve(submission.body.id)]);
    expect(results.map(result => result.status).sort()).toEqual([200, 409]);
    expect(createIssue).toHaveBeenCalledTimes(1);
    expect(await notifications()).toHaveLength(before.length + 1);
  });

  it('does not let a rejection overtake an approval already creating its issue', async () => {
    const submission = await submit('Approval and rejection must have one stable outcome');
    let signalStarted!: () => void;
    const started = new Promise<void>(resolve => { signalStarted = resolve; });
    const create = mockGateway.createIssue.bind(mockGateway);
    jest.spyOn(mockGateway, 'createIssue').mockImplementation(async params => {
      signalStarted();
      await new Promise(resolve => setTimeout(resolve, 150));
      return create(params);
    });
    const approval = approve(submission.body.id).then(result => result);
    await started;
    const rejection = supertest(app.getHttpServer()).post(`/api/v1/admin/feedback/${submission.body.id}/reject`)
      .set('Cookie', familyAAdminCookie).send({ reason: 'Concurrent rejection attempt' });
    const results = await Promise.all([approval, rejection]);
    expect(results.map(result => result.status)).toEqual([200, 409]);
    expect((await prisma.feedbackSubmission.findUniqueOrThrow({ where: { id: submission.body.id } })).status).toBe('APPROVED');
  });

  it('rolls approval back when notification storage fails and retries without another issue', async () => {
    const submission = await submit('The outcome and its notification must commit together');
    const before = await notifications();
    const createIssue = jest.spyOn(mockGateway, 'createIssue');
    jest.spyOn(app.get(NotificationRepository), 'create').mockRejectedValueOnce(new Error('Notification storage failed'));
    await approve(submission.body.id).expect(500);
    expect((await prisma.feedbackSubmission.findUniqueOrThrow({ where: { id: submission.body.id } })).status).toBe('PENDING');
    expect(await notifications()).toHaveLength(before.length);
    await approve(submission.body.id).expect(200);
    expect(createIssue).toHaveBeenCalledTimes(1);
    expect(await notifications()).toHaveLength(before.length + 1);
  });

  it('defaults to anonymous and does not store or return identity fields', async () => {
    const response = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/feedback`).set('Cookie', familyAAdminCookie)
      .send({ category: 'BUG', message: 'Something is broken anonymously',
        pagePath: '/dashboard', locale: 'pt-BR', appVersion: '1.0.0', userAgent: 'test-agent' })
      .expect(201);
    expect(response.body).toEqual({
      id: expect.any(String), status: 'PENDING', category: 'BUG',
      identifySelf: false, createdAt: expect.any(String),
    });
    const detail = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/feedback/${response.body.id}`).set('Cookie', familyAAdminCookie).expect(200);
    expect(detail.body.submitterName).toBeNull();
    expect(detail.body.submitterEmail).toBeNull();
    const row = await prisma.feedbackSubmission.findUniqueOrThrow({ where: { id: response.body.id } });
    expect(row.submitterName).toBeNull();
    expect(row.submitterEmail).toBeNull();
  });

  it('freezes the authenticated identity at submission time when opted in', async () => {
    const response = await submit('Identified feedback from the guardian', true);
    const row = await prisma.feedbackSubmission.findUniqueOrThrow({ where: { id: response.body.id } });
    await prisma.user.update({ where: { id: row.submittedByUserId }, data: { fullName: 'Changed after submission' } });
    try {
      const detail = await supertest(app.getHttpServer())
        .get(`/api/v1/admin/feedback/${row.id}`).set('Cookie', familyAAdminCookie).expect(200);
      expect(detail.body.submitterName).toBe('Feedback Test Guardian');
      expect(detail.body.submitterEmail).toBe(familyAAdminEmail);
    } finally {
      await prisma.user.update({ where: { id: row.submittedByUserId }, data: { fullName: 'Feedback Test Guardian' } });
    }
  });

  it('keeps GitHub failures pending with an error and no notification, then permits retry', async () => {
    const response = await submit('This issue will fail upstream before retry');
    const before = await notifications();
    jest.spyOn(mockGateway, 'createIssue').mockRejectedValueOnce(new Error('GitHub 401: Bad credentials'));
    await approve(response.body.id).expect(502);
    const pending = await prisma.feedbackSubmission.findUniqueOrThrow({ where: { id: response.body.id } });
    expect(pending.status).toBe('PENDING');
    expect(pending.lastIssueError).toContain('GitHub 401');
    expect(pending.githubIssueNumber).toBeNull();
    expect(await notifications()).toHaveLength(before.length);
    const retried = await approve(response.body.id).expect(200);
    expect(retried.body.status).toBe('APPROVED');
    expect(retried.body.lastIssueError).toBeNull();
  });

  it('reuses the issue on retry after GitHub succeeds but the database write fails', async () => {
    const response = await submit('Retry after the database write fails');
    const createIssue = jest.spyOn(mockGateway, 'createIssue');
    const repository = app.get(FeedbackRepository);
    jest.spyOn(repository, 'markApproved').mockRejectedValueOnce(new Error('Simulated database write failure'));
    await approve(response.body.id).expect(500);
    const pending = await prisma.feedbackSubmission.findUniqueOrThrow({ where: { id: response.body.id } });
    expect(pending.status).toBe('PENDING');
    const retried = await approve(response.body.id).expect(200);
    expect(createIssue).toHaveBeenCalledTimes(1);
    const created = await createIssue.mock.results[0]!.value;
    expect(retried.body.githubIssueNumber).toBe(created.number);
  });

  it('sends exactly one notification per outcome and prevents a second review', async () => {
    const before = await notifications();
    const approved = await submit('A useful bug report to approve');
    const approval = await approve(approved.body.id).expect(200);
    await approve(approved.body.id).expect(409);
    await supertest(app.getHttpServer()).post(`/api/v1/admin/feedback/${approved.body.id}/reject`)
      .set('Cookie', familyAAdminCookie).send({ reason: 'Cannot reject an approval' }).expect(409);
    const rejected = await submit('A duplicate report to reject');
    await supertest(app.getHttpServer()).post(`/api/v1/admin/feedback/${rejected.body.id}/reject`)
      .set('Cookie', familyAAdminCookie).send({ reason: 'Duplicate submission' }).expect(200);
    await supertest(app.getHttpServer()).post(`/api/v1/admin/feedback/${rejected.body.id}/reject`)
      .set('Cookie', familyAAdminCookie).send({ reason: 'Duplicate submission' }).expect(409);
    const after = await notifications();
    expect(after.filter((item) => item.type === 'FEEDBACK_APPROVED')).toHaveLength(
      before.filter((item) => item.type === 'FEEDBACK_APPROVED').length + 1);
    expect(after.filter((item) => item.type === 'FEEDBACK_REJECTED')).toHaveLength(
      before.filter((item) => item.type === 'FEEDBACK_REJECTED').length + 1);
    expect(after.some((item) => item.linkUrl === approval.body.githubIssueUrl)).toBe(true);
    expect(after.some((item) => item.type === 'FEEDBACK_REJECTED' && item.message.includes('Duplicate submission'))).toBe(true);
  });

  it('blocks non-admins from every triage operation', async () => {
    const response = await submit('Only platform admins should triage');
    await supertest(app.getHttpServer()).get('/api/v1/admin/feedback')
      .set('Cookie', familyBGuardianCookie).expect(403);
    await supertest(app.getHttpServer()).get(`/api/v1/admin/feedback/${response.body.id}`)
      .set('Cookie', familyBGuardianCookie).expect(403);
    await supertest(app.getHttpServer()).post(`/api/v1/admin/feedback/${response.body.id}/approve`)
      .set('Cookie', familyBGuardianCookie).send({ title: 'Unauthorized', labels: [] }).expect(403);
    await supertest(app.getHttpServer()).post(`/api/v1/admin/feedback/${response.body.id}/reject`)
      .set('Cookie', familyBGuardianCookie).send({ reason: 'Unauthorized' }).expect(403);
  });

  it('allows the second family guardian to submit and prevents crossing family boundaries', async () => {
    await supertest(app.getHttpServer()).post(`/api/v1/families/${familyBId}/feedback`)
      .set('Cookie', familyBGuardianCookie).send({ category: 'QUESTION', message: 'Question from family B', identifySelf: true })
      .expect(201);
    await supertest(app.getHttpServer()).post(`/api/v1/families/${familyAId}/feedback`)
      .set('Cookie', familyBGuardianCookie).send({ category: 'QUESTION', message: 'Attempt to cross family boundaries' })
      .expect(403);
  });

  it('blocks an EDUCATOR even with a valid family membership', async () => {
    const member = await prisma.familyMember.findFirstOrThrow({ where: { familyId: familyBId } });
    await prisma.familyMember.update({ where: { id: member.id }, data: { role: 'EDUCATOR' } });
    try {
      await supertest(app.getHttpServer()).post(`/api/v1/families/${familyBId}/feedback`)
        .set('Cookie', familyBGuardianCookie).send({ category: 'BUG', message: 'Educators cannot submit family feedback' })
        .expect(403);
    } finally {
      await prisma.familyMember.update({ where: { id: member.id }, data: { role: member.role } });
    }
  });

  it('validates message and category and requires a rejection reason', async () => {
    await supertest(app.getHttpServer()).post(`/api/v1/families/${familyAId}/feedback`)
      .set('Cookie', familyAAdminCookie).send({ category: 'FEATURE_REQUEST', message: 'An unsupported category' }).expect(400);
    await supertest(app.getHttpServer()).post(`/api/v1/families/${familyAId}/feedback`)
      .set('Cookie', familyAAdminCookie).send({ category: 'IDEA', message: ' '.repeat(40) }).expect(400);
    const response = await submit('This rejection must include a reason');
    await supertest(app.getHttpServer()).post(`/api/v1/admin/feedback/${response.body.id}/reject`)
      .set('Cookie', familyAAdminCookie).send({ reason: '' }).expect(400);
    expect((await prisma.feedbackSubmission.findUniqueOrThrow({ where: { id: response.body.id } })).status).toBe('PENDING');
  });
});
