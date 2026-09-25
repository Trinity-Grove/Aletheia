import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { CurriculumTemplateEngine } from '../src/modules/curriculum/infrastructure/curriculum-template.engine.js';

type FamilyFixture = { cookie: string; familyId: string; learnerId: string; academicYearId: string };

// Issue #95: applyTemplate now weights the resolved subject set by the
// family's PedagogicalProfile (when one exists) as a soft ranking signal
// only -- never a filter. This proves, against real Postgres and real
// migration-seeded pedagogical model catalog data (CLASSICAL_TRIVIUM,
// MONTESSORI, CHARLOTTE_MASON -- see
// 20260910200000_seed_published_pedagogical_catalog):
//
//  (a) a family with no PedagogicalProfile gets the exact same response
//      shape as before this change -- byte-for-byte, no new field.
//  (b) a family whose profile shares subjects with the applied template's
//      cross-cutting content gets a measurably reordered relevance list,
//      in the expected direction, with every original subject still
//      present (no filtering).
//  (c) applying a template for one family never reads or is influenced by
//      another family's profile.
describe('PedagogicalProfile-weighted applyTemplate (real Postgres, issue #95)', () => {
  let app: NestFastifyApplication;
  const engine = new CurriculumTemplateEngine();

  async function register(email: string): Promise<string> {
    const response = await supertest(app.getHttpServer()).post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Weighting Acceptance', countryCode: 'BRA', acceptedTermsOfUse: true, acceptedPrivacyPolicy: true }).expect(201);
    const cookie = [response.headers['set-cookie']].flat()
      .find((value) => value?.startsWith('aletheia_session='));
    expect(cookie).toBeDefined();
    return cookie!;
  }

  async function family(label: string): Promise<FamilyFixture> {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const cookie = await register(`weighting-${label}-${unique}@example.com`);
    const created = await supertest(app.getHttpServer()).post('/api/v1/families')
      .set('Cookie', cookie).send({ name: `Weighting ${label}`, countryCode: 'BR' }).expect(201);
    const familyId = created.body.id as string;
    const learner = await supertest(app.getHttpServer()).post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', cookie).send({ firstName: 'Learner', birthDate: '2017-03-10', acceptedDataConsent: true }).expect(201);
    const year = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/curriculum/academic-years`).set('Cookie', cookie)
      .send({ year: 2026, title: 'Weighting acceptance year', isCurrent: true }).expect(201);
    return { cookie, familyId, learnerId: learner.body.id, academicYearId: year.body.id };
  }

  async function setPedagogicalProfile(target: FamilyFixture, body: Record<string, unknown>) {
    return supertest(app.getHttpServer())
      .put(`/api/v1/families/${target.familyId}/curriculum/pedagogical-profile`)
      .set('Cookie', target.cookie).send(body).expect(200);
  }

  function apply(target: FamilyFixture, template: string) {
    return supertest(app.getHttpServer())
      .post(`/api/v1/families/${target.familyId}/curriculum/templates/apply`)
      .set('Cookie', target.cookie)
      .send({ learnerId: target.learnerId, academicYearId: target.academicYearId, template });
  }

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('is unchanged (byte-for-byte, no subjectRelevance) for a family with no PedagogicalProfile', async () => {
    const target = await family('no-profile');
    const expectedSubjects = engine.getTemplateDefinitions('CLASSICAL_TRIVIUM');
    const expectedObjectives = expectedSubjects.reduce((sum, s) => sum + s.starterObjectives.length, 0);

    const applied = await apply(target, 'CLASSICAL_TRIVIUM').expect(201);

    expect(applied.body).toEqual({
      subjectsCount: expectedSubjects.length,
      objectivesCount: expectedObjectives,
    });
    expect('subjectRelevance' in applied.body).toBe(false);
  });

  it('measurably reorders relevance toward subjects shared with the weighted profile models', async () => {
    const target = await family('with-profile');
    // MONTESSORI and CHARLOTTE_MASON share every CROSS_CUTTING_SUBJECTS
    // entry with CLASSICAL_TRIVIUM (curriculum-template.engine.ts appends
    // the same cross-cutting list to every framework); CLASSICAL_TRIVIUM's
    // own framework-specific subjects (e.g. "Latim & Línguas Clássicas")
    // are not present in either.
    await setPedagogicalProfile(target, {
      primaryModelCode: 'MONTESSORI',
      secondaryModels: [{ code: 'CHARLOTTE_MASON', weight: 0.5 }],
    });

    const classicalSubjects = engine.getTemplateDefinitions('CLASSICAL_TRIVIUM');
    const montessoriNames = new Set(engine.getTemplateDefinitions('MONTESSORI').map((s) => s.name));
    const charlotteNames = new Set(engine.getTemplateDefinitions('CHARLOTTE_MASON').map((s) => s.name));
    const sharedNames = classicalSubjects
      .map((s) => s.name)
      .filter((name) => montessoriNames.has(name) && charlotteNames.has(name));
    const classicalOnlyNames = classicalSubjects
      .map((s) => s.name)
      .filter((name) => !montessoriNames.has(name) && !charlotteNames.has(name));
    expect(sharedNames.length).toBeGreaterThan(0);
    expect(classicalOnlyNames.length).toBeGreaterThan(0);

    const applied = await apply(target, 'CLASSICAL_TRIVIUM').expect(201);

    // No filtering: every original subject is still represented.
    expect(applied.body.subjectRelevance).toHaveLength(classicalSubjects.length);
    expect(new Set(applied.body.subjectRelevance.map((r: any) => r.name)))
      .toEqual(new Set(classicalSubjects.map((s) => s.name)));

    // Measurable, directional change: every shared (boosted) subject sorts
    // strictly ahead of every classical-only (unboosted) subject.
    const order = applied.body.subjectRelevance.map((r: any) => r.name);
    const lastSharedIndex = Math.max(...sharedNames.map((name) => order.indexOf(name)));
    const firstClassicalOnlyIndex = Math.min(...classicalOnlyNames.map((name) => order.indexOf(name)));
    expect(lastSharedIndex).toBeLessThan(firstClassicalOnlyIndex);

    for (const name of sharedNames) {
      const entry = applied.body.subjectRelevance.find((r: any) => r.name === name);
      expect(entry.relevanceScore).toBe(1.5); // primary (1) + secondary (0.5)
    }
    for (const name of classicalOnlyNames) {
      const entry = applied.body.subjectRelevance.find((r: any) => r.name === name);
      expect(entry.relevanceScore).toBe(0);
    }
  });

  it('never reads or is influenced by another family\'s PedagogicalProfile', async () => {
    const withProfile = await family('isolation-a');
    const withoutProfile = await family('isolation-b');
    await setPedagogicalProfile(withProfile, { primaryModelCode: 'MONTESSORI' });

    const appliedForIsolatedFamily = await apply(withoutProfile, 'CLASSICAL_TRIVIUM').expect(201);

    // familyB has no profile of its own -- family A's profile must not
    // leak into its result.
    expect('subjectRelevance' in appliedForIsolatedFamily.body).toBe(false);
  });
});
