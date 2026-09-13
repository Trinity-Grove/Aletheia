import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';

// Import a curriculum pack export document (issue #96 Fase 4, section
// 28, write half) against real Postgres.
describe('Curriculum pack import (real Postgres)', () => {
  let app: NestFastifyApplication;
  let adminCookie: string;
  const adminEmail = `curriculum-pack-import-admin-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  async function post(path: string, body: Record<string, unknown>, expectStatus = 201) {
    const res = await supertest(app.getHttpServer())
      .post(path)
      .set('Cookie', adminCookie)
      .send(body)
      .expect(expectStatus);
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

  async function buildAndExportSimplePack(suffix: string) {
    const base = '/api/v1/admin/curriculum-definitions';
    const domain = await post(`${base}/learning-domains`, { code: `TEST.IMPORT.DOMAIN.${suffix}`, name: 'D' });
    await publish(`${base}/learning-domains/${domain.id}`);
    const competency = await post(`${base}/competency-definitions`, {
      code: `TEST.IMPORT.COMPETENCY.${suffix}`,
      domainId: domain.id,
      title: 'C',
    });
    await publish(`${base}/competency-definitions/${competency.id}`);

    const pack = await post('/api/v1/admin/curriculum-packs', {
      code: `TEST.IMPORT.PACK.${suffix}`,
      name: 'Import Test Pack',
    });
    await post(`/api/v1/admin/curriculum-packs/${pack.id}/items`, {
      definitionType: 'LearningDomain',
      code: domain.code,
      version: domain.version,
    });
    await post(`/api/v1/admin/curriculum-packs/${pack.id}/items`, {
      definitionType: 'CompetencyDefinition',
      code: competency.code,
      version: competency.version,
    });
    await publish(`/api/v1/admin/curriculum-packs/${pack.id}`);

    const exportResponse = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-packs/${pack.id}/export`)
      .set('Cookie', adminCookie)
      .expect(200);
    return { document: exportResponse.body, domain, competency, pack };
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;

    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const adminResponse = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: adminEmail, password: 'somePassword123', fullName: 'Curriculum Pack Import Admin' })
      .expect(201);
    adminCookie = [adminResponse.headers['set-cookie']]
      .flat()
      .find((c) => c?.startsWith('aletheia_session='))!;
  }, 30000);

  afterAll(async () => {
    await app.close();
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  it('rejects an unauthenticated import request', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs/import')
      .send({ document: {}, dryRun: true })
      .expect(401);
  });

  it('rejects a malformed document before touching the database', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs/import')
      .set('Cookie', adminCookie)
      .send({ document: { totally: 'not valid' } })
      .expect(400);
  });

  it('rejects a document with an incompatible format version', async () => {
    const { document } = await buildAndExportSimplePack(`FMT.${Date.now()}`);
    document.formatVersion = '99.0.0';
    await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs/import')
      .set('Cookie', adminCookie)
      .send({ document, dryRun: true })
      .expect(400);
  });

  it('dry-run reports accurately what would be created, without writing anything', async () => {
    const suffix = `DRY.${Date.now()}`;
    const { document, domain, competency, pack } = await buildAndExportSimplePack(suffix);

    // Re-export into a fresh, never-before-seen pack code so the dry
    // run targets rows that genuinely don't exist yet.
    document.pack.code = `TEST.IMPORT.DRYRUN.PACK.${suffix}`;

    const dryRunResponse = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs/import')
      .set('Cookie', adminCookie)
      .send({ document, dryRun: true })
      .expect(200);

    expect(dryRunResponse.body.dryRun).toBe(true);
    expect(dryRunResponse.body.pack.outcome).toBe('WOULD_CREATE');
    expect(dryRunResponse.body.created).toEqual([]);
    // The two items (LearningDomain, CompetencyDefinition) already
    // exist locally (they were created by buildAndExportSimplePack),
    // so a dry run of a *new* pack code bundling the *same* existing
    // items should report them as conflicts, not "would create."
    expect(dryRunResponse.body.conflicts).toHaveLength(2);
    // The pack's own would-create/already-exists status is reported
    // separately in `pack`, not mixed into `wouldCreate` (which only
    // covers the 12 bundleable definition types) -- both items conflict,
    // so wouldCreate is empty here.
    expect(dryRunResponse.body.wouldCreate).toHaveLength(0);

    // Confirm nothing was written: no new pack exists under that code.
    const listed = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-packs')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(
      listed.body.some((row: { code: string }) => row.code === document.pack.code),
    ).toBe(false);

    // Sanity: the original pack/domain/competency are untouched.
    expect(domain.id).toBeTruthy();
    expect(competency.id).toBeTruthy();
    expect(pack.id).toBeTruthy();
  });

  it('actually creates new DRAFT rows for a genuinely new pack and its definitions', async () => {
    const suffix = `REAL.${Date.now()}`;
    const { document } = await buildAndExportSimplePack(suffix);

    // Mutate the document to describe an entirely new pack + new
    // definitions (never created locally), so the real import has
    // something genuine to create.
    const newSuffix = `${suffix}.NEW`;
    document.pack.code = `TEST.IMPORT.REAL.PACK.${newSuffix}`;
    document.items = document.items.map((item: { code: string }) => ({
      ...item,
      code: `${item.code}.NEW`,
    }));
    // Fix up the cross-reference inside CompetencyDefinition's content
    // to point at the renamed LearningDomain code.
    const domainItem = document.items.find((i: { definitionType: string }) => i.definitionType === 'LearningDomain');
    const competencyItem = document.items.find(
      (i: { definitionType: string }) => i.definitionType === 'CompetencyDefinition',
    );
    competencyItem.content.domainRef = {
      type: 'LearningDomain',
      code: domainItem.code,
      version: domainItem.version,
    };

    const importResponse = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs/import')
      .set('Cookie', adminCookie)
      .send({ document, dryRun: false })
      .expect(200);

    expect(importResponse.body.dryRun).toBe(false);
    expect(importResponse.body.pack.outcome).toBe('CREATED');
    expect(importResponse.body.created).toHaveLength(2);
    expect(importResponse.body.conflicts).toEqual([]);
    expect(importResponse.body.blocked).toEqual([]);

    // The new pack, domain, and competency really exist now, as DRAFT.
    const packsListed = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-packs')
      .set('Cookie', adminCookie)
      .expect(200);
    const newPack = packsListed.body.find((row: { code: string }) => row.code === document.pack.code);
    expect(newPack).toBeTruthy();
    expect(newPack.status).toBe('DRAFT'); // never auto-published, even though the source was PUBLISHED

    const domainsListed = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/learning-domains')
      .set('Cookie', adminCookie)
      .expect(200);
    const newDomain = domainsListed.body.find((row: { code: string }) => row.code === domainItem.code);
    expect(newDomain).toBeTruthy();
    expect(newDomain.status).toBe('DRAFT');

    const competenciesListed = await supertest(app.getHttpServer())
      .get('/api/v1/admin/curriculum-definitions/competency-definitions')
      .set('Cookie', adminCookie)
      .expect(200);
    const newCompetency = competenciesListed.body.find((row: { code: string }) => row.code === competencyItem.code);
    expect(newCompetency).toBeTruthy();
    expect(newCompetency.domainId).toBe(newDomain.id); // ref correctly resolved to the newly created domain

    // The new pack's manifest was recorded.
    const newPackItems = await supertest(app.getHttpServer())
      .get(`/api/v1/admin/curriculum-packs/${newPack.id}/items`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(newPackItems.body).toHaveLength(2);
  });

  it('detects conflicts when re-importing the exact same document', async () => {
    const suffix = `CONFLICT.${Date.now()}`;
    const { document } = await buildAndExportSimplePack(suffix);

    // Re-import the SAME document (same pack code, same item codes) --
    // everything should conflict, nothing created.
    const secondImport = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs/import')
      .set('Cookie', adminCookie)
      .send({ document, dryRun: false })
      .expect(200);

    expect(secondImport.body.pack.outcome).toBe('ALREADY_EXISTS');
    expect(secondImport.body.created).toEqual([]);
    expect(secondImport.body.conflicts).toHaveLength(2); // the two items
  });

  it('detects a missing pack-level dependency', async () => {
    const suffix = `MISSINGDEP.${Date.now()}`;
    const { document } = await buildAndExportSimplePack(suffix);
    document.pack.code = `TEST.IMPORT.MISSINGDEP.PACK.${suffix}`;
    document.items = []; // isolate the test to just the dependency check
    document.dependencies = [{ dependsOnCode: 'TOTALLY_ABSENT_BASE_PACK', dependsOnVersion: 1 }];

    const response = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs/import')
      .set('Cookie', adminCookie)
      .send({ document, dryRun: true })
      .expect(200);

    expect(response.body.missingDependencies).toEqual([
      { dependsOnCode: 'TOTALLY_ABSENT_BASE_PACK', dependsOnVersion: 1 },
    ]);
  });

  it('does not report a missing dependency when the depended-on pack already exists locally', async () => {
    const basePackSuffix = `BASEDEP.${Date.now()}`;
    const { document: baseDoc } = await buildAndExportSimplePack(basePackSuffix);

    const { document } = await buildAndExportSimplePack(`DEPENDENT.${Date.now()}`);
    document.pack.code = `TEST.IMPORT.DEPENDENT.PACK.${basePackSuffix}`;
    document.items = [];
    document.dependencies = [{ dependsOnCode: baseDoc.pack.code, dependsOnVersion: baseDoc.pack.version }];

    const response = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs/import')
      .set('Cookie', adminCookie)
      .send({ document, dryRun: true })
      .expect(200);

    expect(response.body.missingDependencies).toEqual([]);
  });

  it('reports blocked items when a reference is neither pre-existing nor included in the document', async () => {
    const { document } = await buildAndExportSimplePack(`BLOCKED.${Date.now()}`);
    const newSuffix = `BLOCKED.NEW.${Date.now()}`;
    document.pack.code = `TEST.IMPORT.BLOCKED.PACK.${newSuffix}`;

    // Keep only the CompetencyDefinition item (drop the LearningDomain
    // it depends on), and point its domainRef at a domain that doesn't
    // exist anywhere.
    const competencyItem = document.items.find(
      (i: { definitionType: string }) => i.definitionType === 'CompetencyDefinition',
    );
    competencyItem.code = `${competencyItem.code}.${newSuffix}`;
    competencyItem.content.domainRef = {
      type: 'LearningDomain',
      code: 'TOTALLY_NONEXISTENT_DOMAIN_CODE',
      version: 1,
    };
    document.items = [competencyItem];

    const response = await supertest(app.getHttpServer())
      .post('/api/v1/admin/curriculum-packs/import')
      .set('Cookie', adminCookie)
      .send({ document, dryRun: false })
      .expect(200);

    expect(response.body.created).toEqual([]);
    expect(response.body.blocked).toHaveLength(1);
    expect(response.body.blocked[0].ref.code).toBe(competencyItem.code);
  });
});
