import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Proves issue #96 section 15 (Escatologia) is already representable in
// the existing TheologicalTraditionDefinition/TheologicalPositionDefinition
// tables (built in PR #111) without a new table, once
// TheologicalPositionDefinition.traditionId is relaxed to nullable (this
// PR's only schema change) -- see the reasoning in
// packages/contracts/src/theological-taxonomy.ts.
//
// Millennial views (historic premillennialism, dispensational
// premillennialism, amillennialism, postmillennialism) are mutually
// exclusive alternatives on one question; Revelation interpretive
// schools (preterism, historicism, futurism, idealism) are mutually
// exclusive alternatives on a different question. Both axes are
// expressed purely as data: multiple TheologicalPositionDefinition rows
// sharing the same `topic` string, none of them privileged by the
// schema or any status-transition rule -- the literal point of section
// 15's "nenhuma posição é implicitamente marcada como única verdade pela
// engine."
describe('Eschatology taxonomy as data (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  const adminEmail = `eschatology-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Eschatology Admin Test' })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;
  });

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  async function createEschatologyPosition(
    code: string,
    topic: string,
    name: string,
  ): Promise<{ id: string; code: string }> {
    const created = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/theological-position-definitions')
      .set('Cookie', adminCookie)
      .send({ code, topic, name })
      .expect(201);
    expect(created.body.traditionId).toBeNull();
    return { id: created.body.id, code: created.body.code };
  }

  it('creates an eschatological position with no traditionId -- not owned by one denomination', async () => {
    await createEschatologyPosition(
      `TEST.ESCHATOLOGY.MILLENNIUM.AMIL.${Date.now()}`,
      'eschatology.millennium',
      'Amilenismo',
    );
  });

  it('supports four mutually-exclusive millennial views all PUBLISHED simultaneously, none privileged', async () => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2).toUpperCase()}`;
    const topic = `eschatology.millennium.test.${suffix}`;
    const positions = await Promise.all([
      createEschatologyPosition(`TEST.MILLENNIUM.HISTORIC_PREMIL.${suffix}`, topic, 'Pré-milenismo histórico'),
      createEschatologyPosition(`TEST.MILLENNIUM.DISPENSATIONAL_PREMIL.${suffix}`, topic, 'Pré-milenismo dispensacionalista'),
      createEschatologyPosition(`TEST.MILLENNIUM.AMIL.${suffix}`, topic, 'Amilenismo'),
      createEschatologyPosition(`TEST.MILLENNIUM.POSTMIL.${suffix}`, topic, 'Pós-milenismo'),
    ]);

    // Publish all four -- the whole point is that the engine (the DB
    // schema, the status-transition state machine, everything) has no
    // concept of "only one PUBLISHED position per topic." All four
    // competing views can be simultaneously live.
    for (const position of positions) {
      const published = await supertest(app.getHttpServer())
        .patch(`/api/v1/admin/curriculum-definitions/theological-position-definitions/${position.id}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'PUBLISHED' })
        .expect(200);
      expect(published.body.status).toBe('PUBLISHED');
    }

    const listed = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/theological-position-definitions')
      .set('Cookie', adminCookie)
      .expect(200);

    const publishedOnTopic = listed.body.filter(
      (row: { topic: string; status: string }) => row.topic === topic && row.status === 'PUBLISHED',
    );
    expect(publishedOnTopic).toHaveLength(4);
  });

  it('supports four mutually-exclusive Revelation interpretive schools, a second independent axis on the same topic-grouping mechanism', async () => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2).toUpperCase()}`;
    const topic = `eschatology.revelation_interpretation.test.${suffix}`;
    const schools = ['PRETERISM', 'HISTORICISM', 'FUTURISM', 'IDEALISM'];
    const created = await Promise.all(
      schools.map((school) =>
        createEschatologyPosition(`TEST.REVELATION_INTERPRETATION.${school}.${suffix}`, topic, school),
      ),
    );

    for (const position of created) {
      await supertest(app.getHttpServer())
        .patch(`/api/v1/admin/curriculum-definitions/theological-position-definitions/${position.id}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'PUBLISHED' })
        .expect(200);
    }

    const listed = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/theological-position-definitions')
      .set('Cookie', adminCookie)
      .expect(200);
    const publishedOnTopic = listed.body.filter(
      (row: { topic: string; status: string }) => row.topic === topic && row.status === 'PUBLISHED',
    );
    expect(publishedOnTopic).toHaveLength(4);
  });

  it('a family can mark a preferred eschatological position via the existing TheologicalProfile.topicOverrides -- no new endpoint needed', async () => {
    // A brand-new position, added purely as a data write (no deploy,
    // no code change) -- issue #96 section 15's "amilenismo pode ser
    // adicionado/removido sem alterar código" and section 14's
    // "posições podem ser adicionadas posteriormente" applied to a
    // brand-new topic axis.
    const position = await createEschatologyPosition(
      `TEST.FAMILY_PREF.AMIL.${Date.now()}`,
      'eschatology.millennium.family_pref_test',
      'Amilenismo',
    );
    await supertest(app.getHttpServer())
      .patch(`/api/v1/admin/curriculum-definitions/theological-position-definitions/${position.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    const email = `eschatology-family-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Eschatology Family Test' })
      .expect(201);
    const cookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;
    const familyResponse = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', cookie)
      .send({ name: 'Eschatology Family Pref Test', countryCode: 'BR' })
      .expect(201);
    const familyId = familyResponse.body.id;

    // The existing PUT .../theological-profile endpoint (built in Fase 1,
    // PR #113) already lets a family set a topic override to any position
    // code -- including one on a topic that didn't exist when that
    // endpoint was built. No new code was needed for this to work.
    const updated = await supertest(app.getHttpServer())
      .put(`/api/v1/families/${familyId}/curriculum/theological-profile`)
      .set('Cookie', cookie)
      .send({
        topicOverrides: {
          'eschatology.millennium.family_pref_test': position.code,
        },
      })
      .expect(200);
    expect(updated.body.topicOverrides['eschatology.millennium.family_pref_test']).toBe(position.code);
  });
});
