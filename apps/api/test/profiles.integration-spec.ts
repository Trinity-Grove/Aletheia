import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';

// Family-scoped pedagogical/theological profile CRUD (issue #96 Fase 1,
// sections 13/14) against real Postgres, with real family membership
// (not mocked) -- proves FamilyTenantGuard actually isolates one
// family's profile from another's, not just that the guard pair is
// present on the route.
describe('Pedagogical & Theological Profiles (real Postgres)', () => {
  let app: NestFastifyApplication;
  let familyACookie: string;
  let familyAId: string;
  let familyBCookie: string;
  let familyBId: string;
  let prisma: PrismaService;
  const suffix = Date.now().toString();
  const traditionCode = `PROFILE.TRADITION.${suffix}`;
  const positionCode = `PROFILE.POSITION.${suffix}`;

  async function registerWithFamily(prefix: string): Promise<{ cookie: string; familyId: string }> {
    const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Profiles Test Guardian', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true })
      .expect(201);
    const cookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    const familyResponse = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', cookie)
      .send({ name: `${prefix} Family`, countryCode: 'BR' })
      .expect(201);

    return { cookie, familyId: familyResponse.body.id };
  }

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);
    // Published catalog fixtures are real data; profiles must not accept invented references.
    for (const code of ['CLASSICAL_TRIVIUM', 'CHARLOTTE_MASON', 'MONTESSORI']) {
      await prisma.pedagogicalModelDefinition.upsert({
        where: { code_version: { code, version: 1 } },
        create: { code, name: code, status: 'PUBLISHED' },
        update: { status: 'PUBLISHED' },
      });
    }
    const tradition = await prisma.theologicalTraditionDefinition.create({
      data: { code: traditionCode, name: 'Profile tradition', status: 'PUBLISHED' },
    });
    await prisma.theologicalPositionDefinition.create({
      data: { code: positionCode, name: 'Profile position', traditionId: tradition.id, topic: 'eschatology', status: 'PUBLISHED' },
    });

    const familyA = await registerWithFamily('profiles-family-a');
    familyACookie = familyA.cookie;
    familyAId = familyA.familyId;

    const familyB = await registerWithFamily('profiles-family-b');
    familyBCookie = familyB.cookie;
    familyBId = familyB.familyId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Pedagogical Profile', () => {
    it('returns null when no profile has been created yet', async () => {
      const res = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/curriculum/pedagogical-profile`)
        .set('Cookie', familyACookie)
        .expect(200);
      expect(res.body).toBeNull();
    });

    it('creates version 1 on first upsert, and version 2 on the next -- never mutating version 1', async () => {
      const v1 = await supertest(app.getHttpServer())
        .put(`/api/v1/families/${familyAId}/curriculum/pedagogical-profile`)
        .set('Cookie', familyACookie)
        .send({ primaryModelCode: 'CLASSICAL_TRIVIUM' })
        .expect(200);
      expect(v1.body.version).toBe(1);
      expect(v1.body.primaryModelCode).toBe('CLASSICAL_TRIVIUM');

      const v2 = await supertest(app.getHttpServer())
        .put(`/api/v1/families/${familyAId}/curriculum/pedagogical-profile`)
        .set('Cookie', familyACookie)
        .send({
          primaryModelCode: 'CHARLOTTE_MASON',
          secondaryModels: [{ code: 'MONTESSORI', weight: 0.2 }],
          overrides: { structureLevel: 'FLEXIBLE' },
        })
        .expect(200);
      expect(v2.body.version).toBe(2);
      expect(v2.body.primaryModelCode).toBe('CHARLOTTE_MASON');

      const current = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/curriculum/pedagogical-profile`)
        .set('Cookie', familyACookie)
        .expect(200);
      expect(current.body.version).toBe(2);
      expect(current.body.primaryModelCode).toBe('CHARLOTTE_MASON');

      const history = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/curriculum/pedagogical-profile/history`)
        .set('Cookie', familyACookie)
        .expect(200);
      expect(history.body).toHaveLength(2);
      expect(history.body[0].version).toBe(2);
      expect(history.body[1].version).toBe(1);
      // Version 1's original content is intact -- never mutated.
      expect(history.body[1].primaryModelCode).toBe('CLASSICAL_TRIVIUM');
    });

    it('rejects a malformed upsert (invalid code, out-of-range weight) with 400', async () => {
      await supertest(app.getHttpServer())
        .put(`/api/v1/families/${familyAId}/curriculum/pedagogical-profile`)
        .set('Cookie', familyACookie)
        .send({ primaryModelCode: 'lowercase-not-allowed' })
        .expect(400);

      await supertest(app.getHttpServer())
        .put(`/api/v1/families/${familyAId}/curriculum/pedagogical-profile`)
        .set('Cookie', familyACookie)
        .send({ primaryModelCode: 'MONTESSORI', secondaryModels: [{ code: 'ECLECTIC', weight: 2 }] })
        .expect(400);
    });

    it('tenant isolation: family B cannot read or write family A pedagogical profile', async () => {
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/curriculum/pedagogical-profile`)
        .set('Cookie', familyBCookie)
        .expect(403);

      await supertest(app.getHttpServer())
        .put(`/api/v1/families/${familyAId}/curriculum/pedagogical-profile`)
        .set('Cookie', familyBCookie)
        .send({ primaryModelCode: 'ECLECTIC' })
        .expect(403);

      // Family B's own (nonexistent) profile is unaffected/independent.
      const ownProfile = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/curriculum/pedagogical-profile`)
        .set('Cookie', familyBCookie)
        .expect(200);
      expect(ownProfile.body).toBeNull();
    });

    it('rejects an unauthenticated request', async () => {
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/curriculum/pedagogical-profile`)
        .expect(401);
    });
  });

  describe('Theological Profile', () => {
    it('returns null when no profile has been created yet', async () => {
      const res = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/curriculum/theological-profile`)
        .set('Cookie', familyACookie)
        .expect(200);
      expect(res.body).toBeNull();
    });

    it('creates and versions a theological profile with topic overrides', async () => {
      const v1 = await supertest(app.getHttpServer())
        .put(`/api/v1/families/${familyAId}/curriculum/theological-profile`)
        .set('Cookie', familyACookie)
        .send({ preferredTraditionCode: traditionCode })
        .expect(200);
      expect(v1.body.version).toBe(1);

      const v2 = await supertest(app.getHttpServer())
        .put(`/api/v1/families/${familyAId}/curriculum/theological-profile`)
        .set('Cookie', familyACookie)
        .send({
          preferredTraditionCode: traditionCode,
          topicOverrides: { eschatology: positionCode },
        })
        .expect(200);
      expect(v2.body.version).toBe(2);
      expect(v2.body.topicOverrides.eschatology).toBe(positionCode);

      const history = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/curriculum/theological-profile/history`)
        .set('Cookie', familyACookie)
        .expect(200);
      expect(history.body).toHaveLength(2);
    });

    it('tenant isolation: family B cannot read or write family A theological profile', async () => {
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/curriculum/theological-profile`)
        .set('Cookie', familyBCookie)
        .expect(403);

      await supertest(app.getHttpServer())
        .put(`/api/v1/families/${familyAId}/curriculum/theological-profile`)
        .set('Cookie', familyBCookie)
        .send({ preferredTraditionCode: 'REFORMED' })
        .expect(403);
    });

    it('rejects an unauthenticated request', async () => {
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/curriculum/theological-profile`)
        .expect(401);
    });
  });

  describe('Catalog reference integrity', () => {
    it('rejects missing and unpublished models without appending history', async () => {
      const draftCode = `PROFILE.DRAFT.${suffix}`;
      await prisma.pedagogicalModelDefinition.create({ data: { code: draftCode, name: 'Draft' } });
      for (const payload of [
        { primaryModelCode: 'MISSING.MODEL' },
        { primaryModelCode: draftCode },
        { primaryModelCode: 'MONTESSORI', secondaryModels: [{ code: 'MISSING.SECONDARY', weight: 0.5 }] },
      ]) {
        await supertest(app.getHttpServer()).put(`/api/v1/families/${familyBId}/curriculum/pedagogical-profile`)
          .set('Cookie', familyBCookie).send(payload).expect(400);
      }
      expect(await prisma.pedagogicalProfile.count({ where: { familyId: familyBId } })).toBe(0);
    });

    it('rejects missing traditions and wrong-topic or missing positions', async () => {
      for (const payload of [
        { preferredTraditionCode: 'MISSING.TRADITION' },
        { topicOverrides: { eschatology: 'MISSING.POSITION' } },
        { topicOverrides: { soteriology: positionCode } },
      ]) {
        await supertest(app.getHttpServer()).put(`/api/v1/families/${familyBId}/curriculum/theological-profile`)
          .set('Cookie', familyBCookie).send(payload).expect(400);
      }
      expect(await prisma.theologicalProfile.count({ where: { familyId: familyBId } })).toBe(0);
    });

    it('allows a published position from another tradition and preserves it after deprecation', async () => {
      const other = await prisma.theologicalTraditionDefinition.create({
        data: { code: `PROFILE.OTHER.${suffix}`, name: 'Other', status: 'PUBLISHED' },
      });
      await supertest(app.getHttpServer()).put(`/api/v1/families/${familyBId}/curriculum/theological-profile`)
        .set('Cookie', familyBCookie).send({ preferredTraditionCode: other.code, topicOverrides: { eschatology: positionCode } }).expect(200);
      await prisma.theologicalPositionDefinition.updateMany({ where: { code: positionCode }, data: { status: 'DEPRECATED' } });
      const current = await supertest(app.getHttpServer()).get(`/api/v1/families/${familyBId}/curriculum/theological-profile`)
        .set('Cookie', familyBCookie).expect(200);
      expect(current.body.topicOverrides).toEqual({ eschatology: positionCode });
      await supertest(app.getHttpServer()).put(`/api/v1/families/${familyBId}/curriculum/theological-profile`)
        .set('Cookie', familyBCookie).send({ topicOverrides: { eschatology: positionCode } }).expect(400);
    });
  });

  describe('Attributable concurrent history', () => {
    it.each(['pedagogical-profile', 'theological-profile'])('records the authenticated actor for %s and ignores spoofed attribution', async (kind) => {
      const family = await registerWithFamily(`actor-${kind}`);
      const member = await prisma.familyMember.findFirstOrThrow({ where: { familyId: family.familyId } });
      const payload = kind === 'pedagogical-profile' ? { primaryModelCode: 'MONTESSORI' } : {};
      const result = await supertest(app.getHttpServer()).put(`/api/v1/families/${family.familyId}/curriculum/${kind}`)
        .set('Cookie', family.cookie).send({ ...payload, createdByUserId: '00000000-0000-4000-8000-000000000001' }).expect(200);
      expect(result.body.createdByUserId).toBe(member.userId);
      const history = await supertest(app.getHttpServer()).get(`/api/v1/families/${family.familyId}/curriculum/${kind}/history`)
        .set('Cookie', family.cookie).expect(200);
      expect(history.body[0].createdByUserId).toBe(member.userId);
    });

    it.each(['pedagogical-profile', 'theological-profile'])('preserves all simultaneous %s writes as consecutive versions', async (kind) => {
      const family = await registerWithFamily(`concurrent-${kind}`);
      const responses = await Promise.all(Array.from({ length: 6 }, (_, index) => {
        const payload = kind === 'pedagogical-profile'
          ? { primaryModelCode: 'MONTESSORI', overrides: { request: index } }
          : { preferredTraditionCode: index % 2 === 0 ? traditionCode : null };
        return supertest(app.getHttpServer()).put(`/api/v1/families/${family.familyId}/curriculum/${kind}`)
          .set('Cookie', family.cookie).send(payload);
      }));
      expect(responses.map((response) => response.status)).toEqual([200, 200, 200, 200, 200, 200]);
      expect(responses.map((response) => response.body.version).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
      const history = await supertest(app.getHttpServer()).get(`/api/v1/families/${family.familyId}/curriculum/${kind}/history`)
        .set('Cookie', family.cookie).expect(200);
      expect(history.body.map((row: { version: number }) => row.version)).toEqual([6, 5, 4, 3, 2, 1]);
      expect(new Set(history.body.map((row: { id: string }) => row.id)).size).toBe(6);
      if (kind === 'pedagogical-profile') {
        expect(history.body.map((row: { overrides: { request: number } }) => row.overrides.request).sort()).toEqual([0, 1, 2, 3, 4, 5]);
      }
    });

    it('keeps legacy profile rows readable without inventing an actor', async () => {
      const family = await registerWithFamily('legacy-history');
      await prisma.pedagogicalProfile.create({ data: { familyId: family.familyId, primaryModelCode: 'LEGACY.RETIRED' } });
      await prisma.theologicalProfile.create({ data: { familyId: family.familyId, preferredTraditionCode: 'LEGACY.RETIRED' } });
      for (const kind of ['pedagogical-profile', 'theological-profile']) {
        const result = await supertest(app.getHttpServer()).get(`/api/v1/families/${family.familyId}/curriculum/${kind}`)
          .set('Cookie', family.cookie).expect(200);
        expect(result.body.createdByUserId).toBeNull();
      }
    });
  });
});
