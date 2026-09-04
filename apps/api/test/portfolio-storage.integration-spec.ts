import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

function extractSessionCookie(setCookieHeader: unknown): string {
  const cookie = [setCookieHeader]
    .flat()
    .find((c): c is string => typeof c === 'string' && c.startsWith('aletheia_session='));
  if (!cookie) {
    throw new Error('No session cookie found in response headers.');
  }
  return cookie;
}

describe('Portfolio evidence upload/storage (real Postgres + real S3-compatible storage)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerFamilyWithLearner() {
    const email = `portfolio-storage-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'ownerPassword123', fullName: 'Owner Guardian' })
      .expect(201);
    const sessionCookie = extractSessionCookie(registerResponse.headers['set-cookie']);

    const familyResponse = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', sessionCookie)
      .send({ name: 'Storage Test Family', countryCode: 'BRA' })
      .expect(201);
    const familyId = familyResponse.body.id as string;

    const learnerResponse = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', sessionCookie)
      .send({ firstName: 'Evidence', lastName: 'Learner', birthDate: '2015-01-01' })
      .expect(201);
    const learnerId = learnerResponse.body.id as string;

    return { sessionCookie, familyId, learnerId };
  }

  async function createPortfolioItem(sessionCookie: string, familyId: string, learnerId: string) {
    const res = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/portfolio`)
      .set('Cookie', sessionCookie)
      .send({ learnerId, title: 'Watercolor painting', type: 'IMAGE' })
      .expect(201);
    return res.body.id as string;
  }

  it('completes a real presigned upload -> confirm -> download round trip', async () => {
    const { sessionCookie, familyId, learnerId } = await registerFamilyWithLearner();
    const itemId = await createPortfolioItem(sessionCookie, familyId, learnerId);
    const fileContent = Buffer.from('fake-png-bytes-for-integration-test');

    const uploadUrlRes = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/portfolio/${itemId}/upload-url`)
      .set('Cookie', sessionCookie)
      .send({ fileName: 'painting.png', mimeType: 'image/png', fileSizeBytes: fileContent.byteLength })
      .expect(201);

    expect(uploadUrlRes.body.uploadUrl).toContain('X-Amz-Signature');
    expect(uploadUrlRes.body.storageKey).toContain(`families/${familyId}/portfolio/${itemId}/`);

    const putResponse = await fetch(uploadUrlRes.body.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: fileContent,
    });
    expect(putResponse.ok).toBe(true);

    const confirmRes = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/portfolio/${itemId}/confirm-upload`)
      .set('Cookie', sessionCookie)
      .expect(200);
    expect(confirmRes.body.mimeType).toBe('image/png');
    expect(confirmRes.body.fileSizeBytes).toBe(fileContent.byteLength);

    const downloadUrlRes = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/portfolio/${itemId}/download-url`)
      .set('Cookie', sessionCookie)
      .expect(200);

    const downloaded = await fetch(downloadUrlRes.body.downloadUrl);
    expect(downloaded.ok).toBe(true);
    const downloadedBuffer = Buffer.from(await downloaded.arrayBuffer());
    expect(downloadedBuffer.equals(fileContent)).toBe(true);
  });

  it('rejects confirm-upload when the object was never actually uploaded', async () => {
    const { sessionCookie, familyId, learnerId } = await registerFamilyWithLearner();
    const itemId = await createPortfolioItem(sessionCookie, familyId, learnerId);

    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/portfolio/${itemId}/upload-url`)
      .set('Cookie', sessionCookie)
      .send({ fileName: 'never-uploaded.png', mimeType: 'image/png', fileSizeBytes: 10 })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/portfolio/${itemId}/confirm-upload`)
      .set('Cookie', sessionCookie)
      .expect(400);
  });

  it('re-requesting an upload URL for the same item never creates an orphan row (repeatable, interrupted upload)', async () => {
    const { sessionCookie, familyId, learnerId } = await registerFamilyWithLearner();
    const itemId = await createPortfolioItem(sessionCookie, familyId, learnerId);

    const first = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/portfolio/${itemId}/upload-url`)
      .set('Cookie', sessionCookie)
      .send({ fileName: 'attempt-1.png', mimeType: 'image/png', fileSizeBytes: 10 })
      .expect(201);

    const second = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/portfolio/${itemId}/upload-url`)
      .set('Cookie', sessionCookie)
      .send({ fileName: 'attempt-2.png', mimeType: 'image/png', fileSizeBytes: 10 })
      .expect(201);

    expect(second.body.storageKey).not.toBe(first.body.storageKey);

    const listRes = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/portfolio?learnerId=${learnerId}`)
      .set('Cookie', sessionCookie)
      .expect(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].id).toBe(itemId);
  });

  it('never lets Family B read or overwrite Family A evidence (IDOR)', async () => {
    const familyA = await registerFamilyWithLearner();
    const itemId = await createPortfolioItem(familyA.sessionCookie, familyA.familyId, familyA.learnerId);

    const familyB = await registerFamilyWithLearner();

    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyB.familyId}/portfolio/${itemId}/upload-url`)
      .set('Cookie', familyB.sessionCookie)
      .send({ fileName: 'attack.png', mimeType: 'image/png', fileSizeBytes: 10 })
      .expect(404);

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyB.familyId}/portfolio/${itemId}/download-url`)
      .set('Cookie', familyB.sessionCookie)
      .expect(404);
  });

  it('deletes the storage object and soft-deletes the row; download-url 404s afterward', async () => {
    const { sessionCookie, familyId, learnerId } = await registerFamilyWithLearner();
    const itemId = await createPortfolioItem(sessionCookie, familyId, learnerId);
    const fileContent = Buffer.from('to-be-deleted');

    const uploadUrlRes = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/portfolio/${itemId}/upload-url`)
      .set('Cookie', sessionCookie)
      .send({ fileName: 'delete-me.png', mimeType: 'image/png', fileSizeBytes: fileContent.byteLength })
      .expect(201);
    await fetch(uploadUrlRes.body.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: fileContent,
    });
    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/portfolio/${itemId}/confirm-upload`)
      .set('Cookie', sessionCookie)
      .expect(200);

    await supertest(app.getHttpServer())
      .delete(`/api/v1/families/${familyId}/portfolio/${itemId}`)
      .set('Cookie', sessionCookie)
      .expect(200);

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/portfolio/${itemId}/download-url`)
      .set('Cookie', sessionCookie)
      .expect(404);

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/portfolio/${itemId}`)
      .set('Cookie', sessionCookie)
      .expect(404);
  });
});
