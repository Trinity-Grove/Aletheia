import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Export a published CurriculumPack into a portable JSON document
// (issue #96 Fase 4, section 28, read half) against real Postgres.
describe('Curriculum pack export (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  const adminEmail = `curriculum-pack-export-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const suffix = Date.now();

  async function post(path: string, body: Record<string, unknown>) {
    const res = await supertest(app.getHttpServer())
      .post(path)
      .set('Cookie', adminCookie)
      .send(body)
      .expect(201);
    return res.body;
  }

  async function publish(path: string) {
    const res = await supertest(app.getHttpServer())
      .patch(`${path}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);
    return res.body;
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Curriculum Pack Export Admin' })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;
  }, 30000);

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('produces a valid, complete, self-contained export document', async () => {
    const base = '/api/v1/admin/curriculum-definitions';

    const domain = await post(`${base}/learning-domains`, {
      code: `TEST.EXPORT.DOMAIN.${suffix}`,
      name: 'Export Test Domain',
    });
    await publish(`${base}/learning-domains/${domain.id}`);

    const competency = await post(`${base}/competency-definitions`, {
      code: `TEST.EXPORT.COMPETENCY.${suffix}`,
      domainId: domain.id,
      title: 'Export Test Competency',
    });
    await publish(`${base}/competency-definitions/${competency.id}`);

    const rubric = await post(`${base}/rubric-definitions`, {
      code: `TEST.EXPORT.RUBRIC.${suffix}`,
      name: 'Export Test Rubric',
      competencyId: competency.id,
    });
    await post(`${base}/rubric-definitions/${rubric.id}/criteria`, {
      code: 'CLARITY',
      label: 'Clareza',
      weight: 2,
    });
    await publish(`${base}/rubric-definitions/${rubric.id}`);

    const evidenceType = await post(`${base}/evidence-type-definitions`, {
      code: `TEST.EXPORT.EVIDENCE.${suffix}`,
      name: 'Export Test Evidence Type',
    });
    await publish(`${base}/evidence-type-definitions/${evidenceType.id}`);

    const activity = await post(`${base}/activity-definitions`, {
      code: `TEST.EXPORT.ACTIVITY.${suffix}`,
      name: 'Export Test Activity',
    });
    await post(`${base}/activity-definitions/${activity.id}/competencies`, { competencyId: competency.id });
    await post(`${base}/activity-definitions/${activity.id}/evidence-types`, { evidenceTypeId: evidenceType.id });
    await publish(`${base}/activity-definitions/${activity.id}`);

    const curriculum = await post(`${base}/curriculum-definitions`, {
      code: `TEST.EXPORT.CURRICULUM.${suffix}`,
      name: 'Export Test Curriculum',
    });
    await post(`${base}/curriculum-definitions/${curriculum.id}/domains`, { domainId: domain.id });
    await post(`${base}/curriculum-definitions/${curriculum.id}/competencies`, { competencyId: competency.id });
    await post(`${base}/curriculum-definitions/${curriculum.id}/rubrics`, { rubricId: rubric.id });
    await post(`${base}/curriculum-definitions/${curriculum.id}/activities`, { activityId: activity.id });
    await publish(`${base}/curriculum-definitions/${curriculum.id}`);

    const tradition = await post(`${base}/theological-tradition-definitions`, {
      code: `TEST.EXPORT.TRADITION.${suffix}`,
      name: 'Export Test Tradition',
    });
    await publish(`${base}/theological-tradition-definitions/${tradition.id}`);

    const position = await post(`${base}/theological-position-definitions`, {
      code: `TEST.EXPORT.POSITION.${suffix}`,
      topic: 'soteriology',
      name: 'Export Test Position',
      traditionId: tradition.id,
    });
    await publish(`${base}/theological-position-definitions/${position.id}`);

    const translation = await post(`${base}/bible-translation-definitions`, {
      code: `TESTNVI${suffix}`.slice(0, 20),
      name: 'Export Test Translation',
      language: 'pt',
      youVersionId: '999999',
    });
    await publish(`${base}/bible-translation-definitions/${translation.id}`);

    // Assemble the pack manifest and publish the pack itself.
    const pack = await post('/api/v1/admin/curriculum-packs', {
      code: `TEST.EXPORT.PACK.${suffix}`,
      name: 'Export Test Pack',
      description: 'A pack bundling one of every definition type for export testing.',
    });

    const manifest: Array<{ definitionType: string; code: string; version: number }> = [
      { definitionType: 'LearningDomain', code: domain.code, version: domain.version },
      { definitionType: 'CompetencyDefinition', code: competency.code, version: competency.version },
      { definitionType: 'RubricDefinition', code: rubric.code, version: rubric.version },
      { definitionType: 'EvidenceTypeDefinition', code: evidenceType.code, version: evidenceType.version },
      { definitionType: 'ActivityDefinition', code: activity.code, version: activity.version },
      { definitionType: 'CurriculumDefinition', code: curriculum.code, version: curriculum.version },
      { definitionType: 'TheologicalTraditionDefinition', code: tradition.code, version: tradition.version },
      { definitionType: 'TheologicalPositionDefinition', code: position.code, version: position.version },
      { definitionType: 'BibleTranslationDefinition', code: translation.code, version: translation.version },
    ];
    for (const item of manifest) {
      await post(`/api/v1/admin/curriculum-packs/${pack.id}/items`, item);
    }
    await post(`/api/v1/admin/curriculum-packs/${pack.id}/dependencies`, {
      dependsOnCode: 'SOME_BASE_PACK_NOT_PRESENT',
      dependsOnVersion: 1,
    });
    await publish(`/api/v1/admin/curriculum-packs/${pack.id}`);

    const exportResponse = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-packs/${pack.id}/export`)
      .set('Cookie', adminCookie)
      .expect(200);

    const doc = exportResponse.body;
    expect(doc.formatVersion).toBe('1.0.0');
    expect(typeof doc.exportedAt).toBe('string');
    expect(doc.pack.code).toBe(pack.code);
    expect(doc.pack.status).toBe('PUBLISHED');
    expect(doc.dependencies).toEqual([{ dependsOnCode: 'SOME_BASE_PACK_NOT_PRESENT', dependsOnVersion: 1 }]);
    expect(doc.items).toHaveLength(manifest.length);

    function findItem(type: string) {
      return doc.items.find((i: { definitionType: string }) => i.definitionType === type);
    }

    // Every FK reference inside content is a portable {type, code, version}
    // pointer, not a raw UUID.
    const competencyItem = findItem('CompetencyDefinition');
    expect(competencyItem.content.domainRef).toEqual({
      type: 'LearningDomain',
      code: domain.code,
      version: domain.version,
    });

    const rubricItem = findItem('RubricDefinition');
    expect(rubricItem.content.competencyRef).toEqual({
      type: 'CompetencyDefinition',
      code: competency.code,
      version: competency.version,
    });
    expect(rubricItem.content.criteria).toEqual([
      expect.objectContaining({ code: 'CLARITY', label: 'Clareza', weight: 2 }),
    ]);

    const activityItem = findItem('ActivityDefinition');
    expect(activityItem.content.competencyLinks).toEqual([
      expect.objectContaining({
        ref: { type: 'CompetencyDefinition', code: competency.code, version: competency.version },
      }),
    ]);
    expect(activityItem.content.evidenceTypeLinks).toEqual([
      expect.objectContaining({
        ref: { type: 'EvidenceTypeDefinition', code: evidenceType.code, version: evidenceType.version },
      }),
    ]);

    const curriculumItem = findItem('CurriculumDefinition');
    expect(curriculumItem.content.domainLinks).toEqual([
      expect.objectContaining({ ref: { type: 'LearningDomain', code: domain.code, version: domain.version } }),
    ]);
    expect(curriculumItem.content.activityLinks).toEqual([
      expect.objectContaining({ ref: { type: 'ActivityDefinition', code: activity.code, version: activity.version } }),
    ]);

    const positionItem = findItem('TheologicalPositionDefinition');
    expect(positionItem.content.traditionRef).toEqual({
      type: 'TheologicalTraditionDefinition',
      code: tradition.code,
      version: tradition.version,
    });

    const translationItem = findItem('BibleTranslationDefinition');
    expect(translationItem.content.youVersionId).toBe('999999');

    // No raw UUIDs anywhere in the serialized document -- portability
    // means the receiving database's IDs don't need to match this one's.
    const serialized = JSON.stringify(doc);
    expect(serialized).not.toContain(domain.id);
    expect(serialized).not.toContain(competency.id);
    expect(serialized).not.toContain(rubric.id);
    expect(serialized).not.toContain(activity.id);
    expect(serialized).not.toContain(curriculum.id);
    expect(serialized).not.toContain(tradition.id);
  }, 30000);

  it('rejects exporting a DRAFT pack', async () => {
    const pack = await post('/api/v1/admin/curriculum-packs', {
      code: `TEST.EXPORT.DRAFT.${Date.now()}`,
      name: 'Draft Pack',
    });
    await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-packs/${pack.id}/export`)
      .set('Cookie', adminCookie)
      .expect(400);
  });

  it('rejects exporting a pack whose manifest references a definition that no longer exists', async () => {
    const pack = await post('/api/v1/admin/curriculum-packs', {
      code: `TEST.EXPORT.BROKEN.${Date.now()}`,
      name: 'Broken Pack',
    });
    await post(`/api/v1/admin/curriculum-packs/${pack.id}/items`, {
      definitionType: 'LearningDomain',
      code: 'TEST.NEVER.CREATED.DOMAIN',
      version: 1,
    });
    await publish(`/api/v1/admin/curriculum-packs/${pack.id}`);

    await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-packs/${pack.id}/export`)
      .set('Cookie', adminCookie)
      .expect(400);
  });

  it('rejects an unauthenticated export request', async () => {
    const pack = await post('/api/v1/admin/curriculum-packs', {
      code: `TEST.EXPORT.AUTH.${Date.now()}`,
      name: 'Auth Pack',
    });
    await publish(`/api/v1/admin/curriculum-packs/${pack.id}`);
    await supertest(app.getHttpServer()).get(`/api/v1/admin/curriculum-packs/${pack.id}/export`).expect(401);
  });
});
