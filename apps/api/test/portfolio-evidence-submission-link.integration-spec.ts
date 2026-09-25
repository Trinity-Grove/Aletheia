import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Real-Postgres coverage for issue #230: promoting a validated
// EvidenceSubmission (the ActivityDefinition/ProjectDefinition-catalog
// evidence system) into a PortfolioItem (the older Subject/LearningRecord
// -facing portfolio) -- the fix for those two systems having been
// completely disconnected (found auditing issue #95 section 31).
//
// The reports module's PDF/dossier renderer reads PortfolioItem rows
// directly via a plain `prisma.portfolioItem.findMany` (verified by
// reading report.service.ts, not re-asserted here) -- so once this test
// proves a promoted evidence submission is a real row in that table,
// "aparece no portfólio exportável" already holds without re-running the
// PDF renderer itself.
describe('Portfolio <- EvidenceSubmission promotion (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  let familyACookie: string;
  let familyAId: string;
  let familyALearnerId: string;
  let familyBCookie: string;
  let evidenceTypeId: string;
  const adminEmail = `portfolio-link-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const portfolioBase = (familyId: string) => `/api/v1/families/${familyId}/portfolio`;
  const evidenceBase = (familyId: string) => `/api/v1/families/${familyId}/curriculum/evidence-submissions`;

  async function registerWithFamilyAndLearner(
    prefix: string,
  ): Promise<{ cookie: string; familyId: string; learnerId: string }> {
    const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const registerResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Portfolio Link Test Guardian' })
      .expect(201);
    const cookie = [registerResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    const familyResponse = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', cookie)
      .send({ name: `${prefix} Family`, countryCode: 'BR' })
      .expect(201);
    const familyId = familyResponse.body.id;

    const learnerResponse = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', cookie)
      .send({ firstName: 'Test', lastName: 'Learner', birthDate: '2015-01-01', stage: 'PRIMARY_GRAMMAR' })
      .expect(201);

    return { cookie, familyId, learnerId: learnerResponse.body.id };
  }

  async function createEvidenceSubmission(cookie: string, familyId: string, learnerId: string) {
    const competencyDomain = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.PORTFOLIO.LINK.DOMAIN.${Date.now()}.${Math.random().toString(36).slice(2).toUpperCase()}`, name: 'Portfolio Link Test Domain' })
      .expect(201);
    const competency = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/competency-definitions')
      .set('Cookie', adminCookie)
      .send({
        code: `TEST.PORTFOLIO.LINK.COMPETENCY.${Date.now()}.${Math.random().toString(36).slice(2).toUpperCase()}`,
        domainId: competencyDomain.body.id,
        title: 'Portfolio Link Test Competency',
      })
      .expect(201);

    const submission = await supertest(app.getHttpServer())
      .post(evidenceBase(familyId))
      .set('Cookie', cookie)
      .send({
        learnerId,
        evidenceTypeId,
        competencies: [{ competencyDefinitionId: competency.body.id }],
        textContent: 'Fotos do canteiro pronto para o plantio.',
        fileUrl: 'https://storage.example.com/evidence/garden.jpg',
      })
      .expect(201);
    return submission.body;
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Portfolio Link Test Admin' })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;

    const evidenceType = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-definitions/evidence-type-definitions')
      .set('Cookie', adminCookie)
      .send({ code: `TEST.PORTFOLIO.LINK.EVIDENCETYPE.${Date.now()}`, name: 'Test Portfolio Evidence Type' })
      .expect(201);
    evidenceTypeId = evidenceType.body.id;

    const familyA = await registerWithFamilyAndLearner('portfolio-link-family-a');
    familyACookie = familyA.cookie;
    familyAId = familyA.familyId;
    familyALearnerId = familyA.learnerId;

    const familyB = await registerWithFamilyAndLearner('portfolio-link-family-b');
    familyBCookie = familyB.cookie;
  });

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('promotes a validated evidence submission into a real portfolio item, copying its content and mapping its type', async () => {
    const submission = await createEvidenceSubmission(familyACookie, familyAId, familyALearnerId);

    await supertest(app.getHttpServer())
      .patch(`${evidenceBase(familyAId)}/${submission.id}/validation`)
      .set('Cookie', familyACookie)
      .send({ status: 'VALIDATED' })
      .expect(200);

    const promoted = await supertest(app.getHttpServer())
      .post(`${portfolioBase(familyAId)}/from-evidence-submission/${submission.id}`)
      .set('Cookie', familyACookie)
      .send({ title: 'Horta comunitária', tags: ['horta', 'catálogo'] })
      .expect(201);

    expect(promoted.body.evidenceSubmissionId).toBe(submission.id);
    expect(promoted.body.learnerId).toBe(familyALearnerId);
    expect(promoted.body.title).toBe('Horta comunitária');
    // The evidence type's code here doesn't match any of the 9 seeded
    // base codes the mapper knows, so it falls through to the documented
    // safe default -- the exact PHOTO->IMAGE etc. mappings are unit
    // tested in evidence-type-code.mapper.spec.ts.
    expect(promoted.body.type).toBe('DOCUMENT');
    expect(promoted.body.fileUrl).toBe('https://storage.example.com/evidence/garden.jpg');
    expect(promoted.body.textContent).toBe('Fotos do canteiro pronto para o plantio.');
    expect(promoted.body.tags).toEqual(['horta', 'catálogo']);

    // It's a real row in the same table the PDF/dossier renderer reads.
    const listed = await supertest(app.getHttpServer())
      .get(portfolioBase(familyAId))
      .set('Cookie', familyACookie)
      .expect(200);
    expect(listed.body.some((item: { id: string }) => item.id === promoted.body.id)).toBe(true);
  });

  it('rejects promoting an evidence submission that has not been validated yet', async () => {
    const submission = await createEvidenceSubmission(familyACookie, familyAId, familyALearnerId);

    await supertest(app.getHttpServer())
      .post(`${portfolioBase(familyAId)}/from-evidence-submission/${submission.id}`)
      .set('Cookie', familyACookie)
      .send({ title: 'Ainda não validado' })
      .expect(400);
  });

  it('rejects promoting the same evidence submission twice', async () => {
    const submission = await createEvidenceSubmission(familyACookie, familyAId, familyALearnerId);
    await supertest(app.getHttpServer())
      .patch(`${evidenceBase(familyAId)}/${submission.id}/validation`)
      .set('Cookie', familyACookie)
      .send({ status: 'VALIDATED' })
      .expect(200);

    await supertest(app.getHttpServer())
      .post(`${portfolioBase(familyAId)}/from-evidence-submission/${submission.id}`)
      .set('Cookie', familyACookie)
      .send({ title: 'Primeira promoção' })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`${portfolioBase(familyAId)}/from-evidence-submission/${submission.id}`)
      .set('Cookie', familyACookie)
      .send({ title: 'Segunda tentativa' })
      .expect(400);
  });

  it('rejects promoting a nonexistent evidence submission, 404 not 500', async () => {
    await supertest(app.getHttpServer())
      .post(`${portfolioBase(familyAId)}/from-evidence-submission/00000000-0000-0000-0000-000000000000`)
      .set('Cookie', familyACookie)
      .send({ title: 'X' })
      .expect(404);
  });

  it('tenant isolation: family B cannot promote a family A evidence submission into its own portfolio', async () => {
    const submission = await createEvidenceSubmission(familyACookie, familyAId, familyALearnerId);
    await supertest(app.getHttpServer())
      .patch(`${evidenceBase(familyAId)}/${submission.id}/validation`)
      .set('Cookie', familyACookie)
      .send({ status: 'VALIDATED' })
      .expect(200);

    // FamilyTenantGuard on the portfolio route itself blocks family B from
    // acting through family A's URL prefix at all (403); the deeper
    // family-scoped lookup inside getEvidenceSubmissionForPortfolio is a
    // second, independent line of defense against a spoofed id even if
    // that guard were ever bypassed.
    await supertest(app.getHttpServer())
      .post(`${portfolioBase(familyAId)}/from-evidence-submission/${submission.id}`)
      .set('Cookie', familyBCookie)
      .send({ title: 'Tentativa de outra família' })
      .expect(403);
  });

  it('rejects an unauthenticated request', async () => {
    await supertest(app.getHttpServer())
      .post(`${portfolioBase(familyAId)}/from-evidence-submission/00000000-0000-0000-0000-000000000000`)
      .send({ title: 'X' })
      .expect(401);
  });
});
