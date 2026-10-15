import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { registerAndConfirmGuardian } from './helpers/register-verified-guardian.js';

describe('Family learning resources B09 (real Postgres)', () => {
  let app: NestFastifyApplication;
  let familyCookie: string;
  let familyId: string;
  let otherFamilyCookie: string;
  let otherFamilyId: string;

  async function registerAndGetCookie(prefix: string): Promise<string> {
    const response = await registerAndConfirmGuardian(app, {
      email: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: 'somePassword123',
      fullName: 'B09 Resource Test',
      countryCode: 'BRA',
      acceptedTermsOfUse: true,
      acceptedPrivacyPolicy: true,
    });
    return [response.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_session='))!;
  }

  async function createFamily(cookie: string, name: string): Promise<string> {
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', cookie)
      .send({ name, countryCode: 'BRA' })
      .expect(201);
    return response.body.id as string;
  }

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    familyCookie = await registerAndGetCookie('b09-resource-owner');
    familyId = await createFamily(familyCookie, 'B09 Resource Family');
    otherFamilyCookie = await registerAndGetCookie('b09-resource-adopter');
    otherFamilyId = await createFamily(otherFamilyCookie, 'B09 Adopter Family');
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  it('shares materials, plans and chronograms without identity, then adopts a private snapshot', async () => {
    const resourcePayloads = [
      {
        resourceType: 'MATERIAL',
        title: 'Cartões de leitura B09',
        content: { kind: 'MATERIAL', items: [{ type: 'TEXT', title: 'Cartões', value: 'Palavras simples' }] },
      },
      {
        resourceType: 'LESSON_PLAN',
        title: 'Observação da natureza B09',
        content: { kind: 'LESSON_PLAN', objective: 'Observar', durationMinutes: 45, materials: ['Caderno'], steps: [{ title: 'Caminhar' }] },
      },
      {
        resourceType: 'CHRONOGRAM',
        title: 'Ritmo semanal B09',
        content: { kind: 'CHRONOGRAM', cadence: 'WEEKLY', slots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '10:00', title: 'Leitura' }] },
      },
    ];

    const created = await Promise.all(resourcePayloads.map((payload) => supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learning-resources`)
      .set('Cookie', familyCookie)
      .send(payload)
      .expect(201)));

    const privateResource = created[0]!.body;
    expect(privateResource.visibility).toBe('PRIVATE');

    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${otherFamilyId}/learning-resources/adopt`)
      .set('Cookie', otherFamilyCookie)
      .send({ sourceResourceId: privateResource.id })
      .expect(404);

    const published = await supertest(app.getHttpServer())
      .patch(`/api/v1/families/${familyId}/learning-resources/${privateResource.id}`)
      .set('Cookie', familyCookie)
      .send({ visibility: 'PUBLIC' })
      .expect(200);
    expect(published.body.visibility).toBe('PUBLIC');

    const community = await supertest(app.getHttpServer())
      .get('/api/v1/community/learning-resources')
      .set('Cookie', otherFamilyCookie)
      .expect(200);
    const publicResource = community.body.find((resource: { id: string }) => resource.id === privateResource.id);
    expect(publicResource).toBeDefined();
    expect(publicResource.familyId).toBeUndefined();

    const adopted = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${otherFamilyId}/learning-resources/adopt`)
      .set('Cookie', otherFamilyCookie)
      .send({ sourceResourceId: privateResource.id })
      .expect(201);
    expect(adopted.body.familyId).toBe(otherFamilyId);
    expect(adopted.body.visibility).toBe('PRIVATE');

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${otherFamilyId}/learning-resources/${adopted.body.id}`)
      .set('Cookie', familyCookie)
      .expect(403);

    await supertest(app.getHttpServer())
      .patch(`/api/v1/families/${familyId}/learning-resources/${privateResource.id}`)
      .set('Cookie', familyCookie)
      .send({ visibility: 'PRIVATE' })
      .expect(200);

    const afterUnshare = await supertest(app.getHttpServer())
      .get('/api/v1/community/learning-resources')
      .set('Cookie', otherFamilyCookie)
      .expect(200);
    expect(afterUnshare.body.map((resource: { id: string }) => resource.id)).not.toContain(privateResource.id);

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${otherFamilyId}/learning-resources/${adopted.body.id}`)
      .set('Cookie', otherFamilyCookie)
      .expect(200);
  });
});
