import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { learnerGamificationSummarySchema } from '@aletheia/contracts';
import { createApplication } from '../src/main.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { registerAndConfirmGuardian } from './helpers/register-verified-guardian.js';

// Learner badges / gamification against real Postgres: awards are derived
// from the family's own records, persisted once, acknowledged only by the
// learner, never revoked, and never readable across learners or families.
describe('Learner badges (real Postgres)', () => {
  let app: NestFastifyApplication;
  let db: PrismaService;
  let guardianCookie: string;
  let outsiderCookie: string;
  let familyId: string;
  let learnerId: string;
  let siblingId: string;
  let learnerCookie: string;

  function extractCookie(response: { headers: Record<string, unknown> }, prefix: string): string {
    const cookie = [response.headers['set-cookie']].flat().find((c) => (c as string)?.startsWith(prefix));
    if (!cookie) throw new Error(`Expected a ${prefix} cookie in the response.`);
    return cookie as string;
  }

  async function registerGuardian(): Promise<string> {
    const response = await registerAndConfirmGuardian(app, {
      email: `badges-guardian-${randomUUID()}@example.com`,
      password: 'somePassword123',
      fullName: 'Badges Test Guardian',
    });
    return extractCookie(response, 'aletheia_session=');
  }

  async function createLearner(firstName: string): Promise<string> {
    const learner = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', guardianCookie)
      .send({ firstName, birthDate: '2015-01-01', stage: 'PRIMARY_GRAMMAR', acceptedDataConsent: true })
      .expect(201);
    return learner.body.id as string;
  }

  const learnerBadges = (id: string) =>
    supertest(app.getHttpServer()).get(`/api/v1/learner-access/learners/${id}/badges`).set('Cookie', learnerCookie);
  const guardianBadges = (cookie: string, id = learnerId) =>
    supertest(app.getHttpServer()).get(`/api/v1/families/${familyId}/learners/${id}/badges`).set('Cookie', cookie);

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    db = app.get(PrismaService);

    guardianCookie = await registerGuardian();
    outsiderCookie = await registerGuardian();
    const family = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', guardianCookie)
      .send({ name: 'Badges Test Family', countryCode: 'BR' })
      .expect(201);
    familyId = family.body.id as string;
    learnerId = await createLearner('Clara');
    siblingId = await createLearner('Davi');

    const titles = ['Matemática', 'Ciências', 'História'];
    await db.learningRecord.createMany({
      data: titles.map((title, index) => ({
        familyId,
        learnerId,
        title,
        date: new Date(`2026-09-${String(28 + index).padStart(2, '0')}T00:00:00.000Z`),
        durationMinutes: 40,
        type: 'PLANNED_LESSON' as const,
      })),
    });

    const grant = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners/${learnerId}/access/grant`)
      .set('Cookie', guardianCookie)
      .expect(201);
    const login = await supertest(app.getHttpServer())
      .post('/api/v1/learner-access/login')
      .send({ learnerId, code: grant.body.code })
      .expect(200);
    learnerCookie = extractCookie(login, 'aletheia_learner_session=');
  }, 60000);

  afterAll(async () => {
    await app?.close();
  });

  it('grants reached badges once and reports them as new to the learner', async () => {
    const first = await learnerBadges(learnerId).expect(200);
    expect(learnerGamificationSummarySchema.safeParse(first.body).success).toBe(true);

    const earned = first.body.badges.filter((badge: { earned: boolean }) => badge.earned);
    expect(earned.map((badge: { code: string }) => badge.code)).toEqual(['FIRST_STEP', 'STREAK_3']);
    expect(earned.every((badge: { isNew: boolean }) => badge.isNew)).toBe(true);
    expect(first.body.stats).toMatchObject({ LEARNING_DAYS: 3, LEARNING_RECORDS: 3, LEARNING_MINUTES: 120 });

    await learnerBadges(learnerId).expect(200);
    const rows = await db.learnerBadgeAward.findMany({ where: { learnerId } });
    expect(rows).toHaveLength(earned.length);
  }, 30000);

  it('lets the guardian view badges without clearing the learner celebration', async () => {
    const guardianView = await guardianBadges(guardianCookie).expect(200);
    expect(guardianView.body.earnedCount).toBeGreaterThan(0);
    const learnerView = await learnerBadges(learnerId).expect(200);
    expect(learnerView.body.badges.some((badge: { isNew: boolean }) => badge.isNew)).toBe(true);
  });

  it('clears isNew only for acknowledged badges', async () => {
    const acknowledged = await supertest(app.getHttpServer())
      .post(`/api/v1/learner-access/learners/${learnerId}/badges/acknowledge`)
      .set('Cookie', learnerCookie)
      .send({ badgeCodes: ['FIRST_STEP'] })
      .expect(200);
    expect(acknowledged.body).toEqual({ acknowledged: 1 });

    const afterOne = await learnerBadges(learnerId).expect(200);
    const firstStep = afterOne.body.badges.find((badge: { code: string }) => badge.code === 'FIRST_STEP');
    expect(firstStep.isNew).toBe(false);
    expect(afterOne.body.badges.some((badge: { isNew: boolean }) => badge.isNew)).toBe(true);

    await supertest(app.getHttpServer())
      .post(`/api/v1/learner-access/learners/${learnerId}/badges/acknowledge`)
      .set('Cookie', learnerCookie)
      .send({})
      .expect(200);
    const afterAll = await learnerBadges(learnerId).expect(200);
    expect(afterAll.body.badges.some((badge: { isNew: boolean }) => badge.isNew)).toBe(false);
  });

  it('keeps earned badges after the underlying records are deleted', async () => {
    await db.learningRecord.deleteMany({ where: { learnerId } });
    const summary = await learnerBadges(learnerId).expect(200);
    expect(summary.body.stats.LEARNING_RECORDS).toBe(0);
    expect(summary.body.badges.find((badge: { code: string }) => badge.code === 'FIRST_STEP').earned).toBe(true);
  });

  it("never exposes a sibling's or another family's badges", async () => {
    await learnerBadges(siblingId).expect(403);
    await supertest(app.getHttpServer())
      .post(`/api/v1/learner-access/learners/${siblingId}/badges/acknowledge`)
      .set('Cookie', learnerCookie)
      .send({})
      .expect(403);
    await guardianBadges(outsiderCookie).expect(403);
    await guardianBadges(guardianCookie, randomUUID()).expect(404);
  });
});
