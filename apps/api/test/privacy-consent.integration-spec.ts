import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';

describe('Privacy & Versioned Consent Integration (real Postgres)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  let adminCookie: string;
  let guardianACookie: string;
  let guardianBCookie: string;

  let guardianAUserId: string;
  let guardianBUserId: string;

  let familyAId: string;
  let familyBId: string;

  let learnerA1Id: string;
  let learnerA2Id: string;
  let learnerB1Id: string;

  let tosV1Id: string;
  let aiV1Id: string;
  let tosV2Id: string;

  const previousAdmins = process.env.PLATFORM_ADMIN_EMAILS;
  const adminEmail = `privacy-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const guardianAEmail = `guardian-a-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const guardianBEmail = `guardian-b-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  function extractCookie(response: { headers: Record<string, unknown> }, prefix: string): string {
    const cookie = [response.headers['set-cookie']].flat().find((c) => (c as string)?.startsWith(prefix));
    if (!cookie) throw new Error(`Expected a ${prefix} cookie in the response.`);
    return cookie as string;
  }

  async function cleanupConsentTestData(): Promise<void> {
    await prisma.consentRecord.deleteMany({
      where: {
        consentDefinition: {
          code: { in: ['TERMS_OF_SERVICE', 'AI_TUTOR_SHARING'] },
        },
      },
    });
    await prisma.consentDefinition.deleteMany({
      where: {
        code: { in: ['TERMS_OF_SERVICE', 'AI_TUTOR_SHARING'] },
      },
    });
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
    await cleanupConsentTestData();

    // 1. Register Platform Admin
    const adminRes = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'StrongPassword123!', fullName: 'Platform Admin' })
      .expect(201);
    adminCookie = extractCookie(adminRes, 'aletheia_session=');

    // 2. Register Guardian A (Family A)
    const guardianARes = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: guardianAEmail, password: 'StrongPassword123!', fullName: 'Guardian Alpha' })
      .expect(201);
    guardianACookie = extractCookie(guardianARes, 'aletheia_session=');
    guardianAUserId = guardianARes.body.user.id;

    // 3. Register Guardian B (Family B)
    const guardianBRes = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: guardianBEmail, password: 'StrongPassword123!', fullName: 'Guardian Beta' })
      .expect(201);
    guardianBCookie = extractCookie(guardianBRes, 'aletheia_session=');
    guardianBUserId = guardianBRes.body.user.id;

    // 4. Create Family A & 2 Learners (Learner A1, Learner A2)
    const familyARes = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', guardianACookie)
      .send({ name: 'Family Alpha', countryCode: 'US' })
      .expect(201);
    familyAId = familyARes.body.id;

    const learnerA1Res = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/learners`)
      .set('Cookie', guardianACookie)
      .send({ firstName: 'Alice', lastName: 'Alpha', birthDate: '2016-01-01', stage: 'PRIMARY_GRAMMAR' })
      .expect(201);
    learnerA1Id = learnerA1Res.body.id;

    const learnerA2Res = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyAId}/learners`)
      .set('Cookie', guardianACookie)
      .send({ firstName: 'Arthur', lastName: 'Alpha', birthDate: '2014-01-01', stage: 'MIDDLE_LOGIC' })
      .expect(201);
    learnerA2Id = learnerA2Res.body.id;

    // 5. Create Family B & 1 Learner (Learner B1)
    const familyBRes = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', guardianBCookie)
      .send({ name: 'Family Beta', countryCode: 'BR' })
      .expect(201);
    familyBId = familyBRes.body.id;

    const learnerB1Res = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyBId}/learners`)
      .set('Cookie', guardianBCookie)
      .send({ firstName: 'Bob', lastName: 'Beta', birthDate: '2015-05-05', stage: 'PRIMARY_GRAMMAR' })
      .expect(201);
    learnerB1Id = learnerB1Res.body.id;
  }, 60000);

  afterAll(async () => {
    try {
      await cleanupConsentTestData();
    } finally {
      await app.close();
      if (previousAdmins !== undefined) {
        process.env.PLATFORM_ADMIN_EMAILS = previousAdmins;
      } else {
        delete process.env.PLATFORM_ADMIN_EMAILS;
      }
    }
  });

  describe('1. Admin Catalog & Public Endpoints', () => {
    it('creates and publishes TERMS_OF_SERVICE (version 1, mandatory: true, scope: FAMILY)', async () => {
      const createRes = await supertest(app.getHttpServer())
        .post('/api/v1/admin/consent-definitions')
        .set('Cookie', adminCookie)
        .send({
          code: 'TERMS_OF_SERVICE',
          version: 1,
          scope: 'FAMILY',
          mandatory: true,
          title: 'Platform Terms of Service',
          description: 'Terms governing use of the Aletheia platform',
          content: 'These are the official terms of service for using Aletheia.',
          purposes: ['Platform access', 'Account management'],
        })
        .expect(201);

      tosV1Id = createRes.body.id;
      expect(createRes.body.code).toBe('TERMS_OF_SERVICE');
      expect(createRes.body.version).toBe(1);
      expect(createRes.body.status).toBe('DRAFT');
      expect(createRes.body.mandatory).toBe(true);
      expect(createRes.body.scope).toBe('FAMILY');

      const publishRes = await supertest(app.getHttpServer())
        .patch(`/api/v1/admin/consent-definitions/${tosV1Id}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'PUBLISHED' })
        .expect(200);

      expect(publishRes.body.status).toBe('PUBLISHED');
      expect(publishRes.body.publishedAt).not.toBeNull();
    });

    it('creates and publishes AI_TUTOR_SHARING (version 1, mandatory: false, scope: LEARNER)', async () => {
      const createRes = await supertest(app.getHttpServer())
        .post('/api/v1/admin/consent-definitions')
        .set('Cookie', adminCookie)
        .send({
          code: 'AI_TUTOR_SHARING',
          version: 1,
          scope: 'LEARNER',
          mandatory: false,
          title: 'AI Tutor Data Sharing',
          description: 'Consent for AI tutor pedagogical adaptation',
          content: 'Permit sharing learner interactions with AI pedagogical engine.',
          purposes: ['Personalized tutoring', 'Progress assessment'],
        })
        .expect(201);

      aiV1Id = createRes.body.id;
      expect(createRes.body.code).toBe('AI_TUTOR_SHARING');
      expect(createRes.body.version).toBe(1);
      expect(createRes.body.status).toBe('DRAFT');
      expect(createRes.body.mandatory).toBe(false);
      expect(createRes.body.scope).toBe('LEARNER');

      const publishRes = await supertest(app.getHttpServer())
        .patch(`/api/v1/admin/consent-definitions/${aiV1Id}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'PUBLISHED' })
        .expect(200);

      expect(publishRes.body.status).toBe('PUBLISHED');
      expect(publishRes.body.publishedAt).not.toBeNull();
    });

    it('public endpoint GET /api/v1/consent-definitions/published returns both definitions, filter ?scope=FAMILY returns only TERMS_OF_SERVICE', async () => {
      const allRes = await supertest(app.getHttpServer())
        .get('/api/v1/consent-definitions/published')
        .expect(200);

      expect(Array.isArray(allRes.body)).toBe(true);
      const allCodes = allRes.body.map((d: any) => d.code);
      expect(allCodes).toContain('TERMS_OF_SERVICE');
      expect(allCodes).toContain('AI_TUTOR_SHARING');

      const familyOnlyRes = await supertest(app.getHttpServer())
        .get('/api/v1/consent-definitions/published')
        .query({ scope: 'FAMILY' })
        .expect(200);

      expect(Array.isArray(familyOnlyRes.body)).toBe(true);
      const familyCodes = familyOnlyRes.body.map((d: any) => d.code);
      expect(familyCodes).toContain('TERMS_OF_SERVICE');
      expect(familyCodes).not.toContain('AI_TUTOR_SHARING');

      for (const def of familyOnlyRes.body) {
        expect(def.scope).toBe('FAMILY');
      }
    });
  });

  describe('2. Grant Flow & Audit Metadata Persistence', () => {
    it('grants TERMS_OF_SERVICE for Family A with custom User-Agent and AI_TUTOR_SHARING for Learner A1, persisting audit metadata', async () => {
      // Guardian A grants TERMS_OF_SERVICE for Family A with custom User-Agent
      const grantTosRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/consents/grant`)
        .set('Cookie', guardianACookie)
        .set('User-Agent', 'IntegrationTestAgent/1.0')
        .send({ consentDefinitionId: tosV1Id })
        .expect(201);

      expect(grantTosRes.body.action).toBe('GRANTED');
      expect(grantTosRes.body.consentedByUserId).toBe(guardianAUserId);
      expect(grantTosRes.body.consentDefinitionId).toBe(tosV1Id);
      expect(grantTosRes.body.learnerId).toBeNull();
      expect(grantTosRes.body.userAgent).toBe('IntegrationTestAgent/1.0');

      // Guardian A grants AI_TUTOR_SHARING for Learner A1
      const grantAiRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/consents/grant`)
        .set('Cookie', guardianACookie)
        .set('User-Agent', 'IntegrationTestAgent/1.0')
        .send({ consentDefinitionId: aiV1Id, learnerId: learnerA1Id })
        .expect(201);

      expect(grantAiRes.body.action).toBe('GRANTED');
      expect(grantAiRes.body.consentedByUserId).toBe(guardianAUserId);
      expect(grantAiRes.body.consentDefinitionId).toBe(aiV1Id);
      expect(grantAiRes.body.learnerId).toBe(learnerA1Id);

      // Directly query Prisma and assert audit fields
      const records = await prisma.consentRecord.findMany({
        where: { familyId: familyAId },
      });

      const tosRecord = records.find((r) => r.consentDefinitionId === tosV1Id && r.learnerId === null);
      expect(tosRecord).toBeDefined();
      expect(tosRecord!.action).toBe('GRANTED');
      expect(tosRecord!.consentedByUserId).toBe(guardianAUserId);
      expect(tosRecord!.userAgent).toBe('IntegrationTestAgent/1.0');
      expect(tosRecord!.ipAddress).toBeTruthy();
      expect(tosRecord!.createdAt).toBeInstanceOf(Date);
      expect(isNaN(tosRecord!.createdAt.getTime())).toBe(false);

      const aiRecord = records.find((r) => r.consentDefinitionId === aiV1Id && r.learnerId === learnerA1Id);
      expect(aiRecord).toBeDefined();
      expect(aiRecord!.action).toBe('GRANTED');
      expect(aiRecord!.consentedByUserId).toBe(guardianAUserId);
      expect(aiRecord!.userAgent).toBe('IntegrationTestAgent/1.0');
      expect(aiRecord!.ipAddress).toBeTruthy();
      expect(aiRecord!.createdAt).toBeInstanceOf(Date);
      expect(isNaN(aiRecord!.createdAt.getTime())).toBe(false);
    });
  });

  describe('3. Immutability & Revocation', () => {
    it('revokes and re-grants AI_TUTOR_SHARING for Learner A1, verifying 3 chronological immutable records and overview status', async () => {
      // Guardian A revokes AI_TUTOR_SHARING for Learner A1
      const revokeRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/consents/revoke`)
        .set('Cookie', guardianACookie)
        .send({ consentDefinitionId: aiV1Id, learnerId: learnerA1Id })
        .expect(201);

      expect(revokeRes.body.action).toBe('REVOKED');
      expect(revokeRes.body.learnerId).toBe(learnerA1Id);

      // Guardian A re-grants AI_TUTOR_SHARING for Learner A1
      const reGrantRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/consents/grant`)
        .set('Cookie', guardianACookie)
        .send({ consentDefinitionId: aiV1Id, learnerId: learnerA1Id })
        .expect(201);

      expect(reGrantRes.body.action).toBe('GRANTED');
      expect(reGrantRes.body.learnerId).toBe(learnerA1Id);

      // Directly query Prisma: exactly 3 chronological records exist for this (familyId, definitionId, learnerA1Id) tuple
      const records = await prisma.consentRecord.findMany({
        where: {
          familyId: familyAId,
          consentDefinitionId: aiV1Id,
          learnerId: learnerA1Id,
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(records).toHaveLength(3);
      expect(records[0]!.action).toBe('GRANTED');
      expect(records[1]!.action).toBe('REVOKED');
      expect(records[2]!.action).toBe('GRANTED');

      // None were overwritten or deleted: all 3 IDs are unique
      const ids = new Set(records.map((r) => r.id));
      expect(ids.size).toBe(3);

      for (const record of records) {
        expect(record.consentedByUserId).toBe(guardianAUserId);
        expect(record.createdAt).toBeInstanceOf(Date);
      }
      expect(records[0]!.createdAt.getTime()).toBeLessThanOrEqual(records[1]!.createdAt.getTime());
      expect(records[1]!.createdAt.getTime()).toBeLessThanOrEqual(records[2]!.createdAt.getTime());

      // Overview GET /api/v1/families/:familyId/consents returns ACTIVE for Learner A1 and PENDING for Learner A2
      const overviewRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/consents`)
        .set('Cookie', guardianACookie)
        .expect(200);

      expect(overviewRes.body.familyId).toBe(familyAId);
      const aiTerm = overviewRes.body.terms.find((t: any) => t.definition.code === 'AI_TUTOR_SHARING');
      expect(aiTerm).toBeDefined();
      expect(aiTerm.learnerStatuses).toBeDefined();

      const a1Status = aiTerm.learnerStatuses.find((s: any) => s.learnerId === learnerA1Id);
      expect(a1Status).toBeDefined();
      expect(a1Status.status).toBe('ACTIVE');

      const a2Status = aiTerm.learnerStatuses.find((s: any) => s.learnerId === learnerA2Id);
      expect(a2Status).toBeDefined();
      expect(a2Status.status).toBe('PENDING');
    });
  });

  describe('4. Mandatory Revocation Prevention', () => {
    it('prevents revocation of mandatory TERMS_OF_SERVICE and returns 400 Bad Request', async () => {
      const revokeRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/consents/revoke`)
        .set('Cookie', guardianACookie)
        .send({ consentDefinitionId: tosV1Id })
        .expect(400);

      expect(revokeRes.body.message).toMatch(/mandatory.*cannot be revoked/i);
    });
  });

  describe('5. Strict Multi-Tenant Security Boundary', () => {
    it('denies Guardian A access to Family B consent endpoints (HTTP 403 Forbidden)', async () => {
      // Guardian A attempts POST /api/v1/families/:familyBId/consents/grant -> Expects HTTP 403 Forbidden
      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyBId}/consents/grant`)
        .set('Cookie', guardianACookie)
        .send({ consentDefinitionId: tosV1Id })
        .expect(403);

      // Guardian A attempts GET /api/v1/families/:familyBId/consents -> Expects HTTP 403 Forbidden
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/consents`)
        .set('Cookie', guardianACookie)
        .expect(403);
    });

    it('denies Guardian A operating on Learner B1 (child of Family B) within Family A (HTTP 400 Bad Request)', async () => {
      // Guardian A attempts to grant consent in Family A passing learnerBId -> Expects HTTP 400 Bad Request
      const grantAlienRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/consents/grant`)
        .set('Cookie', guardianACookie)
        .send({ consentDefinitionId: aiV1Id, learnerId: learnerB1Id })
        .expect(400);

      expect(grantAlienRes.body.message).toBe('Learner does not belong to this family.');

      // Guardian A attempts to check compliance in Family A passing learnerBId -> Expects HTTP 400 Bad Request
      const complianceAlienRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/consents/compliance`)
        .query({ learnerId: learnerB1Id })
        .set('Cookie', guardianACookie)
        .expect(400);

      expect(complianceAlienRes.body.message).toBe('Learner does not belong to this family.');
    });
  });

  describe('6. Compliance Check & Version Upgrade', () => {
    it('verifies compliance check, version upgrade detection (OUTDATED), and re-grant compliance', async () => {
      // GET /api/v1/families/:familyAId/consents/compliance returns compliant: true and pendingMandatoryTerms: []
      const initialCompliance = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/consents/compliance`)
        .set('Cookie', guardianACookie)
        .expect(200);

      expect(initialCompliance.body.compliant).toBe(true);
      expect(initialCompliance.body.pendingMandatoryTerms).toHaveLength(0);

      // Admin creates and publishes v2 of TERMS_OF_SERVICE
      const createTosV2Res = await supertest(app.getHttpServer())
        .post('/api/v1/admin/consent-definitions')
        .set('Cookie', adminCookie)
        .send({
          code: 'TERMS_OF_SERVICE',
          version: 2,
          scope: 'FAMILY',
          mandatory: true,
          title: 'Platform Terms of Service v2',
          description: 'Updated terms of service for new privacy standards',
          content: 'These are the updated terms of service v2 for using Aletheia.',
          purposes: ['Platform access', 'Account management', 'Legal compliance'],
        })
        .expect(201);

      tosV2Id = createTosV2Res.body.id;
      expect(createTosV2Res.body.code).toBe('TERMS_OF_SERVICE');
      expect(createTosV2Res.body.version).toBe(2);

      await supertest(app.getHttpServer())
        .patch(`/api/v1/admin/consent-definitions/${tosV2Id}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'PUBLISHED' })
        .expect(200);

      // GET /api/v1/families/:familyAId/consents/compliance now returns compliant: false with v2 in pendingMandatoryTerms
      const outdatedCompliance = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/consents/compliance`)
        .set('Cookie', guardianACookie)
        .expect(200);

      expect(outdatedCompliance.body.compliant).toBe(false);
      expect(outdatedCompliance.body.pendingMandatoryTerms).toHaveLength(1);
      expect(outdatedCompliance.body.pendingMandatoryTerms[0]!.id).toBe(tosV2Id);
      expect(outdatedCompliance.body.pendingMandatoryTerms[0]!.code).toBe('TERMS_OF_SERVICE');
      expect(outdatedCompliance.body.pendingMandatoryTerms[0]!.version).toBe(2);

      // GET /api/v1/families/:familyAId/consents overview shows status OUTDATED for TERMS_OF_SERVICE
      const overviewRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/consents`)
        .set('Cookie', guardianACookie)
        .expect(200);

      const tosTerm = overviewRes.body.terms.find(
        (t: any) => t.definition.code === 'TERMS_OF_SERVICE' && t.definition.version === 2,
      );
      expect(tosTerm).toBeDefined();
      expect(tosTerm!.status).toBe('OUTDATED');
      expect(tosTerm!.familyStatus).toBe('OUTDATED');
      expect(tosTerm!.lastRecord).toBeDefined();
      expect(tosTerm!.lastRecord!.consentDefinitionId).toBe(tosV1Id);

      // Guardian A grants v2
      const grantV2Res = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/consents/grant`)
        .set('Cookie', guardianACookie)
        .send({ consentDefinitionId: tosV2Id })
        .expect(201);

      expect(grantV2Res.body.action).toBe('GRANTED');
      expect(grantV2Res.body.consentDefinitionId).toBe(tosV2Id);

      // GET /api/v1/families/:familyAId/consents/compliance returns compliant: true
      const finalCompliance = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/consents/compliance`)
        .set('Cookie', guardianACookie)
        .expect(200);

      expect(finalCompliance.body.compliant).toBe(true);
      expect(finalCompliance.body.pendingMandatoryTerms).toHaveLength(0);
    });
  });
});
