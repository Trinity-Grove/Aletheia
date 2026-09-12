import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { INestApplicationContext } from '@nestjs/common';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import { BibleTranslationDefinitionSeeder } from '../src/modules/curriculum/infrastructure/bible-translation-definition.seeder.js';
import { POPULAR_BIBLE_VERSIONS } from '../src/modules/devotional/infrastructure/youversion.service.js';

// Admin CRUD + strangler-fig equivalence proof for BibleTranslationDefinition
// (issue #96 Fase 3, section 16) against real Postgres.
describe('Bible translation definition (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  let outsiderCookie: string;
  let familyCookie: string;
  let familyId: string;
  const adminEmail = `bible-translation-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  async function registerAndGetCookie(emailPrefix: string): Promise<string> {
    const email = `${emailPrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Bible Translation Test' })
      .expect(201);
    return [response.headers['set-cookie']].flat().find((c) => c?.startsWith('aletheia_session='))!;
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Bible Translation Admin' })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    outsiderCookie = await registerAndGetCookie('bible-translation-outsider');

    familyCookie = await registerAndGetCookie('bible-translation-family');
    const familyResponse = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', familyCookie)
      .send({ name: 'Bible Translation Compare Family', countryCode: 'BR' })
      .expect(201);
    familyId = familyResponse.body.id;
  }, 30000);

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('rejects an unauthenticated request', async () => {
    await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/bible-translation-definitions')
      .expect(401);
  });

  it('rejects an authenticated non-admin user', async () => {
    await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/bible-translation-definitions')
      .set('Cookie', outsiderCookie)
      .expect(403);
  });

  it('creates, lists, and transitions a Bible translation definition end-to-end', async () => {
    const code = `TEST.${Date.now()}`;
    const created = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/bible-translation-definitions')
      .set('Cookie', adminCookie)
      .send({
        code,
        name: 'Test Translation',
        language: 'pt',
        youVersionId: '999999',
        translationPhilosophy: 'A_NEVER_BEFORE_SEEN_PHILOSOPHY',
        publisher: 'Test Publisher',
        licensingNotes: 'Direitos reservados para fins de teste.',
      })
      .expect(201);
    expect(created.body.status).toBe('DRAFT');
    expect(created.body.translationPhilosophy).toBe('A_NEVER_BEFORE_SEEN_PHILOSOPHY');

    await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/bible-translation-definitions')
      .set('Cookie', adminCookie)
      .send({ code, name: 'Duplicate', language: 'pt', youVersionId: '1' })
      .expect(400);

    const listed = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/bible-translation-definitions')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(listed.body.some((row: { id: string }) => row.id === created.body.id)).toBe(true);

    const statusUrl = `/api/v1/admin/curriculum-definitions/bible-translation-definitions/${created.body.id}/status`;
    const published = await supertest(app.getHttpServer())
      .patch(statusUrl)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);
    expect(published.body.publishedAt).not.toBeNull();

    // "Disponibilidade pode ser ativada/desativada" reuses the existing
    // lifecycle -- DEPRECATED is "deactivated," not a separate field.
    const deprecated = await supertest(app.getHttpServer())
      .patch(statusUrl)
      .set('Cookie', adminCookie)
      .send({ status: 'DEPRECATED' })
      .expect(200);
    expect(deprecated.body.status).toBe('DEPRECATED');
  });

  it('seeds the catalog from the exact same source the devotional module already uses, proving resolver equivalence', async () => {
    const seederAppContext: INestApplicationContext = await NestFactory.createApplicationContext(AppModule);
    let seededCount: number;
    try {
      const seeder = seederAppContext.get(BibleTranslationDefinitionSeeder);
      seededCount = await seeder.seed();
    } finally {
      await seederAppContext.close();
    }

    expect(seededCount).toBe(POPULAR_BIBLE_VERSIONS.length);

    const listed = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/bible-translation-definitions')
      .set('Cookie', adminCookie)
      .expect(200);

    for (const version of POPULAR_BIBLE_VERSIONS) {
      const code = version.abbreviation.toUpperCase();
      const seededRow = listed.body.find(
        (row: { code: string; version: number }) => row.code === code && row.version === 1,
      );
      expect(seededRow).toBeTruthy();
      expect(seededRow.status).toBe('PUBLISHED');
      expect(seededRow.name).toBe(version.name);
      expect(seededRow.language).toBe(version.language);
      expect(seededRow.youVersionId).toBe(version.id);
    }

    // Re-running the seeder is idempotent -- installs missing rows only,
    // never mutates an existing published version.
    const seederAppContext2: INestApplicationContext = await NestFactory.createApplicationContext(AppModule);
    try {
      const seeder2 = seederAppContext2.get(BibleTranslationDefinitionSeeder);
      const secondRunCount = await seeder2.seed();
      expect(secondRunCount).toBe(POPULAR_BIBLE_VERSIONS.length);
    } finally {
      await seederAppContext2.close();
    }
  }, 30000);

  it('compares a passage across multiple published translations, family-scoped and read-only', async () => {
    // Depends on the seeder test above having run and published the
    // catalog rows -- the compare endpoint resolves by code against
    // PUBLISHED BibleTranslationDefinition rows.
    const nvi = POPULAR_BIBLE_VERSIONS.find((v) => v.abbreviation === 'NVI')!;
    const ara = POPULAR_BIBLE_VERSIONS.find((v) => v.abbreviation === 'ARA')!;

    const response = await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/curriculum/bible-translations/compare`)
      .set('Cookie', familyCookie)
      .query({ reference: 'John 3:16', translationCodes: `${nvi.abbreviation},${ara.abbreviation}` })
      .expect(200);

    expect(response.body.reference).toBe('John 3:16');
    expect(response.body.results).toHaveLength(2);
    const codes = response.body.results.map((r: { translationCode: string }) => r.translationCode);
    expect(codes).toContain('NVI');
    expect(codes).toContain('ARA');
    // Real passage text is not asserted here -- no YOUVERSION_APP_KEY is
    // configured in this test environment, so YouVersionService returns
    // an empty content fallback (see youversion.service.ts). The point
    // of this test is the fan-out/resolution wiring, not the live API
    // response, which is exercised in youversion.service.spec.ts.
  });

  it('rejects a compare request for translation codes with no published match, 400 not 500', async () => {
    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/curriculum/bible-translations/compare`)
      .set('Cookie', familyCookie)
      .query({ reference: 'John 3:16', translationCodes: 'NOT_A_REAL_CODE' })
      .expect(400);
  });

  it('rejects a compare request from a family the caller does not belong to', async () => {
    const otherCookie = await registerAndGetCookie('bible-translation-other');
    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/curriculum/bible-translations/compare`)
      .set('Cookie', otherCookie)
      .query({ reference: 'John 3:16', translationCodes: 'NVI' })
      .expect(403);
  });

  it('rejects an unauthenticated compare request', async () => {
    await supertest(app.getHttpServer())
      .get(`/api/v1/families/${familyId}/curriculum/bible-translations/compare`)
      .query({ reference: 'John 3:16', translationCodes: 'NVI' })
      .expect(401);
  });
});
