import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';
import { registerAndConfirmGuardian } from './helpers/register-verified-guardian.js';

describe('Auto-Attendance on Lesson Completion (real Postgres)', () => {
  let app: NestFastifyApplication;
  let db: PrismaService;
  let guardianCookie: string;
  let familyId: string;
  let learnerId: string;
  let subjectId: string;

  function extractCookie(response: { headers: Record<string, unknown> }, prefix: string): string {
    const cookie = [response.headers['set-cookie']].flat().find((c) => (c as string)?.startsWith(prefix));
    if (!cookie) throw new Error(`Expected a ${prefix} cookie in the response.`);
    return cookie as string;
  }

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    db = app.get(PrismaService);

    const email = `auto-attendance-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const regRes = await registerAndConfirmGuardian(app, {
      email,
      password: 'somePassword123',
      fullName: 'Auto Attendance Guardian',
      countryCode: 'BRA',
      acceptedTermsOfUse: true,
      acceptedPrivacyPolicy: true,
    });
    guardianCookie = extractCookie(regRes, 'aletheia_session=');

    const family = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', guardianCookie)
      .send({ name: 'Auto Attendance Family', countryCode: 'BRA' })
      .expect(201);
    familyId = family.body.id;

    const learner = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', guardianCookie)
      .send({
        firstName: 'Lucas',
        birthDate: '2016-05-10',
        stage: 'PRIMARY_GRAMMAR',
        acceptedDataConsent: true,
      })
      .expect(201);
    learnerId = learner.body.id;

    const subject = await db.subject.create({
      data: {
        familyId,
        name: `História ${Date.now()}`,
        color: '#3B82F6',
      },
    });
    subjectId = subject.id;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('automatically logs attendance with source AUTO_LESSON upon lesson completion', async () => {
    const lessonDate = '2026-10-15';
    const lesson = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/lessons`)
      .set('Cookie', guardianCookie)
      .send({
        subjectId,
        title: 'Revolução Francesa: Causas',
        date: lessonDate,
        learnerIds: [learnerId],
      })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/lessons/${lesson.body.id}/complete?learnerId=${learnerId}`)
      .set('Cookie', guardianCookie)
      .send({
        completedAt: `${lessonDate}T14:30:00.000Z`,
        actualDurationMinutes: 50,
        notes: 'Lição concluída com sucesso.',
      })
      .expect(200);

    const record = await db.attendanceRecord.findFirst({
      where: {
        familyId,
        learnerId,
        date: new Date(lessonDate),
      },
    });

    expect(record).not.toBeNull();
    expect(record!.status).toBe('PRESENT');
    expect(record!.source).toBe('AUTO_LESSON');
    expect(record!.notes).toBe('Presença registrada automaticamente pela conclusão da lição.');
  });

  it('is idempotent: completing a second lesson on the same day does not duplicate attendance', async () => {
    const lessonDate = '2026-10-15';
    const secondLesson = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/lessons`)
      .set('Cookie', guardianCookie)
      .send({
        subjectId,
        title: 'Revolução Francesa: Queda da Bastilha',
        date: lessonDate,
        learnerIds: [learnerId],
      })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/lessons/${secondLesson.body.id}/complete?learnerId=${learnerId}`)
      .set('Cookie', guardianCookie)
      .send({
        completedAt: `${lessonDate}T16:00:00.000Z`,
        actualDurationMinutes: 45,
      })
      .expect(200);

    const records = await db.attendanceRecord.findMany({
      where: {
        familyId,
        learnerId,
        date: new Date(lessonDate),
      },
    });

    expect(records).toHaveLength(1);
    expect(records[0]!.status).toBe('PRESENT');
    expect(records[0]!.source).toBe('AUTO_LESSON');
  });

  it('preserves prior manual attendance and does not overwrite it upon lesson completion', async () => {
    const lessonDate = '2026-10-16';

    // Guardian manually marks learner as excused absence beforehand
    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/attendance`)
      .set('Cookie', guardianCookie)
      .send({
        learnerId,
        date: lessonDate,
        status: 'EXCUSED_ABSENCE',
        source: 'MANUAL',
        notes: 'Consulta médica agendada',
      })
      .expect(201);

    const lesson = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/lessons`)
      .set('Cookie', guardianCookie)
      .send({
        subjectId,
        title: 'Leitura Complementar',
        date: lessonDate,
        learnerIds: [learnerId],
      })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/lessons/${lesson.body.id}/complete?learnerId=${learnerId}`)
      .set('Cookie', guardianCookie)
      .send({
        completedAt: `${lessonDate}T19:00:00.000Z`,
      })
      .expect(200);

    const records = await db.attendanceRecord.findMany({
      where: {
        familyId,
        learnerId,
        date: new Date(lessonDate),
      },
    });

    expect(records).toHaveLength(1);
    expect(records[0]!.status).toBe('EXCUSED_ABSENCE');
    expect(records[0]!.source).toBe('MANUAL');
    expect(records[0]!.notes).toBe('Consulta médica agendada');
  });
});
