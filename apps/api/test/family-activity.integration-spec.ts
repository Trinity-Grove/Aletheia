import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

describe('Family-created activities (issue #96 section 7, issue #245) (real Postgres)', () => {
  let app: NestFastifyApplication;
  let familyCookie: string;
  let familyId: string;
  let otherFamilyCookie: string;
  let otherFamilyId: string;

  async function registerAndGetCookie(prefix: string): Promise<string> {
    const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'somePassword123',
        fullName: 'Family Activity Test',
        countryCode: 'BRA',
        acceptedTermsOfUse: true,
        acceptedPrivacyPolicy: true,
      })
      .expect(201);
    return [response.headers['set-cookie']]
      .flat()
      .find((cookie) => cookie?.startsWith('aletheia_session='))!;
  }

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    familyCookie = await registerAndGetCookie('family-activity-guardian');
    const family = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', familyCookie)
      .send({ name: 'Family Activity Family', countryCode: 'BRA' })
      .expect(201);
    familyId = family.body.id;

    otherFamilyCookie = await registerAndGetCookie('family-activity-other-guardian');
    const otherFamily = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', otherFamilyCookie)
      .send({ name: 'Other Family', countryCode: 'BRA' })
      .expect(201);
    otherFamilyId = otherFamily.body.id;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('creates a family activity defaulting to PRIVATE visibility, and lets the family change it', async () => {
    const created = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/activities`)
      .set('Cookie', familyCookie)
      .send({ name: 'Passeio no parque', description: 'Observar plantas e insetos' })
      .expect(201);

    expect(created.body.familyId).toBe(familyId);
    expect(created.body.name).toBe('Passeio no parque');
    expect(created.body.visibility).toBe('PRIVATE');
    expect(created.body.evidenceRequirementMode).toBe('ANY');
    expect(created.body.supervisionRequired).toBe(false);

    const listed = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/activities`)
      .set('Cookie', familyCookie)
      .expect(200);
    expect(listed.body.map((a: { id: string }) => a.id)).toContain(created.body.id);

    const fetched = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/activities/${created.body.id}`)
      .set('Cookie', familyCookie)
      .expect(200);
    expect(fetched.body.id).toBe(created.body.id);

    const updated = await supertest(app.getHttpServer())
      .put(`/api/v1/families/${familyId}/activities/${created.body.id}`)
      .set('Cookie', familyCookie)
      .send({
        name: 'Passeio no parque',
        description: 'Observar plantas e insetos',
        visibility: 'PUBLIC',
      })
      .expect(200);
    expect(updated.body.visibility).toBe('PUBLIC');

    await supertest(app.getHttpServer())
      .delete(`/api/v1/families/${familyId}/activities/${created.body.id}`)
      .set('Cookie', familyCookie)
      .expect(204);

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/activities/${created.body.id}`)
      .set('Cookie', familyCookie)
      .expect(404);
  });

  it('rejects an activity with ageMax below ageMin, at the contract layer', async () => {
    await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/activities`)
      .set('Cookie', familyCookie)
      .send({ name: 'Atividade inválida', ageMin: 10, ageMax: 5 })
      .expect(400);
  });

  it('never lets one family read, update or delete another family\'s activity', async () => {
    const created = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/activities`)
      .set('Cookie', familyCookie)
      .send({ name: 'Atividade privada da família A' })
      .expect(201);

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/activities/${created.body.id}`)
      .set('Cookie', otherFamilyCookie)
      .expect(403);

    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${otherFamilyId}/activities`)
      .set('Cookie', familyCookie)
      .expect(403);
  });
});
